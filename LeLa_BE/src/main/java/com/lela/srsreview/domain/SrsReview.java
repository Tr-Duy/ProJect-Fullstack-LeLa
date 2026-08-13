package com.lela.srsreview.domain;

import com.lela.domain.BaseEnity;
import com.lela.flashcard.domain.Flashcard;
import com.lela.reviewsession.domain.ReviewSession;
import com.lela.users.domain.Users;
import com.lela.cardprogress.domain.ReviewableCardState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "srs_reviews")
// Component: Learning - immutable SRS review event.
public class SrsReview extends BaseEnity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_session_id")
    private ReviewSession reviewSession; // Phiên review chứa sự kiện này.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng thực hiện review.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Flashcard card; // Flashcard được review.

    @Column(name = "client_event_id", nullable = false, unique = true, length = 36)
    private String clientEventId; // ID sự kiện từ client để chống gửi trùng.

    @Column(nullable = false)
    private Integer rating; // Mức đánh giá Again, Hard, Good hoặc Easy.

    @Column(name = "response_ms")
    private Integer responseMs; // Thời gian trả lời tính bằng mili giây.

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", length = 20)
    private ReviewableCardState previousState; // Trạng thái SRS trước review.

    @Enumerated(EnumType.STRING)
    @Column(name = "new_state", nullable = false, length = 20)
    private ReviewableCardState newState; // Trạng thái SRS sau review.

    @Column(name = "ease_before", precision = 5, scale = 2)
    private BigDecimal easeBefore; // Hệ số dễ nhớ trước review.

    @Column(name = "ease_after", nullable = false, precision = 5, scale = 2)
    private BigDecimal easeAfter; // Hệ số dễ nhớ sau review.

    @Column(name = "interval_before")
    private Integer intervalBefore; // Khoảng cách review trước đó.

    @Column(name = "interval_after", nullable = false)
    private Integer intervalAfter; // Khoảng cách review mới.

    @Column(name = "due_before")
    private LocalDateTime dueBefore; // Thời điểm đến hạn trước review.

    @Column(name = "due_after")
    private LocalDateTime dueAfter; // Thời điểm đến hạn mới.

    @Column(name = "algorithm_version", nullable = false, length = 30)
    private String algorithmVersion; // Phiên bản thuật toán SRS đã dùng.

    @Column(name = "xp_awarded", nullable = false)
    private Integer xpAwarded = 0; // XP được cộng cho review này.

    @Column(name = "client_reviewed_at", nullable = false)
    private LocalDateTime clientReviewedAt; // Thời điểm review theo client.

    @Column(name = "server_received_at", nullable = false)
    private LocalDateTime serverReceivedAt; // Thời điểm server nhận sự kiện.

    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt; // Thời điểm review được ghi nhận.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Thời điểm tạo bản ghi review.
}
