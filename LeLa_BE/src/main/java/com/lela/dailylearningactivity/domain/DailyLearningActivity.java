package com.lela.dailylearningactivity.domain;

import com.lela.domain.AuditableEntity;
import com.lela.users.domain.Users;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "daily_learning_activities")
// Component: Learning - daily activity aggregate for streaks and goals.
public class DailyLearningActivity extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng có hoạt động học.

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate; // Ngày hoạt động học.

    @Column(nullable = false, length = 64)
    private String timezone; // Múi giờ dùng để tính ngày học.

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0; // Số lượt review trong ngày.

    @Column(name = "cards_learned", nullable = false)
    private Integer cardsLearned = 0; // Số thẻ đã học trong ngày.

    @Column(name = "quiz_count", nullable = false)
    private Integer quizCount = 0; // Số quiz đã làm trong ngày.

    @Column(name = "minutes_spent", nullable = false)
    private Integer minutesSpent = 0; // Số phút học trong ngày.

    @Column(name = "xp_earned", nullable = false)
    private Integer xpEarned = 0; // XP kiếm được trong ngày.

    @Column(name = "goal_met", nullable = false)
    private Boolean goalMet = false; // Người dùng đã đạt mục tiêu ngày hay chưa.
}
