package com.lela.voice.dto;

public record VoiceFinishRequest(
        String feedback // 'HARD', 'COMFORTABLE', 'EASY', 'SKIPPED'
) {}
