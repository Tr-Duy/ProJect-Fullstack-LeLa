package com.lela.reviewsession.domain;

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
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "review_sessions")
// Component: Learning - SRS review session boundary.
public class ReviewSession extends AuditableEntity {

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId; // ID công khai dùng cho API.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng thực hiện phiên review.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck; // Deck đang được review.

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 20)
    private ReviewSessionType sessionType = ReviewSessionType.REGULAR; // Loại phiên review.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewSessionStatus status = ReviewSessionStatus.IN_PROGRESS; // Trạng thái phiên review.

    @Column(name = "device_id", length = 190)
    private String deviceId; // Thiết bị thực hiện review.

    @Column(name = "offline_mode", nullable = false)
    private Boolean offlineMode = false; // Phiên có phát sinh từ chế độ offline hay không.

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt; // Thời điểm bắt đầu phiên.

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // Thời điểm hoàn thành phiên.

    @Column(name = "abandoned_at")
    private LocalDateTime abandonedAt; // Thời điểm bỏ dở phiên.
}
