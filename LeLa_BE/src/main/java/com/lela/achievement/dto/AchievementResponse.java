package com.lela.achievement.dto;

import com.lela.achievement.domain.Achievement;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AchievementResponse {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String iconUrl;
    private String category;
    private String conditionType;
    private Integer conditionValue;
    private Integer xpReward;
    private Boolean isActive;
    private Long unlockedCount;

    public static AchievementResponse fromEntity(Achievement a, Long unlockedCount) {
        return AchievementResponse.builder()
                .id(a.getId())
                .code(a.getCode())
                .title(a.getTitle())
                .description(a.getDescription())
                .iconUrl(a.getIconUrl())
                .category(a.getCategory())
                .conditionType(a.getConditionType())
                .conditionValue(a.getConditionValue())
                .xpReward(a.getXpReward())
                .isActive(a.isActive())
                .unlockedCount(unlockedCount != null ? unlockedCount : 0L)
                .build();
    }
}
