package com.lela.payment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CheckoutRequest {
    private Long planId;

    // Hỗ trợ alias nếu client gửi subscriptionPlanId
    public void setSubscriptionPlanId(Long subscriptionPlanId) {
        if (this.planId == null) {
            this.planId = subscriptionPlanId;
        }
    }
}
