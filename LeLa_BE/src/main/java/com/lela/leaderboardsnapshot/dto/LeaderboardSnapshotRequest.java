package com.lela.leaderboardsnapshot.dto;

import com.lela.leaderboardsnapshot.domain.LeaderboardPeriodType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;


@Getter
@Setter
public class LeaderboardSnapshotRequest {
    private Long userId;
    private LeaderboardPeriodType periodType;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long xpScore;
    private Long quizScore;
    private Integer streakDays;
    private Integer cardsMastered;
    private Long totalScore;
}
