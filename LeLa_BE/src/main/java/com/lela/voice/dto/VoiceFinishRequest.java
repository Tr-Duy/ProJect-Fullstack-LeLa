package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VoiceFinishRequest(
        String feedback // 'HARD', 'COMFORTABLE', 'EASY', 'SKIPPED'
) {}
