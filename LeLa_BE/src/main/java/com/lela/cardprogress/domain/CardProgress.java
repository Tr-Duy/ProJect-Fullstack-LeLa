package com.lela.cardprogress.domain;

import com.lela.domain.AuditableEntity;
import com.lela.flashcard.domain.Flashcard;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "card_progress")
// Component: Learning - per-user SRS card state.
public class CardProgress extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng sở hữu tiến độ học.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Flashcard card; // Flashcard đang theo dõi tiến độ.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CardProgressState state = CardProgressState.NEW; // Trạng thái SRS hiện tại của thẻ.

    @Enumerated(EnumType.STRING)
    @Column(name = "suspended_from_state", length = 20)
    private ReviewableCardState suspendedFromState; // Trạng thái trước khi tạm ngưng thẻ.

    @Column(name = "ease_factor", nullable = false, precision = 5, scale = 2)
    private BigDecimal easeFactor = new BigDecimal("2.50"); // Hệ số dễ nhớ của thuật toán SRS.

    @Column(name = "interval_days", nullable = false)
    private Integer intervalDays = 0; // Khoảng cách review tính theo ngày.

    @Column(nullable = false)
    private Integer repetitions = 0; // Số lần lặp lại thành công.

    @Column(name = "lapse_count", nullable = false)
    private Integer lapseCount = 0; // Số lần quên hoặc trả lời sai.

    @Column(name = "learning_step", nullable = false)
    private Integer learningStep = 0; // Bước học hiện tại trong pha learning.

    @Column(name = "scheduled_days", nullable = false)
    private Integer scheduledDays = 0; // Số ngày được lên lịch.

    @Column(name = "elapsed_days", nullable = false)
    private Integer elapsedDays = 0; // Số ngày đã trôi qua từ lần review trước.

    @Column(name = "due_at")
    private LocalDateTime dueAt; // Thời điểm thẻ đến hạn review.

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt; // Thời điểm review gần nhất.

    @Column(name = "last_rating")
    private Integer lastRating; // Mức đánh giá gần nhất của người học.

    @Column(name = "algorithm_version", nullable = false, length = 30)
    private String algorithmVersion = "SM2_V1"; // Phiên bản thuật toán SRS.

    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews = 0; // Tổng số lượt review thẻ.

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount = 0; // Tổng số lượt trả lời đúng.

    @Column(name = "again_count", nullable = false)
    private Integer againCount = 0; // Số lượt đánh giá Again.

    @Column(name = "hard_count", nullable = false)
    private Integer hardCount = 0; // Số lượt đánh giá Hard.

    @Column(name = "good_count", nullable = false)
    private Integer goodCount = 0; // Số lượt đánh giá Good.

    @Column(name = "easy_count", nullable = false)
    private Integer easyCount = 0; // Số lượt đánh giá Easy.

    @Version
    @Column(nullable = false)
    private Long version = 0L; // Phiên bản dùng cho optimistic locking.
}
