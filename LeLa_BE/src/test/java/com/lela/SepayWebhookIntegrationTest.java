package com.lela;

import com.lela.payment.PaymentRepository;
import com.lela.payment.domain.Payment;
import com.lela.payment.domain.PaymentStatus;
import com.lela.usersubscription.UserSubscriptionRepository;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.domain.UserSubscriptionStatus;
import com.lela.subscriptionplan.SubscriptionPlanRepository;
import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.payment.PaymentService;
import com.lela.payment.dto.CheckoutRequest;
import com.lela.payment.dto.CheckoutResponse;
import com.lela.payment.dto.SepayWebhookRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@SpringBootTest
public class SepayWebhookIntegrationTest {

    @Autowired private PaymentService paymentService;

    @Test
    @WithMockUser(username = "admin") // replace with a real user
    public void testWebhookThrowsException() {
        try {
            // 1. Create Checkout
            CheckoutRequest checkoutRequest = new CheckoutRequest();
            checkoutRequest.setPlanId(2L); // Assume PLUS plan is ID 2
            CheckoutResponse checkoutRes = paymentService.checkout(checkoutRequest);
            
            System.out.println("===> CHECKOUT CODE: " + checkoutRes.getPaymentCode());

            // 2. Trigger Webhook
            SepayWebhookRequest request = new SepayWebhookRequest();
            request.setGateway("OCB");
            request.setTransactionDate("2026-08-08 11:20:00");
            request.setAccountNumber("0332090744");
            request.setSubAccount("SEPLELAPAYMENT");
            request.setContent(checkoutRes.getPaymentCode());
            request.setTransferType("in");
            request.setTransferAmount(checkoutRes.getAmount());
            request.setReferenceCode("FT26220N1S1_TEST_" + System.currentTimeMillis());
            request.setId(72262813L);

            Map<String, Object> result = paymentService.processSepayWebhook(request);
            System.out.println("===> RESULT: " + result);
        } catch (Exception e) {
            System.out.println("===> CATCHED EXCEPTION <===");
            e.printStackTrace();
            throw e;
        }
    }
}
