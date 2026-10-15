package com.lela.typinggame.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingLeaderboardEntryDto {
    private Integer rank;
    private Long userId;
    private String displayName;
    private String avatarUrl;
    private Integer score;
    private Integer stage;
    private BigDecimal wpm;
    private BigDecimal accuracy;
    private LocalDateTime achievedAt;
}
