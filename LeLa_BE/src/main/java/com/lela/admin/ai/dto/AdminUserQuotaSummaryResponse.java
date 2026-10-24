package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserQuotaSummaryResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private Integer totalSessionMinutes;
    private Integer totalAdjustedMinutes;
    private Integer netMinutes;
    private Integer todayUsedMinutes;
    private Integer remainingSessionsToday;
    private Integer currentLevel;
}
