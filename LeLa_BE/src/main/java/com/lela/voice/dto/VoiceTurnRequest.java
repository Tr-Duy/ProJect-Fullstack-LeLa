package com.lela.voice.dto;

import java.math.BigDecimal;

public record VoiceTurnRequest(
        String transcript,
        BigDecimal sttConfidence,
        Integer clientElapsedSeconds,
        Boolean isRetry
) {}
