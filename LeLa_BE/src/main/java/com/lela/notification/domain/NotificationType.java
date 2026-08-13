package com.lela.notification.domain;

// Enum loại thông báo gửi cho người dùng.
public enum NotificationType {
    REVIEW_DUE, // Nhắc có thẻ đến hạn review.
    STREAK_REMINDER, // Nhắc duy trì streak.
    QUIZ_RESULT, // Thông báo kết quả quiz.
    ACHIEVEMENT, // Thông báo thành tích.
    SYSTEM, // Thông báo hệ thống.
    NEW_CONTENT, // Thông báo nội dung mới.
    SUBSCRIPTION // Thông báo liên quan đăng ký gói.
}
