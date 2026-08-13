package com.lela.users.dto;

import com.lela.users.domain.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsersCreateRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String email;
    @NotBlank
    private String password;
    @NotBlank
    private String fullName;
    @NotBlank
    private String avatarUrl;
    @NotNull
    private Long nativeLanguageId;
    @NotNull
    private Long targetLanguageId;
    @NotNull
    private UserStatus status;
    @NotBlank
    private String timezone;
    @NotNull
    private Integer dailyGoalCards;
}
