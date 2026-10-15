package com.lela.voice.dto;

public record VoiceUiConfigDto(
        double ttsRate,
        boolean bilingualSupport,
        boolean autoHintOnSilence,
        int silenceThresholdSeconds
) {}
