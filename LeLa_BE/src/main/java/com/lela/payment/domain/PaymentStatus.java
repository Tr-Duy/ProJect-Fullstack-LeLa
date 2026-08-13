package com.lela.payment.domain;

// Enum trạng thái giao dịch thanh toán.
public enum PaymentStatus {
    PENDING, // Giao dịch đang chờ xử lý.
    SUCCEEDED, // Giao dịch thành công.
    FAILED, // Giao dịch thất bại.
    REFUNDED, // Giao dịch đã hoàn tiền.
    CANCELLED, // Giao dịch đã bị hủy.
    EXPIRED // Giao dịch đã hết hạn.
}
