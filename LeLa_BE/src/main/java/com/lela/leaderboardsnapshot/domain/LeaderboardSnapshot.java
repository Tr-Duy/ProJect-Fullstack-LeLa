package com.lela.leaderboardsnapshot.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Column;
import com.lela.users.domain.Users;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "leaderboard_snapshots")
// Component: Gamification - leaderboard score snapshot.
public class LeaderboardSnapshot extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng được ghi nhận điểm xếp hạng.

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false, length = 20)
    private LeaderboardPeriodType periodType; // Loại kỳ xếp hạng.

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart; // Ngày bắt đầu kỳ xếp hạng.

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd; // Ngày kết thúc kỳ xếp hạng.

    @Column(name = "xp_score", nullable = false)
    private Long xpScore = 0L; // Điểm XP dùng để xếp hạng.

    @Column(name = "quiz_score", nullable = false)
    private Long quizScore = 0L; // Điểm quiz dùng để xếp hạng.

    @Column(name = "streak_days", nullable = false)
    private Integer streakDays = 0; // Số ngày streak trong kỳ.

    @Column(name = "cards_mastered", nullable = false)
    private Integer cardsMastered = 0; // Số thẻ đã nắm vững trong kỳ.

    @Column(name = "total_score", nullable = false)
    private Long totalScore = 0L; // Tổng điểm xếp hạng.
}

