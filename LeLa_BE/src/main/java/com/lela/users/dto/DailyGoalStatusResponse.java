package com.lela.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyGoalStatusResponse {
    private boolean shouldShow;
    private boolean goalConfirmed;
    private LocalDate goalDate;
    private Integer targetCards;
}
