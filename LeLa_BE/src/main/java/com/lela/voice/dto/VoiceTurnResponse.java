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
        Boolean isCompleted
) {
    @JsonProperty("userEvaluation")
    public UserEvaluationDto getUserEvaluation() {
        return evaluation;
    }
}
