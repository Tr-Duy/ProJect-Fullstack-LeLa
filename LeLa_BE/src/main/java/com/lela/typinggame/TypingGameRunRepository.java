package com.lela.typinggame;

import com.lela.typinggame.domain.TypingGameRun;
import com.lela.typinggame.domain.TypingGameRunStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TypingGameRunRepository extends JpaRepository<TypingGameRun, Long> {

    Optional<TypingGameRun> findByPublicId(String publicId);

    @Query("SELECT r FROM TypingGameRun r WHERE r.user.id = :userId AND r.status = :status")
    List<TypingGameRun> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") TypingGameRunStatus status);

    @Query("SELECT r FROM TypingGameRun r WHERE r.status = 'IN_PROGRESS' AND r.updatedAt < :cutoff")
    List<TypingGameRun> findStaleInProgressRuns(@Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT COALESCE(SUM(r.xpEarned), 0) FROM TypingGameRun r WHERE r.user.id = :userId AND r.startedAt >= :startOfDay AND r.startedAt < :endOfDay")
    int sumDailyXpEarned(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
