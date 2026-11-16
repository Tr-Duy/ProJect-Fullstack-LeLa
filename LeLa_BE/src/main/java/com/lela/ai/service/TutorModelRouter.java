package com.lela.ai.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

/**
 * Deterministic model selection and routing rule engine for AI Tutor.
 * Routes lightweight/common learning modes and personalization queries to Lite model,
 * and deep analysis / long queries to Primary model.
 */
@Component
@Getter
@Setter
public class TutorModelRouter {

    @Value("${gemini.tutor-stream-model:gemini-3.6-flash}")
    private String primaryModel = "gemini-3.6-flash";

    @Value("${gemini.tutor-lite-model:gemini-3.5-flash-lite}")
    private String liteModel = "gemini-3.5-flash-lite";

    @Value("${gemini.tutor-lite-enabled:true}")
    private boolean liteEnabled = true;

    @Value("${gemini.tutor-long-prompt-threshold:160}")
    private int longPromptThreshold = 160;

    private static final Set<String> LITE_MODES = Set.of(
            "translation",
            "sentence",
            "sentence_correction",
            "vocabulary",
            "grammar",
            "explain"
    );

    public boolean isDeepAnalysis(String prompt) {
        if (prompt == null || prompt.isBlank()) return false;
        String lower = prompt.toLowerCase(Locale.ROOT);
        return lower.contains("đọc hiểu")
                || lower.contains("part 7")
                || lower.contains("nhiều phần")
                || lower.contains("phân tích sâu")
                || (lower.contains("bài tập vận dụng") && lower.contains("phân biệt"))
                || (lower.contains("giải thích chi tiết") && lower.length() > 100);
    }

    public boolean isPersonalization(String prompt) {
        if (prompt == null || prompt.isBlank()) return false;
        String lower = prompt.toLowerCase(Locale.ROOT);
        return lower.contains("lộ trình")
                || lower.contains("tiến độ")
                || lower.contains("ôn gì")
                || lower.contains("kế hoạch")
                || lower.contains("hôm nay")
                || lower.contains("mục tiêu")
                || lower.contains("gợi ý học");
    }

    public String selectModel(String mode, String prompt) {
        if (!liteEnabled) {
            return primaryModel;
        }

        // 1. Explicit deep analysis requests always route to primary model
        if (isDeepAnalysis(prompt)) {
            return primaryModel;
        }

        String normalizedMode = mode == null ? "chat" : mode.trim().toLowerCase(Locale.ROOT);

        // 2. Specialized learning modes (translation, sentence correction, vocabulary, grammar)
        if (LITE_MODES.contains(normalizedMode)) {
            return liteModel;
        }

        // 3. Chat mode routing:
        // Personalization queries (progress, review, roadmap) -> lite
        if (isPersonalization(prompt)) {
            return liteModel;
        }

        // Long prompt / deep questions (> threshold) -> primary
        if (prompt != null && prompt.length() > longPromptThreshold) {
            return primaryModel;
        }

        // Default quick questions in chat -> lite
        return liteModel;
    }

    public String determineThinkingLevel(String model, String mode, String prompt) {
        if (model != null && model.equals(liteModel)) {
            return "minimal";
        }
        if (isDeepAnalysis(prompt) || (prompt != null && prompt.length() > longPromptThreshold)) {
            return "low";
        }
        return "minimal";
    }
}
