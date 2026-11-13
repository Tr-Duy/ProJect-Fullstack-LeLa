package com.lela.voice.dto;

public record VoiceUiConfigDto(
        double ttsRate,
        boolean bilingualSupport,
        boolean autoHintOnSilence,
        int silenceThresholdSeconds,
        int autoCommitSilenceMs,
        int incompleteExtraMs,
        int hintAfterSilenceMs,
        java.util.List<String> inputModes,
        String configVersion
) {}
