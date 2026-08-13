package com.lela.users.dto;

import com.lela.users.domain.UserStatus;
import lombok.Data;

@Data
public class UsersPatchRequest {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String avatarUrl;
    private Long nativeLanguageId;
    private Long targetLanguageId;
    private UserStatus status;
    private String timezone;
    private Integer dailyGoalCards;
}
