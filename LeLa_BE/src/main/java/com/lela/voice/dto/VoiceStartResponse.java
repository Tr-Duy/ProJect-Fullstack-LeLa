package com.lela.voice.dto;

import java.util.List;

public record VoiceStartResponse(
        String publicId,
        String scenarioTitle,
        String aiRole,
        String userRole,
        String openingLine,
        int currentLevel,
        int durationSecondsLimit,
        int maxTurns,
        List<VoiceTargetWordDto> targetWords,
        VoiceUiConfigDto uiConfig
) {}
