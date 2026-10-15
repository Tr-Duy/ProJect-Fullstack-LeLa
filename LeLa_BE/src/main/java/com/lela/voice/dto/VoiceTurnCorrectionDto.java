package com.lela.voice.dto;

import java.util.List;

public record VoiceTurnCorrectionDto(
        int turnNumber,
        String originalTranscript,
        List<String> errors,
        String correctedText
) {}
