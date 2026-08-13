package com.lela.notification.domain;

import com.lela.domain.AuditableEntity;
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
@Table(name = "notifications")
// Component: Notification - user-facing message delivery state.
public class Notification extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng nhận thông báo.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type; // Loại thông báo.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel = NotificationChannel.IN_APP; // Kênh gửi thông báo.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationStatus status = NotificationStatus.PENDING; // Trạng thái gửi thông báo.

    @Column(nullable = false, length = 200)
    private String title; // Tiêu đề thông báo.

    @Column(nullable = false, length = 2000)
    private String message; // Nội dung thông báo.

    @Column(name = "action_url", length = 500)
    private String actionUrl; // Đường dẫn hành động khi mở thông báo.

    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType; // Loại đối tượng liên quan.

    @Column(name = "related_entity_id")
    private Long relatedEntityId; // ID đối tượng liên quan.

    @Column(name = "deduplication_key", length = 190)
    private String deduplicationKey; // Khóa chống gửi trùng thông báo.

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false; // Người dùng đã đọc hay chưa.

    @Column(name = "read_at")
    private LocalDateTime readAt; // Thời điểm đọc thông báo.

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt; // Thời điểm dự kiến gửi.

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt; // Thời điểm gửi thành công.

    @Column(name = "failed_at")
    private LocalDateTime failedAt; // Thời điểm gửi thất bại.

    @Column(name = "failure_reason", length = 500)
    private String failureReason; // Lý do gửi thất bại.
}

