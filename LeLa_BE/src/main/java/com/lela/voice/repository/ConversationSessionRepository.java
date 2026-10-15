package com.lela.voice.repository;

import com.lela.voice.domain.ConversationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationSessionRepository extends JpaRepository<ConversationSession, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"scenario", "user"})
    Optional<ConversationSession> findByPublicId(String publicId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ConversationSession s WHERE s.user.id = :userId AND s.status = 'IN_PROGRESS'")
    List<ConversationSession> findInProgressSessionsForUpdate(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"scenario", "user"})
    @Query("SELECT s FROM ConversationSession s WHERE s.user.id = :userId AND s.status = 'IN_PROGRESS'")
    Optional<ConversationSession> findInProgressSessionByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT COUNT(s) FROM ConversationSession s 
        WHERE s.user.id = :userId 
          AND s.startedAt >= :startOfDay 
          AND s.startedAt < :endOfDay 
          AND s.status = 'COMPLETED'
    """)
    long countCompletedSessionsToday(
        @Param("userId") Long userId, 
        @Param("startOfDay") LocalDateTime startOfDay, 
        @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("SELECT COUNT(s) FROM ConversationSession s WHERE s.user.id = :userId AND s.quotaDate = :quotaDate AND s.status = 'COMPLETED'")
    long countConsumedSessionsOnDate(@Param("userId") Long userId, @Param("quotaDate") LocalDate quotaDate);

    @Query("SELECT s FROM ConversationSession s WHERE s.status = 'IN_PROGRESS' AND s.lastActivityAt < :expiredThreshold")
    List<ConversationSession> findStaleInProgressSessions(@Param("expiredThreshold") LocalDateTime expiredThreshold);

    @Query("SELECT COALESCE(SUM(s.xpAwarded), 0) FROM ConversationSession s WHERE s.user.id = :userId AND s.quotaDate = :quotaDate")
    int sumDailyXpAwarded(@Param("userId") Long userId, @Param("quotaDate") LocalDate quotaDate);
}
