package com.lela.deck.domain;

// Enum trạng thái kiểm duyệt và vòng đời của deck.
public enum DeckStatus {
    DRAFT, // Bản nháp, chưa gửi kiểm duyệt.
    PENDING_REVIEW, // Đang chờ kiểm duyệt.
    PUBLISHED, // Đã xuất bản.
    REJECTED, // Bị từ chối khi kiểm duyệt.
    ARCHIVED // Đã lưu trữ, không còn hoạt động chính.
}
