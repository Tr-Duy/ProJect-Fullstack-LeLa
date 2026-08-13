package com.lela.payment.domain;

import com.lela.domain.AuditableEntity;
import com.lela.usersubscription.domain.UserSubscription;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.lela.users.domain.Users;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "payments")
// Component: Subscription - payment transaction history.
public class Payment extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng thực hiện thanh toán.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private UserSubscription subscription; // Đăng ký liên quan đến thanh toán.

    @Column(nullable = false, length = 50)
    private String provider; // Nhà cung cấp thanh toán.

    @Column(name = "provider_transaction_id", unique = true, length = 190)
    private String providerTransactionId;

    @Column(name = "payment_code", unique = true, length = 50)
    private String paymentCode; // Mã giao dịch từ nhà cung cấp.

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount; // Số tiền giao dịch.

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "VND"; // Mã tiền tệ.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING; // Trạng thái thanh toán.

    @Column(name = "paid_at")
    private LocalDateTime paidAt; // Thời điểm thanh toán thành công.

    @Column(name = "failed_at")
    private LocalDateTime failedAt; // Thời điểm thanh toán thất bại.

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt; // Thời điểm hoàn tiền.

    @Column(name = "failure_reason", length = 500)
    private String failureReason; // Lý do thất bại.

    @Column(name = "provider_payload", columnDefinition = "json")
    private String providerPayload;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // Dữ liệu phản hồi gốc từ nhà cung cấp.
}

