package com.lela.srsreview;

import com.lela.srsreview.domain.SrsReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface SrsReviewRepository extends JpaRepository<SrsReview, Long> {

    boolean existsByClientEventId(String clientEventId);

    @Query("SELECT COUNT(r) FROM SrsReview r WHERE r.user.id = :userId AND r.serverReceivedAt BETWEEN :startTime AND :endTime")
    long countReviewsInPeriod(@Param("userId") Long userId,
                              @Param("startTime") LocalDateTime startTime,
                              @Param("endTime") LocalDateTime endTime);
    Page<SrsReview> findAllByUserId(Long userId, Pageable pageable);

    @Query("SELECT r FROM SrsReview r WHERE r.user.id = :userId")
    List<SrsReview> findAllForActivityByUserId(@Param("userId") Long userId);
}
