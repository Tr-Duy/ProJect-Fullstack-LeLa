package com.lela.achievement;

import com.lela.achievement.domain.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    List<UserAchievement> findAllByUserId(Long userId);
    boolean existsByUserIdAndAchievementCode(Long userId, String code);
    Optional<UserAchievement> findByUserIdAndAchievementCode(Long userId, String code);
}
