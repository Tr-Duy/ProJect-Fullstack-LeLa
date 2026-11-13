package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VoiceTurnResponse(
        int turnNumber,
        String aiReply,
        List<String> grammarErrors,
        String correctedSentence,
        String quickSuggestion,
        List<VoiceTargetWordDto> updatedTargetWords,
        int validTurnCount,
        boolean sessionEnded,
        String endReason,
        UserEvaluationDto evaluation,
        Boolean degraded,
        String errorCode,
        String intendedUtterance,
        Boolean isCompleted,
        String feedbackLine,
        List<VoiceSuggestionDto> suggestions,
        String intentConfidence,
        int aiAttempts,
        int aiRetries,
        String modelUsed
) {
    public VoiceTurnResponse(int number, String reply, List<String> errors, String corrected,
            String quick, List<VoiceTargetWordDto> words, int count, boolean ended, String reason,
            UserEvaluationDto evaluation, Boolean degraded, String error, String intended, Boolean completed,
            String feedbackLine, List<VoiceSuggestionDto> suggestions, String confidence) {
        this(number, reply, errors, corrected, quick, words, count, ended, reason, evaluation,
                degraded, error, intended, completed, feedbackLine, suggestions, confidence, 0, 0, null);
    }
    public VoiceTurnResponse(int number, String reply, List<String> errors, String corrected,
            String quick, List<VoiceTargetWordDto> words, int count, boolean ended, String reason,
            UserEvaluationDto evaluation, Boolean degraded, String error, String intended, Boolean completed) {
        this(number, reply, errors, corrected, quick, words, count, ended, reason, evaluation,
                degraded, error, intended, completed, "", List.of(), null);
    }
    public VoiceTurnResponse(int number, String reply, List<String> errors, String corrected,
            String quick, List<VoiceTargetWordDto> words, int count, boolean ended, String reason,
            UserEvaluationDto evaluation, Boolean degraded, String error, String intended, Boolean completed,
            String feedbackLine, List<VoiceSuggestionDto> suggestions) {
        this(number, reply, errors, corrected, quick, words, count, ended, reason, evaluation,
                degraded, error, intended, completed, feedbackLine, suggestions, null);
    }
    @JsonProperty("userEvaluation")
    public UserEvaluationDto getUserEvaluation() {
        return evaluation;
    }
}
