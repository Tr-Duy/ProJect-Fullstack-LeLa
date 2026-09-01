package com.lela.achievement;

import com.lela.achievement.domain.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    List<UserAchievement> findAllByUserId(Long userId);
    boolean existsByUserIdAndAchievementCode(Long userId, String code);
    boolean existsByUserIdAndAchievementId(Long userId, Long achievementId);
    long countByAchievementId(Long achievementId);

    @org.springframework.data.jpa.repository.Query("SELECT ua.achievement.id, COUNT(ua) FROM UserAchievement ua GROUP BY ua.achievement.id")
    List<Object[]> countGroupedByAchievementId();

    @org.springframework.data.jpa.repository.Query("SELECT ua.achievement.code FROM UserAchievement ua WHERE ua.user.id = :userId")
    List<String> findAchievementCodesByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
