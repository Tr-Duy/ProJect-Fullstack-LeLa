package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VoiceTurnRequest(
        String transcript,
        BigDecimal sttConfidence,
        Integer clientElapsedSeconds,
        Boolean isRetry,
        List<String> alternatives,
        String previousAiQuestion,
        List<SttAlternativeDto> alternativeDetails
) {
    public VoiceTurnRequest(String transcript, BigDecimal confidence, Integer elapsed, Boolean retry,
            List<String> alternatives, String question) {
        this(transcript, confidence, elapsed, retry, alternatives, question, List.of());
    }
}
