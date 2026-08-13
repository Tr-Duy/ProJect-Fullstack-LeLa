package com.lela.notification;

import com.lela.notification.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Page<NotificationResponse> getAll(Pageable pageable);
    Page<NotificationResponse> getAllAdmin(Pageable pageable);
    Page<NotificationResponse> getUnread(Pageable pageable);
    void markAsRead(Long id);
    void markAllAsRead();
    void deleteNotification(Long id);
    void deleteAllNotifications();
    void broadcast(com.lela.notification.dto.NotificationRequest request);
    void sendToUser(Long userId, com.lela.notification.dto.NotificationRequest request);
}