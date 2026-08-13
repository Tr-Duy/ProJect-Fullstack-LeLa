package com.lela.leaderboardsnapshot.dto;

import com.lela.leaderboardsnapshot.domain.LeaderboardPeriodType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.time.LocalDate;


@Getter
@Setter
public class LeaderboardSnapshotResponse {
    private Long userId;
    private String fullName;
    private String username;
    private String avatarUrl;
    private LeaderboardPeriodType periodType;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long xpScore;
    private Long quizScore;
    private Integer streakDays;
    private Integer cardsMastered;
    private Long totalScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long id;
}
