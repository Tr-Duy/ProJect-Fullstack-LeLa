package com.lela.achievement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AchievementAdminRequest {

    @NotBlank(message = "Mã thành tựu (code) không được để trống")
    @Size(max = 100, message = "Mã không được quá 100 ký tự")
    private String code;

    @NotBlank(message = "Tiêu đề thành tựu không được để trống")
    @Size(max = 200, message = "Tiêu đề không được quá 200 ký tự")
    private String title;

    @Size(max = 500, message = "Mô tả không được quá 500 ký tự")
    private String description;

    private String iconUrl;

    @NotBlank(message = "Danh mục (category) không được để trống")
    private String category;

    @NotBlank(message = "Loại điều kiện (conditionType) không được để trống")
    private String conditionType;

    @NotNull(message = "Giá trị điều kiện (conditionValue) không được để trống")
    @Min(value = 1, message = "Giá trị điều kiện phải lớn hơn 0")
    private Integer conditionValue;

    @NotNull(message = "Phần thưởng XP không được để trống")
    @Min(value = 1, message = "Phần thưởng XP phải lớn hơn 0")
    private Integer xpReward;

    private Boolean isActive = true;
}
