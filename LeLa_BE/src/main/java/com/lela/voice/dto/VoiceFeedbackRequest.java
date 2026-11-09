package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VoiceFeedbackRequest(
        @NotBlank(message = "Feedback không được để trống")
        @Pattern(regexp = "(?i)^(HARD|COMFORTABLE|EASY)$", message = "Feedback phải là HARD, COMFORTABLE hoặc EASY")
        String feedback
) {}

