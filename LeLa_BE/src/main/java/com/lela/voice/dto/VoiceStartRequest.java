package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VoiceStartRequest(
        String scenarioSlug,
        Long scenarioId
) {}
