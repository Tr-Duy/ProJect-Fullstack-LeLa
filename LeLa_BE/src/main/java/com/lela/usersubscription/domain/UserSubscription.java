package com.lela.usersubscription.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import com.lela.subscriptionplan.domain.SubscriptionPlan;
import jakarta.persistence.EnumType;
import com.lela.users.domain.Users;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_subscriptions")
// Component: Subscription - user's active or historical subscription.
public class UserSubscription extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user; // Người dùng đăng ký gói.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan; // Gói đăng ký được sử dụng.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserSubscriptionStatus status = UserSubscriptionStatus.ACTIVE; // Trạng thái đăng ký.

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt; // Thời điểm bắt đầu đăng ký.

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // Thời điểm hết hạn.

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt; // Thời điểm kết thúc dùng thử.

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt; // Thời điểm hủy đăng ký.

    @Column(name = "auto_renew", nullable = false)
    private Boolean autoRenew = false; // Có tự động gia hạn hay không.

    @Column(length = 50)
    private String provider; // Nhà cung cấp thanh toán.

    @Column(name = "provider_subscription_id", length = 190)
    private String providerSubscriptionId; // Mã đăng ký từ nhà cung cấp.

    @Version
    @Column(nullable = false)
    private Long version = 0L; // Phiên bản dùng cho optimistic locking.
}

