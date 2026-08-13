package com.lela.usersubscription;

import com.lela.usersubscription.domain.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    org.springframework.data.domain.Page<UserSubscription> findByUserId(Long userId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p.name, COUNT(us) FROM UserSubscription us JOIN us.plan p WHERE us.status = 'ACTIVE' GROUP BY p.name")
    List<Object[]> countActiveSubscriptionsGroupedByPlan();

    @Query("SELECT us FROM UserSubscription us WHERE us.status = 'ACTIVE' AND us.expiresAt >= :start AND us.expiresAt < :end")
    List<UserSubscription> findActiveSubscriptionsExpiringBetween(
        @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, 
        @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end
    );

    @Query("SELECT us FROM UserSubscription us WHERE us.status = 'ACTIVE' AND us.expiresAt < :now")
    List<UserSubscription> findActiveSubscriptionsExpiredBefore(
        @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now
    );
}
