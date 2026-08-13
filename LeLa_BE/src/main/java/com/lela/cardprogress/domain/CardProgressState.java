package com.lela.cardprogress.domain;

// Enum trạng thái SRS của từng thẻ theo từng người dùng.
public enum CardProgressState {
    NEW, // Thẻ mới, chưa học.
    LEARNING, // Đang trong giai đoạn học ban đầu.
    REVIEW, // Đang ở giai đoạn ôn tập định kỳ.
    RELEARNING, // Đang học lại sau khi quên.
    SUSPENDED // Đã tạm ngưng review.
}
