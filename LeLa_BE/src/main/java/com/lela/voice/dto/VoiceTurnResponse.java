package com.lela.voice.dto;

import java.util.List;

public record VoiceTurnResponse(
        int turnNumber,
        String aiReply,
        List<String> grammarErrors,
        String correctedSentence,
        String quickSuggestion,
        List<VoiceTargetWordDto> updatedTargetWords,
        int validTurnCount,
        boolean sessionEnded,
        String endReason
) {}
