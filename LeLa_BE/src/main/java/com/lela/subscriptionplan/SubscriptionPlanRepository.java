package com.lela.subscriptionplan;

import com.lela.subscriptionplan.domain.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findFirstByPrice(BigDecimal price);
}
