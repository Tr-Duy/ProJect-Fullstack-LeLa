package com.lela.payment.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class CheckoutResponse {
    private Long paymentId;
    private String paymentCode;
    private String planCode;
    private String planName;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;
    private String qrUrl;
    private LocalDateTime expiresAt;
}
