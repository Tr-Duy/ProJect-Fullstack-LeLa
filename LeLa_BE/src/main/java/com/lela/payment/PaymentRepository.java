package com.lela.payment;

import com.lela.payment.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    org.springframework.data.domain.Page<Payment> findByUserId(Long userId, org.springframework.data.domain.Pageable pageable);

    java.util.Optional<Payment> findByPaymentCode(String paymentCode);

    boolean existsByProviderTransactionId(String providerTransactionId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCEEDED' AND p.paidAt >= :startDate")
    BigDecimal calculateRevenueSince(@Param("startDate") LocalDateTime startDate);
}
