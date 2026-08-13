package com.lela.users.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String avatarUrl;
    private String timezone;
    private Integer dailyGoalCards;
    private Long nativeLanguageId;
    private Long targetLanguageId;
}
