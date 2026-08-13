package com.lela.notification.domain;

// Enum trạng thái gửi thông báo.
public enum NotificationStatus {
    PENDING, // Chờ gửi.
    SENT, // Đã gửi thành công.
    FAILED, // Gửi thất bại.
    CANCELLED // Đã hủy gửi.
}
