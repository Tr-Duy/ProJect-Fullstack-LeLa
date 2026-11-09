package com.lela.voice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserEvaluationDto {
    private Boolean isGood;
    @Builder.Default
    private Boolean hasError = false;
    private Integer score;
    private String status; // "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT"
    private String grammarCheck;
    private String phoneticTip;
    private String suggestedImprovement;
}

