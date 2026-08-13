package com.lela.reviewsession;

import com.lela.reviewsession.domain.ReviewSessionStatus;
import com.lela.reviewsession.domain.ReviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ReviewSessionRepository extends JpaRepository<ReviewSession, Long> {

    Optional<ReviewSession> findByPublicId(String publicId);

    @Query("SELECT s FROM ReviewSession s WHERE s.user.id = :userId AND s.status = :status ORDER BY s.startedAt DESC")
    List<ReviewSession> findActiveSessions(@Param("userId") Long userId, @Param("status") ReviewSessionStatus status);
}