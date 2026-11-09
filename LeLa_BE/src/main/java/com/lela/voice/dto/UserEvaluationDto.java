package com.lela.voice.dto;

public record UserEvaluationDto(
        Integer score,
        String feedback,
        String grammarCheck,
        String suggestedImprovement
) {}
