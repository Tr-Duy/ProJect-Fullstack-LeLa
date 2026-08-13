package com.lela.users.dto;

import com.lela.users.domain.UserStatus;
import com.lela.language.dto.LanguageResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UsersResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private java.util.Set<String> roles;
    private LanguageResponse nativeLanguage;
    private LanguageResponse targetLanguage;
    private com.lela.common.dto.ExamTypeDTO currentExamType;
    private com.lela.common.dto.ProficiencyLevelDTO currentLevel;
    private UserStatus status;
    private String timezone;
    private Integer dailyGoalCards;
    private Long xpTotal;
    private Integer streakCurrent;
    private Integer streakLongest;
    private LocalDate lastActivityDate;
    private LocalDateTime lastActiveAt;
    private LocalDateTime emailVerifiedAt;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
