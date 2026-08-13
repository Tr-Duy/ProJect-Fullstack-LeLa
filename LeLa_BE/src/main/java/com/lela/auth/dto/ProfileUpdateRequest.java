package com.lela.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    private String fullName;
    private String avatarUrl;
    private String timezone;
    private Integer dailyGoalCards;
    private Long nativeLanguageId;
    private Long targetLanguageId;
    private Boolean promptDailyGoal;
}
