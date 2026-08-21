package com.lela.achievement.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class UserAchievementProgressResponse {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String iconUrl;
    private String category;
    private String conditionType;
    private Integer conditionValue;
    private Long currentValue;
    private Double progressPercent;
    private Integer xpReward;
    private Boolean isUnlocked;
    private LocalDateTime unlockedAt;
}
