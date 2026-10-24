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

    long countByScenarioId(Long scenarioId);

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"scenario", "user"})
    @Query("""
        SELECT s FROM ConversationSession s
        WHERE (:status IS NULL OR :status = '' OR s.status = :status)
          AND (:userId IS NULL OR s.user.id = :userId)
          AND (:scenarioId IS NULL OR s.scenario.id = :scenarioId)
          AND (:startDate IS NULL OR s.startedAt >= :startDate)
          AND (:endDate IS NULL OR s.startedAt <= :endDate)
          AND (:search IS NULL OR :search = '' OR 
               LOWER(s.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(s.user.username) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(s.scenario.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               s.publicId LIKE CONCAT('%', :search, '%'))
        ORDER BY s.startedAt DESC
    """)
    org.springframework.data.domain.Page<ConversationSession> findWithFilters(
            @Param("status") String status,
            @Param("userId") Long userId,
            @Param("scenarioId") Long scenarioId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            org.springframework.data.domain.Pageable pageable
    );
}
