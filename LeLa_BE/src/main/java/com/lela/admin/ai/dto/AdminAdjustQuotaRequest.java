package com.lela.admin.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAdjustQuotaRequest {

    @NotNull(message = "ID người dùng không được để trống")
    private Long userId;

    @NotNull(message = "Số phút điều chỉnh không được để trống")
    private Integer minutes;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    private String reason;
}
