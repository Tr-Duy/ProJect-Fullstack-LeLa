package com.lela.auth.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {
    @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
    @Pattern(regexp = "^$|^[\\p{L}\\s]{2,150}$", message = "Họ và tên chỉ bao gồm chữ cái và khoảng trắng")
    @Pattern(regexp = "^(?!\\d+$).*$", message = "Họ và tên không được chỉ gồm toàn chữ số")
    private String fullName;

    private String avatarUrl;
    private String timezone;
    private Integer dailyGoalCards;
    private Long nativeLanguageId;
    private Long targetLanguageId;
    private Boolean promptDailyGoal;
}
