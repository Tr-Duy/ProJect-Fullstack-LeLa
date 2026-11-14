package com.lela.ai.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/** Buffered generation: only a provider STOP response is a complete answer. */
@Service
@Slf4j
@RequiredArgsConstructor
public class TutorGenerationService {
    private final GeminiClient client;
    private final ObjectMapper mapper;
    private final Map<String, Instant> exhaustedUntil = new ConcurrentHashMap<>();
    @Value("${gemini.tutor-call-timeout-seconds:40}")
    int timeoutSeconds = 40;
    @Value("${gemini.tutor-retry-delay-ms:1000}")
    long retryDelayMs = 1000;

    public AiChatResponse generate(GeminiRequest request, String requestId) {
        for (String model : new LinkedHashSet<>(List.of(client.getPrimaryModel(), client.getFallbackModel()))) {
            if (exhaustedUntil.getOrDefault(model, Instant.MIN).isAfter(Instant.now())) continue;
            for (int attempt = 0; attempt < 2; attempt++) {
                long start = System.nanoTime();
                CompletableFuture<java.net.http.HttpResponse<String>> pending = null;
                try {
                    pending = client.generateContent(model, request);
                    var response = pending.get(timeoutSeconds, TimeUnit.SECONDS);
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
                    GeminiResponse result = mapper.readValue(response.body(), GeminiResponse.class);
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
                            result.getUsageMetadata(), complete ? null : "MAX_TOKENS".equals(reason) ? "AI_TRUNCATED" : "AI_INCOMPLETE", requestId);
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
            JsonNode details = mapper.readTree(body).path("error").path("details");
            for (JsonNode detail : details) for (JsonNode violation : detail.path("violations")) {
                String id = violation.path("quotaId").asText().toLowerCase(Locale.ROOT);
                if (id.contains("perday") || id.contains("daily")) return true;
            }
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
