package com.lela.leaderboardsnapshot;

import com.lela.leaderboardsnapshot.domain.LeaderboardSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface LeaderboardSnapshotRepository extends JpaRepository<LeaderboardSnapshot, Long> {

    @Query("SELECT dla.user.id, dla.user.fullName, dla.user.username, dla.user.avatarUrl, SUM(dla.xpEarned) as totalXp, SUM(dla.quizCount) as totalQuiz, SUM(dla.cardsLearned) as totalCards " +
            "FROM DailyLearningActivity dla " +
            "WHERE dla.activityDate BETWEEN :start AND :end " +
            "GROUP BY dla.user.id, dla.user.fullName, dla.user.username, dla.user.avatarUrl " +
            "ORDER BY SUM(dla.xpEarned) DESC")
    Page<Object[]> findRealTimeRankings(@Param("start") LocalDate start, @Param("end") LocalDate end, Pageable pageable);

    @Query("""
            SELECT COUNT(DISTINCT dla2.user.id) + 1
            FROM DailyLearningActivity dla2
            WHERE dla2.activityDate BETWEEN :start AND :end
              AND dla2.user.id != :userId
              AND (
                  SELECT COALESCE(SUM(dla2_sub.xpEarned), 0)
                  FROM DailyLearningActivity dla2_sub
                  WHERE dla2_sub.user.id = dla2.user.id
                    AND dla2_sub.activityDate BETWEEN :start AND :end
              ) > (
                  SELECT COALESCE(SUM(dla1.xpEarned), 0)
                  FROM DailyLearningActivity dla1
                  WHERE dla1.user.id = :userId
                    AND dla1.activityDate BETWEEN :start AND :end
              )
            """)
    Optional<Long> findUserRealTimeRank(
            @Param("userId") Long userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("SELECT COALESCE(SUM(dla.xpEarned), 0) FROM DailyLearningActivity dla WHERE dla.user.id = :userId AND dla.activityDate BETWEEN :start AND :end")
    Long findUserTotalXpInPeriod(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}