package com.lela.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SepayWebhookValidator {

    @Value("${sepay.api-key:}")
    private String apiKey;

    public void validateRequest(String authHeader) {
        if (authHeader == null || authHeader.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing authorization header");
        }

        // Ưu tiên hỗ trợ ApiKey (DEV) trước. Chuẩn bị cho HMAC sau.
        if (authHeader.startsWith("Apikey ")) {
            String token = authHeader.substring(7);
            if (!token.equals(apiKey)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid API Key");
            }
        } else {
            // Sau này nếu có HMAC-SHA256, sẽ bắt ở đây.
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Unsupported authorization method");
        }
    }
}
