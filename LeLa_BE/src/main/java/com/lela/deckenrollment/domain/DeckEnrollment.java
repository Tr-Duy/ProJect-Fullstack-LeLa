package com.lela.deckenrollment.domain;

import com.lela.domain.AuditableEntity;
import com.lela.deck.domain.Deck;
import com.lela.users.domain.Users;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "deck_enrollments")
// Component: Learning - user enrollment in a deck.
public class DeckEnrollment extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng đăng ký học deck.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck; // Deck được đăng ký học.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeckEnrollmentStatus status = DeckEnrollmentStatus.ACTIVE; // Trạng thái đăng ký học.

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt; // Thời điểm đăng ký học.

    @Column(name = "paused_at")
    private LocalDateTime pausedAt; // Thời điểm tạm dừng học.

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // Thời điểm hoàn thành deck.

    @Column(name = "dropped_at")
    private LocalDateTime droppedAt; // Thời điểm bỏ học deck.

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt; // Thời điểm học gần nhất.

    @Column(name = "next_review_at")
    private LocalDateTime nextReviewAt; // Thời điểm review tiếp theo.

    @Column(name = "mastered_cards", nullable = false)
    private Integer masteredCards = 0; // Số thẻ đã nắm vững.

    @Column(length = 500)
    private String note; // Ghi chú cá nhân cho enrollment.

    @Column(name = "max_new_cards_per_day", nullable = false)
    private Integer maxNewCardsPerDay = 20; // Giới hạn số thẻ mới học mỗi ngày.

    @Column(name = "max_reviews_per_day", nullable = false)
    private Integer maxReviewsPerDay = 100; // Giới hạn số thẻ ôn tập mỗi ngày.

    @Version
    @Column(nullable = false)
    private Long version = 0L; // Phiên bản dùng cho optimistic locking.
}
