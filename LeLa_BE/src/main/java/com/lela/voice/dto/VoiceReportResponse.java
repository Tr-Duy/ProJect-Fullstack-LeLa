package com.lela.voice.dto;

import java.util.List;

public record VoiceReportResponse(
        String publicId,
        int overallScore,
        Integer pronunciationScore, // NULL
        int grammarScore,
        int fluencyScore,
        int vocabularyScore,
        String systemRecommendation, // 'INCREASE', 'KEEP', 'DECREASE'
        String userFeedback,
        int oldLevel,
        int newLevel,
        int xpAwarded,
        boolean consecutiveHardWarning,
        List<VoiceTargetWordDto> targetWords,
        List<VoiceTurnCorrectionDto> corrections
) {}
