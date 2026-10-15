package com.lela.voice.dto;

import java.util.List;

public record VoiceStatusResponse(
        boolean unlocked,
        long learnedCardsCount,
        long requiredCardsCount,
        int remainingQuota,
        int maxSessionsPerDay,
        String nextResetAt,
        int currentLevel,
        int initialBandMin,
        int highestLevel,
        int totalSessions,
        int consecutiveHardCount,
        boolean hasInProgressSession,
        String inProgressPublicId,
        VoiceUiConfigDto uiConfig
) {}
