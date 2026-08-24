package com.lela.payment;

import com.lela.payment.dto.PaymentRequest;
import com.lela.payment.dto.PaymentResponse;
import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;
    private final SepayWebhookValidator sepayWebhookValidator;

    @GetMapping
    public ApiResponse<Page<PaymentResponse>> getAll(Pageable pageable) {
        return ApiResponse.success(service.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping("/checkout")
    public ApiResponse<com.lela.payment.dto.CheckoutResponse> checkout(@RequestBody com.lela.payment.dto.CheckoutRequest request) {
        return ApiResponse.success(service.checkout(request), "Checkout created");
    }

    @GetMapping("/{id}/status")
    public ApiResponse<String> getPaymentStatus(@PathVariable Long id) {
        PaymentResponse payment = service.getById(id); // Lấy payment (có check quyền user bên trong service)
        return ApiResponse.success(payment.getStatus().name(), "Success");
    }

    @PostMapping("/webhook/sepay")
    public org.springframework.http.ResponseEntity<Map<String, Object>> processSepayWebhook(
            @RequestBody com.lela.payment.dto.SepayWebhookRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        sepayWebhookValidator.validateRequest(authHeader);
        Map<String, Object> response = service.processSepayWebhook(request);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.successMessage("Deleted");
    }
}

