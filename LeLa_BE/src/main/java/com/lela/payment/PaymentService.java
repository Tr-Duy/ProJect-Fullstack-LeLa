package com.lela.payment;

import com.lela.payment.dto.PaymentRequest;
import com.lela.payment.dto.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    Page<PaymentResponse> getAll(Pageable pageable);
    PaymentResponse getById(Long id);
    PaymentResponse create(PaymentRequest request);
    PaymentResponse update(Long id, PaymentRequest request);
    
    // API Checkout
    com.lela.payment.dto.CheckoutResponse checkout(com.lela.payment.dto.CheckoutRequest request);

    // Xử lý Webhook SePay
    java.util.Map<String, Object> processSepayWebhook(com.lela.payment.dto.SepayWebhookRequest request);

    void delete(Long id);
}
