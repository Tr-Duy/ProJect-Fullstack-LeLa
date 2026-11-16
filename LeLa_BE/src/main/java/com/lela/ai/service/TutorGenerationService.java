package com.lela.ai.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/** Buffered generation: only a provider STOP response is a complete answer. */
@Service
@Slf4j
public class TutorGenerationService {
    private final GeminiClient client;
    private final ObjectMapper mapper;
    private final TutorModelRouter router;
    private final Map<String, Instant> exhaustedUntil = new ConcurrentHashMap<>();

    @Value("${gemini.tutor-call-timeout-seconds:70}")
    int timeoutSeconds = 70;
    @Value("${gemini.tutor-primary-timeout-seconds:70}")
    int primaryTimeoutSeconds = 70;
    @Value("${gemini.tutor-lite-timeout-seconds:30}")
    int liteTimeoutSeconds = 30;
    @Value("${gemini.tutor-retry-delay-ms:1000}")
    long retryDelayMs = 1000;

    @Value("${gemini.tutor-stream-model:gemini-3.6-flash}")
    String streamModel = "gemini-3.6-flash";
    @Value("${gemini.tutor-lite-model:gemini-3.5-flash-lite}")
    String liteModel = "gemini-3.5-flash-lite";
    @Value("${gemini.tutor-lite-enabled:true}")
    boolean liteEnabled = true;

    @Autowired
    public TutorGenerationService(GeminiClient client, ObjectMapper mapper, TutorModelRouter router) {
        this.client = client;
        this.mapper = mapper;
        this.router = router != null ? router : new TutorModelRouter();
    }

    public TutorGenerationService(GeminiClient client, ObjectMapper mapper) {
        this(client, mapper, new TutorModelRouter());
    }

