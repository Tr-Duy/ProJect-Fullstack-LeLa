package com.lela.auth.dto;

import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String avatarUrl;
        private Set<String> roles;
        private String timezone;
        private Integer dailyGoalCards;
        private Long nativeLanguageId;
        private Long targetLanguageId;
        private Boolean promptDailyGoal;
        private ExamTypeDTO currentExamType;
        private ProficiencyLevelDTO currentLevel;
    }
}
