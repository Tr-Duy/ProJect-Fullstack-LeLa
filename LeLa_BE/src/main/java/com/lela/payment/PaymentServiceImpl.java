package com.lela.payment;

import com.lela.common.exception.NotFoundExeception;
import com.lela.users.domain.Users;
import com.lela.payment.domain.PaymentStatus;
import com.lela.payment.domain.Payment;
import com.lela.payment.dto.PaymentRequest;
import com.lela.payment.dto.PaymentResponse;
import com.lela.usersubscription.domain.UserSubscription;
import com.lela.usersubscription.domain.UserSubscriptionStatus;
import com.lela.usersubscription.UserSubscriptionRepository;
import com.lela.notification.NotificationService;
import com.lela.notification.dto.NotificationRequest;
import com.lela.notification.domain.NotificationType;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository repository;
    private final com.lela.users.UsersRepository usersRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final NotificationService notificationService;
    private final EntityManager entityManager;
    private final com.lela.subscriptionplan.SubscriptionPlanRepository subscriptionPlanRepository;
    private final SepayWebhookValidator sepayWebhookValidator;

    @org.springframework.beans.factory.annotation.Value("${payment.bank.code:}")
    private String bankCode;

    @org.springframework.beans.factory.annotation.Value("${payment.bank.account-number:}")
    private String bankAccountNumber;

    @org.springframework.beans.factory.annotation.Value("${payment.bank.account-name:}")
    private String bankAccountName;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAll(Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        boolean isAdmin = user.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));

        if (isAdmin) {
            return repository.findAll(pageable).map(this::mapToResponse);
        } else {
            return repository.findByUserId(user.getId(), pageable).map(this::mapToResponse);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getById(Long id) {
        Payment entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy giao dịch với ID: " + id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Users currentUser = usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        boolean isAdmin = currentUser.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));

        if (!isAdmin && (entity.getUser() == null || !entity.getUser().getId().equals(currentUser.getId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Truy cập bị từ chối: Giao dịch này không thuộc về bạn");
        }

        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public PaymentResponse create(PaymentRequest request) {
        throw new UnsupportedOperationException("Sử dụng API Checkout thay thế");
    }

    @Override
    @Transactional
    public PaymentResponse update(Long id, PaymentRequest request) {
        Payment entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy giao dịch với ID: " + id));

        updatePaymentFields(entity, request);
        return mapToResponse(repository.save(entity));
    }

    private void updatePaymentFields(Payment entity, PaymentRequest request) {
        entity.setProvider(request.getProvider());
        entity.setProviderTransactionId(request.getProviderTransactionId());
        entity.setAmount(request.getAmount());
        entity.setCurrencyCode(request.getCurrencyCode());

        entity.setStatus(request.getStatus() != null ? request.getStatus() : PaymentStatus.PENDING);

        entity.setPaidAt(request.getPaidAt());
        entity.setFailedAt(request.getFailedAt());
        entity.setRefundedAt(request.getRefundedAt());
        entity.setFailureReason(request.getFailureReason());
        entity.setProviderPayload(request.getProviderPayload());
    }



    @Override
    @Transactional
    public com.lela.payment.dto.CheckoutResponse checkout(com.lela.payment.dto.CheckoutRequest request) {
        Long userId = getCurrentUserId();
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"));

        com.lela.subscriptionplan.domain.SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new NotFoundExeception("Gói không tồn tại"));

        if (!Boolean.TRUE.equals(plan.getIsActive())) {
            throw new IllegalArgumentException("Gói này hiện không hoạt động");
        }

        if (plan.getPrice() == null || plan.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Gói miễn phí không thể tạo thanh toán");
        }

        // Tạo UserSubscription PENDING
        UserSubscription subscription = new UserSubscription();
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.setStatus(UserSubscriptionStatus.PENDING);
        subscription.setStartedAt(java.time.LocalDateTime.now());
        subscription.setAutoRenew(false);
        subscription = userSubscriptionRepository.save(subscription);

        // Tạo Payment PENDING
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setSubscription(subscription);
        payment.setAmount(plan.getPrice());
        payment.setCurrencyCode(plan.getCurrencyCode() != null ? plan.getCurrencyCode() : "VND");
        payment.setStatus(PaymentStatus.PENDING);
        payment.setProvider("SEPAY");
        payment.setCreatedAt(java.time.LocalDateTime.now());
        payment.setExpiresAt(java.time.LocalDateTime.now().plusHours(24));
        
        // Sinh paymentCode
        String code = "LELA" + userId + System.currentTimeMillis();
        payment.setPaymentCode(code);
        
        payment = repository.save(payment);

        String encodedAccountName = "";
        try {
            if (bankAccountName != null) {
                encodedAccountName = java.net.URLEncoder.encode(bankAccountName, java.nio.charset.StandardCharsets.UTF_8.toString()).replace("+", "%20");
            }
        } catch (Exception e) {}

        String qrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.jpg?amount=%s&addInfo=%s&accountName=%s", 
                bankCode, bankAccountNumber, payment.getAmount().toPlainString(), payment.getPaymentCode(), encodedAccountName);

        return com.lela.payment.dto.CheckoutResponse.builder()
                .paymentId(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .planCode(plan.getPlanCode())
                .planName(plan.getName())
                .amount(payment.getAmount())
                .currency(payment.getCurrencyCode())
                .status(payment.getStatus().name())
                .bankName(bankCode)
                .bankAccountNumber(bankAccountNumber)
                .bankAccountName(bankAccountName)
                .qrUrl(qrUrl)
                .expiresAt(payment.getExpiresAt())
                .build();
    }

    @Override
    @Transactional
    public java.util.Map<String, Object> processSepayWebhook(com.lela.payment.dto.SepayWebhookRequest request) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);

        // 1. Kiểm tra tiền vào
        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            return response;
        }

        // 2. Chống duplicate webhook
        if (request.getReferenceCode() != null && repository.existsByProviderTransactionId(request.getReferenceCode())) {
            return response;
        }

        // 3. Tìm payment
        if (request.getContent() == null) {
            return response;
        }
        
        String content = request.getContent().toUpperCase();
        java.util.Optional<Payment> optionalPayment = repository.findByPaymentCode(content); // Tìm chính xác
        
        if (optionalPayment.isEmpty()) {
            // Thử quét chuỗi nếu nội dung có chứa mã
            // Cách tốt nhất là regex lấy mã LELA... nhưng để đơn giản ta lấy payment list
            // Tạm thời bỏ qua nếu không map trực tiếp được
            return response;
        }

        Payment payment = optionalPayment.get();

        // 4. Kiểm tra PENDING
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return response;
        }

        // 5. Kiểm tra thời hạn
        if (payment.getExpiresAt() != null && payment.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            payment.setStatus(PaymentStatus.FAILED); // Hay EXPIRED
            payment.setFailureReason("Thanh toán khi đã quá hạn");
            repository.save(payment);
            return response;
        }

        // 6. Kiểm tra amount chính xác
        if (request.getTransferAmount() == null || request.getTransferAmount().compareTo(payment.getAmount()) != 0) {
            payment.setFailureReason("Số tiền chuyển không khớp. Yêu cầu: " + payment.getAmount() + ", Thực nhận: " + request.getTransferAmount());
            repository.save(payment);
            return response;
        }

        // 7. Xử lý thành công
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setProviderTransactionId(request.getReferenceCode());
        payment.setPaidAt(java.time.LocalDateTime.now());
        
        // Serialize provider payload (json)
        try {
            payment.setProviderPayload(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request));
        } catch (Exception ignored) {}

        UserSubscription subscription = payment.getSubscription();
        if (subscription != null) {
            subscription.setStatus(UserSubscriptionStatus.ACTIVE);
            subscription.setStartedAt(java.time.LocalDateTime.now());
            
            com.lela.subscriptionplan.domain.SubscriptionPlan plan = subscription.getPlan();
            java.time.LocalDateTime expiresAt = java.time.LocalDateTime.now();
            if ("MONTHLY".equalsIgnoreCase(plan.getBillingCycle())) {
                expiresAt = expiresAt.plusMonths(plan.getBillingIntervalCount());
            } else if ("YEARLY".equalsIgnoreCase(plan.getBillingCycle())) {
                expiresAt = expiresAt.plusYears(plan.getBillingIntervalCount());
            } else {
                expiresAt = expiresAt.plusMonths(1);
            }
            subscription.setExpiresAt(expiresAt);
            userSubscriptionRepository.save(subscription);
        }

        repository.save(payment);

        // Notification
        NotificationRequest notif = new NotificationRequest();
        notif.setTitle("Thanh toán thành công");
        notif.setMessage("Gói học của bạn đã được kích hoạt thành công!");
        notif.setType(NotificationType.SYSTEM);
        notif.setActionUrl("/profile");
        if (payment.getUser() != null) {
            notificationService.sendToUser(payment.getUser().getId(), notif);
        }

        return response;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundExeception("Không tìm thấy giao dịch với ID: " + id);
        }
        repository.deleteById(id);
    }

    private PaymentResponse mapToResponse(Payment entity) {
        PaymentResponse response = new PaymentResponse();
        response.setId(entity.getId());
        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
            response.setUsername(entity.getUser().getUsername());
            response.setFullName(entity.getUser().getFullName());
        }
        if (entity.getSubscription() != null) response.setSubscriptionId(entity.getSubscription().getId());

        response.setProvider(entity.getProvider());
        response.setProviderTransactionId(entity.getProviderTransactionId());
        response.setAmount(entity.getAmount());
        response.setCurrencyCode(entity.getCurrencyCode());
        response.setStatus(entity.getStatus());
        response.setPaidAt(entity.getPaidAt());
        response.setFailedAt(entity.getFailedAt());
        response.setRefundedAt(entity.getRefundedAt());
        response.setFailureReason(entity.getFailureReason());
        response.setProviderPayload(entity.getProviderPayload());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}