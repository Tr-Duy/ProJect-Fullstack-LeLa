package com.lela.payment;

import com.lela.payment.domain.Payment;
import com.lela.payment.domain.PaymentStatus;
import com.lela.payment.dto.PaymentRequest;
import com.lela.payment.dto.PaymentResponse;
import com.lela.users.domain.Users;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.UserSubscriptionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Disabled;
// @Disabled
@ExtendWith(MockitoExtension.class)
public class PaymentServiceImplTest {

    @Mock
    private PaymentRepository repository;

    @Mock
    private com.lela.users.UsersRepository usersRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private com.lela.notification.NotificationService notificationService;

    @Mock
    private EntityManager entityManager;

    @Mock
    private com.lela.subscriptionplan.SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private SepayWebhookValidator sepayWebhookValidator;

    @InjectMocks
    private PaymentServiceImpl service;

    private Payment entity;

    @BeforeEach
    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(securityContext);

        Users user = new Users();
        user.setId(1L);
        com.lela.userroleassignment.domain.UserRoleAssignment roleAssignment = new com.lela.userroleassignment.domain.UserRoleAssignment();
        com.lela.role.domain.Role role = new com.lela.role.domain.Role();
        role.setRoleCode("ADMIN");
        roleAssignment.setRole(role);
        user.setRoleAssignments(new java.util.LinkedHashSet<>(java.util.Collections.singletonList(roleAssignment)));
        Mockito.lenient().when(usersRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        Mockito.lenient().when(usersRepository.findById(1L)).thenReturn(Optional.of(user));

        UserSubscription sub = new UserSubscription();
        sub.setId(2L);

        entity = new Payment();
        entity.setId(1L);
        entity.setUser(user);
        entity.setSubscription(sub);
        entity.setAmount(new BigDecimal("100.00"));
        entity.setStatus(PaymentStatus.SUCCEEDED);
    }

    @Test
    void getAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Payment> page = new PageImpl<>(Arrays.asList(entity));
        when(repository.findAll(pageable)).thenReturn(page);
        var result = service.getAll(pageable);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        PaymentResponse result = service.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void create_ThrowsException() {
        PaymentRequest request = new PaymentRequest();
        assertThrows(UnsupportedOperationException.class, () -> service.create(request));
    }

    @Test
    void checkout_FreePlan_ThrowsException() {
        com.lela.payment.dto.CheckoutRequest request = new com.lela.payment.dto.CheckoutRequest();
        request.setPlanId(1L);

        com.lela.subscriptionplan.domain.SubscriptionPlan freePlan = new com.lela.subscriptionplan.domain.SubscriptionPlan();
        freePlan.setId(1L);
        freePlan.setPrice(BigDecimal.ZERO);
        freePlan.setIsActive(true);

        when(subscriptionPlanRepository.findById(1L)).thenReturn(Optional.of(freePlan));

        Exception exception = assertThrows(IllegalArgumentException.class, () -> service.checkout(request));
        assertTrue(exception.getMessage().contains("Gói miễn phí không thể tạo thanh toán"));
    }

    @Test
    void checkout_PlusPlan_CreatesPaymentWithCorrectPrice() {
        com.lela.payment.dto.CheckoutRequest request = new com.lela.payment.dto.CheckoutRequest();
        request.setPlanId(2L);

        com.lela.subscriptionplan.domain.SubscriptionPlan plusPlan = new com.lela.subscriptionplan.domain.SubscriptionPlan();
        plusPlan.setId(2L);
        plusPlan.setPrice(new BigDecimal("79000"));
        plusPlan.setIsActive(true);
        plusPlan.setPlanCode("PLUS");
        plusPlan.setName("Plus Plan");

        when(subscriptionPlanRepository.findById(2L)).thenReturn(Optional.of(plusPlan));
        when(userSubscriptionRepository.save(any(UserSubscription.class))).thenAnswer(i -> i.getArgument(0));
        when(repository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(10L);
            return p;
        });

        com.lela.payment.dto.CheckoutResponse response = service.checkout(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("79000"), response.getAmount());
        assertNotNull(response.getPaymentCode());
        assertEquals("PENDING", response.getStatus());
        verify(repository).save(any(Payment.class));
    }

    @Test
    void update_Success() {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("200.00"));
        request.setStatus(PaymentStatus.REFUNDED);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);

        PaymentResponse result = service.update(1L, request);

        assertNotNull(result);
        assertEquals(PaymentStatus.REFUNDED, entity.getStatus());
        verify(repository).save(entity);
    }

    @Test
    void processSepayWebhook_Valid_ActivatesSubscription() {
        com.lela.payment.dto.SepayWebhookRequest webhook = new com.lela.payment.dto.SepayWebhookRequest();
        webhook.setTransferType("in");
        webhook.setReferenceCode("REF123");
        webhook.setContent("LELA1123456");
        webhook.setTransferAmount(BigDecimal.valueOf(79000));

        Payment pendingPayment = new Payment();
        pendingPayment.setId(10L);
        pendingPayment.setAmount(new BigDecimal("79000"));
        pendingPayment.setStatus(PaymentStatus.PENDING);
        pendingPayment.setPaymentCode("LELA1123456");
        pendingPayment.setExpiresAt(java.time.LocalDateTime.now().plusHours(1));
        
        UserSubscription sub = new UserSubscription();
        sub.setStatus(com.lela.usersubscription.domain.UserSubscriptionStatus.PENDING);
        com.lela.subscriptionplan.domain.SubscriptionPlan plan = new com.lela.subscriptionplan.domain.SubscriptionPlan();
        plan.setBillingCycle("MONTHLY");
        plan.setBillingIntervalCount(1);
        sub.setPlan(plan);
        pendingPayment.setSubscription(sub);

        when(repository.existsByProviderTransactionId("REF123")).thenReturn(false);
        when(repository.findByPaymentCode("LELA1123456")).thenReturn(Optional.of(pendingPayment));
        when(repository.save(any(Payment.class))).thenReturn(pendingPayment);

        var result = service.processSepayWebhook(webhook);

        assertEquals(true, result.get("success"));
        assertEquals(PaymentStatus.SUCCEEDED, pendingPayment.getStatus());
        assertEquals(com.lela.usersubscription.domain.UserSubscriptionStatus.ACTIVE, sub.getStatus());
        verify(userSubscriptionRepository).save(sub);
        verify(repository).save(pendingPayment);
    }
}
