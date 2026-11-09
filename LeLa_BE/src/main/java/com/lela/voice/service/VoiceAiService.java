package com.lela.voice.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.dto.GeminiResponse;
import com.lela.ai.service.GeminiClient;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceAiService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final VoiceConfigurationProperties props;
    private final VocabularyWhitelistService whitelistService;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EvaluationAiOutput {
        @JsonProperty("isGood")
        @Builder.Default
        private Boolean isGood = true;

        @JsonProperty("hasError")
        @Builder.Default
        private Boolean hasError = false;

        @JsonProperty("score")
        @Builder.Default
        private Integer score = 80;

        @JsonProperty("status")
        @Builder.Default
        private String status = "GOOD"; // "EXCELLENT", "GOOD", "NEEDS_IMPROVEMENT"

        @JsonProperty("grammarCheck")
        private String grammarCheck;

        @JsonProperty("phoneticTip")
        private String phoneticTip;

        @JsonProperty("suggestedImprovement")
        private String suggestedImprovement;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TurnAiOutput {
        @JsonProperty("intendedUtterance")
        private String intendedUtterance;

        @JsonProperty("evaluation")
        private EvaluationAiOutput evaluation;

        @JsonProperty("aiReply")
        private String aiReply;

        @JsonProperty("isCompleted")
        @Builder.Default
        private Boolean isCompleted = false;

        @JsonProperty("grammarErrors")
        private List<String> grammarErrors;

        @JsonProperty("correctedSentence")
        private String correctedSentence;

        @JsonProperty("quickSuggestion")
        private String quickSuggestion;

        @JsonProperty("targetWordsUsedInTurn")
        private List<String> targetWordsUsedInTurn;

        @JsonProperty("degraded")
        @Builder.Default
        private Boolean degraded = false;

        @JsonProperty("errorCode")
        private String errorCode;

        @JsonProperty("tokensUsed")
        @Builder.Default
        private Integer tokensUsed = 0;
    }

    public TurnAiOutput generateTurnResponse(
            ConversationScenario scenario,
            int currentLevel,
            String userTranscript,
            List<String> targetWords,
            Set<String> whitelist,
            List<String> conversationHistory
    ) {
        return generateTurnResponse(scenario, currentLevel, userTranscript, targetWords, whitelist, conversationHistory, Collections.emptyList(), null);
    }

    /**
     * Sinh phản hồi AI cho lượt nói của người học với chiến lược Multi-Model, Structured JSON và Fallback an toàn.
     */
    public TurnAiOutput generateTurnResponse(
            ConversationScenario scenario,
            int currentLevel,
            String userTranscript,
            List<String> targetWords,
            Set<String> whitelist,
            List<String> conversationHistory,
            List<String> alternatives,
            String previousAiQuestion
    ) {
        long startTime = System.currentTimeMillis();

        String promptText = buildPrompt(scenario, previousAiQuestion, conversationHistory, userTranscript, alternatives);

        GeminiRequest request = GeminiRequest.builder()
                .contents(List.of(
                        GeminiRequest.Content.builder()
                                .role("user")
                                .parts(List.of(new GeminiRequest.Part(promptText)))
                                .build()
                ))
                .generationConfig(GeminiRequest.GenerationConfig.builder()
                        .temperature(0.3)
                        .maxOutputTokens(500)
                        .responseMimeType("application/json")
                        .responseSchema(buildResponseSchema())
                        .build())
                .build();

        String primaryModel = geminiClient.getPrimaryModel();
        String fallbackModel = geminiClient.getFallbackModel();

        // 1. Gọi Model chính (ví dụ: gemini-3.5-flash)
        TurnAiOutput result = executeModelWithResilience(primaryModel, request, userTranscript, scenario, startTime, true);
        if (result != null && !Boolean.TRUE.equals(result.getDegraded())) {
            return result;
        }

        String primaryError = (result != null && result.getErrorCode() != null) ? result.getErrorCode() : "PRIMARY_MODEL_FAILED";
        log.warn("[VoiceAiService] Model chính {} không thành công ({}). Chuyển sang model dự phòng {}",
                primaryModel, primaryError, fallbackModel);

        // 2. Gọi Model dự phòng (ví dụ: gemini-flash-lite-latest)
        TurnAiOutput fallbackResult = executeModelWithResilience(fallbackModel, request, userTranscript, scenario, startTime, false);
        if (fallbackResult != null && !Boolean.TRUE.equals(fallbackResult.getDegraded())) {
            return fallbackResult;
        }

        String finalError = (fallbackResult != null && fallbackResult.getErrorCode() != null) ? fallbackResult.getErrorCode() : primaryError;
        log.warn("[VoiceAiService] Cả model chính và model dự phòng đều không thể phản hồi ({}). Kích hoạt Degraded Mode HTTP 200.", finalError);

        // 3. Cả 2 model đều lỗi -> Trả degraded = true, evaluation = null, aiReply mặc định theo kịch bản (HTTP 200)
        return createFallbackOutput(scenario, userTranscript, finalError);
    }

    private TurnAiOutput executeModelWithResilience(
            String model,
            GeminiRequest request,
            String userTranscript,
            ConversationScenario scenario,
            long startTime,
            boolean isPrimary
    ) {
        int maxAttempts = 2;
        String lastError = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            long remainingTotalTime = (props.getTotalTurnTimeoutSeconds() * 1000L) - (System.currentTimeMillis() - startTime);
            if (remainingTotalTime <= 1000) {
                log.warn("[VoiceAiService] Model {} chạm ngưỡng total turn timeout, dừng attempt.", model);
                return createFallbackOutput(scenario, userTranscript, "TIMEOUT");
            }

            long callStart = System.currentTimeMillis();
            try {
                CompletableFuture<HttpResponse<String>> future = geminiClient.generateContent(model, request);
                int timeoutSec = Math.min(props.getGeminiCallTimeoutSeconds(), (int) (remainingTotalTime / 1000));
                HttpResponse<String> response = future.get(Math.max(2, timeoutSec), TimeUnit.SECONDS);
                long elapsedMs = System.currentTimeMillis() - callStart;

                String rawBody = response.body();
                log.debug("[VoiceAiService] Model: {}, Status: {}, Elapsed: {}ms, Body: {}", model, response.statusCode(), elapsedMs, rawBody);

                if (response.statusCode() == 200 && rawBody != null) {
                    TurnAiOutput output = parseAiOutput(rawBody, userTranscript);
                    if (output != null && output.getAiReply() != null && !output.getAiReply().isBlank()) {
                        log.info("[VoiceAiService] Model: {} thành công sau {}ms (Attempt {})", model, elapsedMs, attempt);
                        output.setTokensUsed(400);
                        output.setDegraded(false);
                        return output;
                    }
                    log.warn("[VoiceAiService] Parse JSON từ model {} thất bại lần {}", model, attempt);
                    lastError = "GEMINI_PARSE_ERROR";
                    // Retry 1 lần nếu parse lỗi
                    continue;
                }

                if (response.statusCode() == 429) {
                    boolean isDailyQuota = rawBody != null && (rawBody.contains("per day") || rawBody.contains("RESOURCE_EXHAUSTED"));
                    log.warn("[VoiceAiService] Model {} gặp lỗi 429 (isDaily: {}).", model, isDailyQuota);
                    lastError = "GEMINI_HTTP_429";
                    if (isDailyQuota || isPrimary) {
                        // 429 theo ngày hoặc là primary model: không retry mà chuyển model ngay
                        break;
                    }
                    // 429 theo phút: backoff ngắn
                    try {
                        Thread.sleep(attempt * 800L);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }

                // Lỗi 5xx hoặc mã khác
                log.warn("[VoiceAiService] Model {} trả về HTTP status {}", model, response.statusCode());
                lastError = "GEMINI_HTTP_" + response.statusCode();
                try {
                    Thread.sleep(attempt * 500L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }

            } catch (TimeoutException te) {
                long elapsedMs = System.currentTimeMillis() - callStart;
                log.warn("[VoiceAiService] Model {} timeout sau {}ms (Attempt {})", model, elapsedMs, attempt);
                lastError = "TIMEOUT";
            } catch (Exception e) {
                long elapsedMs = System.currentTimeMillis() - callStart;
                log.error("[VoiceAiService] Model {} gọi thất bại sau {}ms: {}", model, elapsedMs, e.getMessage());
                lastError = "GEMINI_NETWORK_ERROR";
            }
        }

        return createFallbackOutput(scenario, userTranscript, lastError != null ? lastError : "MODEL_CALL_FAILED");
    }

    /**
     * Lưới an toàn extract JSON thuần từ chuỗi bất kỳ:
     * - Loại bỏ code fences ```json hoặc ```
     * - Cắt đoạn từ dấu '{' đầu tiên đến dấu '}' cuối cùng
     */
    public static String extractJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return "{}";
        }
        String text = raw.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        text = text.trim();

        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace >= firstBrace) {
            return text.substring(firstBrace, lastBrace + 1).trim();
        }
        return text;
    }

    public TurnAiOutput parseAiOutput(String rawBody, String originalTranscript) {
        if (rawBody == null || rawBody.isBlank()) {
            return null;
        }
        try {
            // Trường hợp Gemini bọc trong response chuẩn
            String jsonToParse = rawBody;
            try {
                GeminiResponse geminiResponse = objectMapper.readValue(rawBody, GeminiResponse.class);
                if (geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()) {
                    jsonToParse = geminiResponse.getCandidates().get(0).getContent().getParts().get(0).getText();
                }
            } catch (Exception ignored) {
                // Nếu rawBody là JSON trực tiếp của payload
            }

            String extracted = extractJson(jsonToParse);
            TurnAiOutput output = objectMapper.readValue(extracted, TurnAiOutput.class);
            return validateAndNormalize(output, originalTranscript);
        } catch (Exception e) {
            log.warn("[VoiceAiService] Không thể parse JSON từ AI output: {}, raw: {}", e.getMessage(), rawBody);
            return null;
        }
    }

    public TurnAiOutput validateAndNormalize(TurnAiOutput output, String originalTranscript) {
        if (output == null) {
            return null;
        }
        if (output.getIntendedUtterance() == null || output.getIntendedUtterance().isBlank()) {
            output.setIntendedUtterance(originalTranscript);
        }
        if (output.getEvaluation() != null) {
            EvaluationAiOutput eval = output.getEvaluation();
            int score = eval.getScore() != null ? eval.getScore() : 75;
            if (score > 0 && score <= 10) {
                score = score * 10;
            }
            score = Math.max(0, Math.min(100, score));

            Boolean hasError = eval.getHasError() != null ? eval.getHasError() : false;

            // Quy tắc: Chỉ khi hasError == true mới trừ điểm và chặn score <= 84.
            // Nếu câu đúng mà chỉ có thể nói tự nhiên hơn (hasError == false) thì giữ điểm cao, được phép EXCELLENT (>= 85).
            if (Boolean.TRUE.equals(hasError) && score >= 85) {
                score = 84;
            }
            eval.setScore(score);

            if (score >= 85) {
                eval.setStatus("EXCELLENT");
            } else if (score >= 60) {
                eval.setStatus("GOOD");
            } else {
                eval.setStatus("NEEDS_IMPROVEMENT");
            }

            if (eval.getIsGood() == null) {
                eval.setIsGood(!Boolean.TRUE.equals(hasError));
            }
            if (eval.getPhoneticTip() == null) {
                eval.setPhoneticTip("");
            }
            if (eval.getGrammarCheck() == null || eval.getGrammarCheck().isBlank()) {
                eval.setGrammarCheck(Boolean.TRUE.equals(hasError) ? "Cần lưu ý cấu trúc câu" : "Ngữ pháp chính xác");
            }
        }
        if (output.getIsCompleted() == null) {
            output.setIsCompleted(false);
        }
        if (output.getDegraded() == null) {
            output.setDegraded(false);
        }
        return output;
    }

    public TurnAiOutput createFallbackOutput(ConversationScenario scenario, String userTranscript, String errorCode) {
        String fallbackReply = "That sounds interesting! Could you tell me a little bit more about that?";
        try {
            if (scenario != null && scenario.getFallbackLinesJson() != null && !scenario.getFallbackLinesJson().isBlank()) {
                List<String> lines = objectMapper.readValue(scenario.getFallbackLinesJson(), List.class);
                if (lines != null && !lines.isEmpty()) {
                    fallbackReply = lines.get(new Random().nextInt(lines.size()));
                }
            }
        } catch (Exception ignored) {}

        return TurnAiOutput.builder()
                .intendedUtterance(userTranscript)
                .aiReply(fallbackReply)
                .evaluation(null)
                .isCompleted(false)
                .grammarErrors(Collections.emptyList())
                .correctedSentence(userTranscript)
                .quickSuggestion("Could you please tell me more?")
                .targetWordsUsedInTurn(Collections.emptyList())
                .degraded(true)
                .errorCode(errorCode != null ? errorCode : "DEGRADED_MODE")
                .tokensUsed(0)
                .build();
    }

    public String buildPrompt(
            ConversationScenario scenario,
            String lastAiQuestion,
            List<String> history,
            String transcript,
            List<String> alternatives
    ) {
        String role = scenario != null ? scenario.getAiRole() : "Barista";
        String scenarioName = scenario != null ? scenario.getTitle() : "Coffee Shop";
        String previousQuestion = (lastAiQuestion != null && !lastAiQuestion.isBlank())
                ? lastAiQuestion
                : (scenario != null ? scenario.getOpeningLine() : "How can I help you?");
        String historyStr = (history != null && !history.isEmpty()) ? String.join("; ", history) : "Beginning of conversation";
        String alternativesStr = (alternatives != null && !alternatives.isEmpty()) ? String.join(", ", alternatives) : "None";

        return """
                You are playing the role of %s in this scenario: %s. You are also an English speaking coach.
                The learner's speech was transcribed by browser Speech-to-Text, which often mishears similar-sounding words (e.g. "horse" for "hot", "eyes" for "iced", "tree" for "three").
                Previous question you asked: "%s"
                Recent conversation: %s
                STT best transcript: "%s"
                STT alternatives: %s

                Tasks:
                1. Infer what the learner most likely MEANT, using the question you asked, the scenario context, and STT alternatives:
                   - Field "intendedUtterance": ONLY replace words that were misheard by STT due to phonetic similarity (e.g. replace "horse" with "hot", "eyes" with "iced").
                   - CRITICAL: You MUST KEEP the learner's original grammar, vocabulary, and phrasing intact! DO NOT rewrite it to make it polite, more formal, or grammatically correct in this field.
                     * If the learner said "I like horse coffee", intendedUtterance MUST be "I like hot coffee" (KEEP "I like", DO NOT change to "I'd like" or "I would like").
                     * If the learner said "I like eyes coffee", intendedUtterance MUST be "I like iced coffee" (KEEP "I like", DO NOT change to "I'd like").
                     * Rewriting for politeness or correct grammar belongs STRICTLY in suggestedImprovement.
                2. Evaluate the intended utterance:
                   - Field "hasError": Set to true if the learner's utterance has actual grammar errors, incorrect vocabulary, or is off-topic. Set to false if the sentence is grammatically correct and on-topic, even if it could be expressed more naturally or politely.
                   - Field "suggestedImprovement": If hasError is true, provide the grammatically corrected sentence. If hasError is false but there is a more natural/polite phrasing, provide that phrasing. If the sentence is already completely natural and error-free, set suggestedImprovement to empty string ("").
                   - Scoring Rules (score: 0 - 100):
                     * EXCELLENT (score >= 85): Allowed ONLY when hasError is false! If the sentence has no real errors (hasError = false), grant high score (85-100) and EXCELLENT, even if a more natural phrasing is suggested in suggestedImprovement.
                     * If hasError is true (actual grammar, vocab, or off-topic mistake): The score MUST NOT exceed 84 (status must be GOOD: 60-84, or NEEDS_IMPROVEMENT: < 60).
                     * GOOD (60 - 84): Relevant and understandable, but has grammar/vocab flaws (hasError = true) or could be improved.
                     * NEEDS_IMPROVEMENT (< 60): Off-topic, inappropriate, or has severe grammatical flaws.
                     Do NOT claim to score pronunciation precisely, since you only see text.
                3. Reply in character with the next line of the scenario (1–2 short sentences, A2–B1 level).
                Write grammarCheck and phoneticTip in Vietnamese (do NOT imply listening to voice audio, label phonetic tip as helpful pronunciation tip). Write aiReply and suggestedImprovement in English. Output JSON only.
                """.formatted(role, scenarioName, previousQuestion, historyStr, transcript, alternativesStr);
    }

    private Map<String, Object> buildResponseSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("intendedUtterance", Map.of(
                "type", "string",
                "description", "Spoken sentence with ONLY STT phonetic errors replaced. Keep original grammar and phrasing intact. Never rewrite for politeness or grammar."
        ));
        properties.put("aiReply", Map.of("type", "string"));
        properties.put("isCompleted", Map.of("type", "boolean"));

        Map<String, Object> evalProps = new LinkedHashMap<>();
        evalProps.put("isGood", Map.of("type", "boolean"));
        evalProps.put("hasError", Map.of(
                "type", "boolean",
                "description", "true if utterance has actual grammar, vocabulary, or relevance errors. false if utterance is correct and only has suggestions for more natural phrasing."
        ));
        evalProps.put("score", Map.of(
                "type", "integer",
                "description", "Score 0-100. Max 84 if hasError is true. 85-100 allowed if hasError is false."
        ));
        evalProps.put("status", Map.of("type", "string", "enum", List.of("EXCELLENT", "GOOD", "NEEDS_IMPROVEMENT")));
        evalProps.put("grammarCheck", Map.of("type", "string"));
        evalProps.put("phoneticTip", Map.of("type", "string"));
        evalProps.put("suggestedImprovement", Map.of(
                "type", "string",
                "description", "Polite or more natural English alternative. Empty string if no improvement is needed."
        ));

        Map<String, Object> evalSchema = new LinkedHashMap<>();
        evalSchema.put("type", "object");
        evalSchema.put("properties", evalProps);
        evalSchema.put("required", List.of("isGood", "hasError", "score", "status", "grammarCheck", "phoneticTip", "suggestedImprovement"));

        properties.put("evaluation", evalSchema);

        schema.put("properties", properties);
        schema.put("required", List.of("intendedUtterance", "aiReply", "isCompleted", "evaluation"));
        return schema;
    }
}