    public AiChatResponse generateStream(GeminiRequest request, String requestId, String mode,
            java.util.function.Consumer<String> delta, java.util.function.BooleanSupplier cancelled) {
        var timings = new TutorTimings();
        var text = new StringBuilder();

        String promptText = "";
        if (request.getContents() != null && !request.getContents().isEmpty()) {
            var lastContent = request.getContents().get(request.getContents().size() - 1);
            if (lastContent.getParts() != null && !lastContent.getParts().isEmpty()) {
                promptText = lastContent.getParts().get(0).getText();
            }
        }

        router.setPrimaryModel(streamModel);
        router.setLiteModel(liteModel);
        router.setLiteEnabled(liteEnabled);

        String selected = router.selectModel(mode, promptText);
        String thinking = router.determineThinkingLevel(selected, mode, promptText);

        if (request.getGenerationConfig() == null) {
            request.setGenerationConfig(GeminiRequest.GenerationConfig.builder().build());
        }
        request.getGenerationConfig().setThinkingConfig(new GeminiRequest.ThinkingConfig(null, thinking));

        final var usage = new GeminiResponse.UsageMetadata[]{null};
        final String[] reason = {null}, version = {selected};

        // Two-way fallback: lite -> primary OR primary -> lite
        List<String> candidateModels = selected.equals(liteModel)
                ? List.of(liteModel, streamModel)
                : List.of(streamModel, liteModel);

        for (String model : new LinkedHashSet<>(candidateModels)) {
            if (exhaustedUntil.getOrDefault(model, Instant.MIN).isAfter(Instant.now())) continue;
            int modelTimeout = model.equals(liteModel) ? liteTimeoutSeconds : primaryTimeoutSeconds;

            for (int attempt = 0; attempt < 2; attempt++) {
                if (cancelled.getAsBoolean()) throw new CancellationException();
                timings.setAttempts(timings.getAttempts() + 1);
                if (attempt > 0) timings.setRetries(timings.getRetries() + 1);
                if (!model.equals(selected) && attempt == 0) timings.setFallbacks(timings.getFallbacks() + 1);

                long started = System.nanoTime();
                java.net.http.HttpResponse<java.io.InputStream> response = null;
                CompletableFuture<java.net.http.HttpResponse<java.io.InputStream>> pending = null;
                try {
                    pending = client.streamGenerateContent(model, request);
                    response = pending.get(modelTimeout, TimeUnit.SECONDS);
                    final var body = response.body();
                    final var finished = new java.util.concurrent.atomic.AtomicBoolean();

                    // Closing the response body also stops a stalled read after Stop/disconnect.
                    Thread watchdog = Thread.startVirtualThread(() -> {
                        try {
                            while (!finished.get()) {
                                if (cancelled.getAsBoolean() || System.nanoTime() - started > TimeUnit.SECONDS.toNanos(modelTimeout)) {
                                    try { body.close(); } catch (java.io.IOException ignored) {}
                                    return;
                                }
                                Thread.sleep(100);
                            }
                        } catch (InterruptedException ignored) {
                            Thread.currentThread().interrupt();
                        }
                    });
                    try (body) {
                        log.info("Tutor stream call requestId={} model={} attempt={} status={}",requestId,model,attempt+1,response.statusCode());
                        if (response.statusCode()!=200) {
                            String error=new String(body.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
                            if(response.statusCode()==429 && isDailyQuota(error)) {
                                exhaustedUntil.put(model,Instant.now().plusSeconds(3600));break;
                            }
                            if((response.statusCode()==429||response.statusCode()>=500)&&attempt==0) {backoff();continue;}
                            break;
                        }
                        var measured=new java.io.FilterInputStream(body) {
                            public int read(byte[] bytes,int offset,int length)throws java.io.IOException {
                                int n=super.read(bytes,offset,length);
                                if(n>0 && timings.getProviderFirstByteMs()==0)timings.setProviderFirstByteMs((System.nanoTime()-started)/1_000_000.0);
                                return n;
                            }
                        };
                        TutorSseReader.read(measured,json->{
                            if(cancelled.getAsBoolean())throw new CancellationException();
                            long parse=System.nanoTime();
                            try {
                                if("[DONE]".equals(json)) return;
                                if(mapper.readTree(json).has("error"))throw new IllegalStateException("PROVIDER_STREAM_ERROR");
                                var chunk=mapper.readValue(json,GeminiResponse.class);
                                if(chunk.getModelVersion()!=null)version[0]=chunk.getModelVersion();
                                if(chunk.getUsageMetadata()!=null)usage[0]=chunk.getUsageMetadata(); // cumulative, never sum chunks
                                if(chunk.getCandidates()!=null && !chunk.getCandidates().isEmpty()) {
                                    var candidate=chunk.getCandidates().get(0);
                                    if(candidate.getFinishReason()!=null)reason[0]=candidate.getFinishReason();
                                    if(candidate.getContent()!=null && candidate.getContent().getParts()!=null)
                                        for(var part:candidate.getContent().getParts())
                                            if(!Boolean.TRUE.equals(part.getThought()) && part.getText()!=null && !part.getText().isEmpty()) {
                                                if(timings.getProviderFirstTextMs()==0)timings.setProviderFirstTextMs((System.nanoTime()-started)/1_000_000.0);
                                                text.append(part.getText());delta.accept(part.getText());
                                            }
                                }
                            } catch(com.fasterxml.jackson.core.JsonProcessingException malformed) {
                                throw new IllegalStateException("PROVIDER_STREAM_INVALID",malformed);
                            } finally {timings.setParseMs(timings.getParseMs()+(System.nanoTime()-parse)/1_000_000.0);}
                        });
                        if(cancelled.getAsBoolean())throw new CancellationException();
                        timings.setProviderTotalMs((System.nanoTime()-started)/1_000_000.0);
                        boolean complete="STOP".equals(reason[0])&&!text.toString().isBlank();
                        log.info("Tutor stream result requestId={} model={} finishReason={} usage={}",requestId,version[0],reason[0],usage[0]);
                        return new AiChatResponse(text.toString(),reason[0]==null?"INTERRUPTED":reason[0],complete,version[0],usage[0],complete?null:"AI_INCOMPLETE",requestId,timings);
                    } finally {finished.set(true);watchdog.interrupt();}
                } catch(CancellationException cancelledRequest) {throw cancelledRequest;}
                catch(InterruptedException interrupted) {Thread.currentThread().interrupt();throw new CancellationException();}
                catch(Exception failure) {
                    if(pending!=null)pending.cancel(true);
                    if(cancelled.getAsBoolean())throw new CancellationException();
                    log.warn("Tutor stream transport requestId={} model={} failureType={}",requestId,model,failure.getClass().getSimpleName());
                    // Once text is visible, never splice a retry/fallback into the same answer.
                    if(!text.isEmpty())return new AiChatResponse(text.toString(),"INTERRUPTED",false,version[0],usage[0],"AI_CONNECTION",requestId,timings);
                    if(attempt==0)try {backoff();} catch(InterruptedException interrupted) {Thread.currentThread().interrupt();throw new CancellationException();}
                }
            }
        }
        return new AiChatResponse("","ERROR",false,selected,null,"AI_BUSY",requestId,timings);
    }

    public AiChatResponse generate(GeminiRequest request, String requestId) {
        TutorTimings timings=new TutorTimings();
        for (String model : new LinkedHashSet<>(List.of(client.getPrimaryModel(), client.getFallbackModel()))) {
            if (exhaustedUntil.getOrDefault(model, Instant.MIN).isAfter(Instant.now())) continue;
            for (int attempt = 0; attempt < 2; attempt++) {
                timings.setAttempts(timings.getAttempts()+1);
                if (attempt>0) timings.setRetries(timings.getRetries()+1);
                if (!model.equals(client.getPrimaryModel()) && attempt==0) timings.setFallbacks(timings.getFallbacks()+1);
                long start = System.nanoTime();
                CompletableFuture<java.net.http.HttpResponse<String>> pending = null;
                try {
                    pending = client.generateContent(model, request);
                    var response = pending.get(timeoutSeconds, TimeUnit.SECONDS);
                    if (response instanceof GeminiClient.MeasuredResponse measured) {
                        timings.setProviderFirstByteMs(measured.firstByteMs());timings.setProviderTotalMs(measured.totalMs());
                    }
                    int status = response.statusCode();
                    // Metadata only: no prompts, generated text, provider body or credentials.
                    log.info("Tutor call requestId={} model={} attempt={} status={} durationMs={}",
                            requestId, model, attempt + 1, status, (System.nanoTime() - start) / 1_000_000);
                    if (status == 429 && isDailyQuota(response.body())) {
                        exhaustedUntil.put(model, Instant.now().plusSeconds(3600));
                        break;
                    }
                    if (status == 429 || status >= 500) {
                        if (attempt == 0) { backoff(); continue; }
                        break;
                    }
                    if (status != 200) break;
                    long parseStarted=System.nanoTime();
                    GeminiResponse result = mapper.readValue(response.body(), GeminiResponse.class);
                    timings.setParseMs((System.nanoTime()-parseStarted)/1_000_000.0);
                    var candidate = result.getCandidates() == null || result.getCandidates().isEmpty()
                            ? null : result.getCandidates().get(0);
                    String reason = candidate == null ? "BLOCKED" : candidate.getFinishReason();
                    StringBuilder text = new StringBuilder();
                    if (candidate != null && candidate.getContent() != null && candidate.getContent().getParts() != null) {
                        for (var part : candidate.getContent().getParts()) {
                            if (!Boolean.TRUE.equals(part.getThought()) && part.getText() != null) text.append(part.getText());
                        }
                    }
                    // One explicit continuation, never an unbounded "keep generating" loop.
                    if ("MAX_TOKENS".equals(reason) && !text.toString().isBlank()) {
                        var contents=new ArrayList<>(request.getContents()==null ? List.<GeminiRequest.Content>of() : request.getContents());
                        contents.add(new GeminiRequest.Content("model",List.of(new GeminiRequest.Part(text.toString()))));
                        contents.add(new GeminiRequest.Content("user",List.of(new GeminiRequest.Part(
                                "Câu trả lời trước bị giới hạn độ dài. Hãy viết tiếp chính xác từ chỗ dừng, không nhắc lại phần đã viết, và kết thúc trọn vẹn."))));
                        var continuation=GeminiRequest.builder().systemInstruction(request.getSystemInstruction())
                                .generationConfig(request.getGenerationConfig()).contents(contents).build();
                        CompletableFuture<java.net.http.HttpResponse<String>> more=null;
                        try {
                            more=client.generateContent(model,continuation);
                            var continued=more.get(timeoutSeconds,TimeUnit.SECONDS);
                            log.info("Tutor continuation requestId={} model={} status={}",requestId,model,continued.statusCode());
                            if (continued.statusCode()==200) {
                                var next=mapper.readValue(continued.body(),GeminiResponse.class);
                                var nextCandidate=next.getCandidates()==null || next.getCandidates().isEmpty() ? null : next.getCandidates().get(0);
                                StringBuilder tail=new StringBuilder();
                                if (nextCandidate!=null && nextCandidate.getContent()!=null && nextCandidate.getContent().getParts()!=null)
                                    for (var part:nextCandidate.getContent().getParts())
                                        if (!Boolean.TRUE.equals(part.getThought()) && part.getText()!=null) tail.append(part.getText());
                                if (!tail.toString().isBlank()) {
                                    text.append(tail);
                                    reason=nextCandidate.getFinishReason();
                                    next.setUsageMetadata(sumUsage(result.getUsageMetadata(),next.getUsageMetadata()));
                                    result=next;
                                }
                            }
                        } catch (InterruptedException interrupted) {
                            if (more!=null) more.cancel(true);Thread.currentThread().interrupt();return unavailable(requestId);
                        } catch (Exception interruptedContinuation) {
                            if (more!=null) more.cancel(true);
                            log.warn("Tutor continuation requestId={} failureType={}",requestId,interruptedContinuation.getClass().getSimpleName());
                            // Keep the original explicit MAX_TOKENS status and partial text.
                        }
                    }
                    boolean complete = "STOP".equals(reason) && !text.toString().isBlank();
                    log.info("Tutor result requestId={} model={} finishReason={} usage={}",
                            requestId, result.getModelVersion(), reason, result.getUsageMetadata());
                    return new AiChatResponse(text.toString(), reason, complete, result.getModelVersion(),
                            result.getUsageMetadata(), complete ? null : "MAX_TOKENS".equals(reason) ? "AI_TRUNCATED" : "AI_INCOMPLETE", requestId,timings);
                } catch (InterruptedException interrupted) {
                    if (pending != null) pending.cancel(true);
                    Thread.currentThread().interrupt();
                    return unavailable(requestId);
                } catch (Exception failure) {
                    if (pending != null) pending.cancel(true);
                    log.warn("Tutor transport requestId={} model={} failureType={}", requestId, model, failure.getClass().getSimpleName());
                    if (attempt == 0) {
                        try { backoff(); } catch (InterruptedException interrupted) {
                            Thread.currentThread().interrupt(); return unavailable(requestId);
                        }
                    }
                }
            }
        }
        return unavailable(requestId);
    }
    boolean isDailyQuota(String body) {
        try {
            JsonNode tree = mapper.readTree(body);
            JsonNode details = tree.path("error").path("details");
            for (JsonNode detail : details) for (JsonNode violation : detail.path("violations")) {
                String id = violation.path("quotaId").asText().toLowerCase(Locale.ROOT);
                if (id.contains("perday") || id.contains("daily")) return true;
            }
            String message = tree.path("error").path("message").asText().toLowerCase(Locale.ROOT);
            if (message.contains("per day") || message.contains("daily") || message.contains("perday")) return true;
            return false;
        } catch (Exception malformed) { return false; } // Unknown 429: bounded retry, never an answer.
    }
    private void backoff() throws InterruptedException { if (retryDelayMs > 0) Thread.sleep(retryDelayMs); }
    private GeminiResponse.UsageMetadata sumUsage(GeminiResponse.UsageMetadata first,GeminiResponse.UsageMetadata second) {
        if (first==null) return second;if (second==null) return first;
        var total=new GeminiResponse.UsageMetadata();
        total.setPromptTokenCount(sum(first.getPromptTokenCount(),second.getPromptTokenCount()));
        total.setCandidatesTokenCount(sum(first.getCandidatesTokenCount(),second.getCandidatesTokenCount()));
        total.setThoughtsTokenCount(sum(first.getThoughtsTokenCount(),second.getThoughtsTokenCount()));
        total.setTotalTokenCount(sum(first.getTotalTokenCount(),second.getTotalTokenCount()));return total;
    }
    private Integer sum(Integer a,Integer b) { return a==null && b==null ? null : (a==null?0:a)+(b==null?0:b); }
    private AiChatResponse unavailable(String id) { return new AiChatResponse("", "ERROR", false, null, null, "AI_BUSY", id); }
}
