package com.lela.usersubscription.dto;

import com.lela.usersubscription.domain.UserSubscriptionStatus;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;


@Getter
@Setter
public class UserSubscriptionResponse {
    private Long userId;
    private Long planId;
    private UserSubscriptionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime trialEndsAt;
    private LocalDateTime cancelledAt;
    private Boolean autoRenew;
    private String provider;
    private String providerSubscriptionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long id;
}
