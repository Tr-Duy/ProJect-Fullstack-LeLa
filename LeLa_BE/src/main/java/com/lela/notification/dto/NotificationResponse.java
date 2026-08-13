package com.lela.notification.dto;

import com.lela.notification.domain.NotificationChannel;
import com.lela.notification.domain.NotificationStatus;
import com.lela.notification.domain.NotificationType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationResponse {
    private Long userId;
    private NotificationType type;
    private NotificationChannel channel;
    private NotificationStatus status;
    private String title;
    private String message;
    private String actionUrl;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String deduplicationKey;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime scheduledAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime failedAt;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long id;
}
