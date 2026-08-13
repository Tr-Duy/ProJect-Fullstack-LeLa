package com.lela.deckenrollment.domain;

// Enum trạng thái đăng ký học một deck.
public enum DeckEnrollmentStatus {
    ACTIVE, // Đang học.
    PAUSED, // Đang tạm dừng học.
    COMPLETED, // Đã hoàn thành deck.
    DROPPED // Đã bỏ học deck.
}
