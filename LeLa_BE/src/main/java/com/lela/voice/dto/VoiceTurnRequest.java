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
        String previousAiQuestion
) {}
