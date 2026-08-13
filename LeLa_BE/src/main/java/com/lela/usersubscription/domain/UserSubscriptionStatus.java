package com.lela.usersubscription.domain;

// Enum trạng thái đăng ký gói của người dùng.
public enum UserSubscriptionStatus {
    TRIALING, // Đang trong thời gian dùng thử.
    PENDING, // Đang chờ xác nhận thanh toán.
    ACTIVE, // Đăng ký đang còn hiệu lực.
    PAST_DUE, // Đã quá hạn thanh toán.
    CANCELLED, // Đã hủy đăng ký.
    EXPIRED // Đăng ký đã hết hạn.
}
