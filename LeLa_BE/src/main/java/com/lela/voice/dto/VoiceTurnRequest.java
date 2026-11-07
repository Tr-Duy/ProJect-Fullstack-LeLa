package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VoiceTurnRequest(
        String transcript,
        BigDecimal sttConfidence,
        Integer clientElapsedSeconds,
        Boolean isRetry
) {}
