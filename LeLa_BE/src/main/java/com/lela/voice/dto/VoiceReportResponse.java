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
        List<VoiceTurnCorrectionDto> corrections,
        boolean vocabularyScoreAvailable,
        String coachSummary
) {
    public VoiceReportResponse(String id, int overall, Integer pronunciation, int grammar, int fluency, int vocabulary,
            String recommendation, String feedback, int oldLevel, int newLevel, int xp, boolean warning,
            List<VoiceTargetWordDto> words, List<VoiceTurnCorrectionDto> corrections, boolean vocabularyAvailable) {
        this(id, overall, pronunciation, grammar, fluency, vocabulary, recommendation, feedback,
                oldLevel, newLevel, xp, warning, words, corrections, vocabularyAvailable, null);
    }

    public VoiceReportResponse withCoachSummary(String summary) {
        return new VoiceReportResponse(publicId, overallScore, pronunciationScore, grammarScore, fluencyScore,
                vocabularyScore, systemRecommendation, userFeedback, oldLevel, newLevel, xpAwarded,
                consecutiveHardWarning, targetWords, corrections, vocabularyScoreAvailable, summary);
    }
}
