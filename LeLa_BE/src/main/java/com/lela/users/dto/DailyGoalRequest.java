package com.lela.users.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyGoalRequest {
    @NotNull(message = "Số lượng thẻ mục tiêu không được để trống")
    @Min(value = 1, message = "Số lượng thẻ mục tiêu tối thiểu là 1")
    @Max(value = 100, message = "Số lượng thẻ mục tiêu tối đa là 100")
    private Integer targetCards;
}
