package com.lela.achievement;

import com.lela.achievement.domain.Achievement;
import com.lela.achievement.domain.UserAchievement;
import com.lela.dailylearningactivity.DailyLearningActivityRepository;
import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.notification.SseService;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final DailyLearningActivityRepository dailyActivityRepository;
    private final DeckEnrollmentRepository deckEnrollmentRepository;
    private final UsersRepository usersRepository;
    private final SseService sseService;

    @Transactional
    public void evaluateAchievements(Long userId) {
        Users user = usersRepository.findById(userId).orElse(null);
        if (user == null) return;

        List<Achievement> allAchievements = achievementRepository.findAll();
        if (allAchievements.isEmpty()) return;

        // Calculate global stats for user
        List<DailyLearningActivity> allActivities = dailyActivityRepository.findByUserIdAndActivityDateBetween(
                userId, LocalDate.now().minusYears(10), LocalDate.now());

        long totalXp = allActivities.stream().mapToLong(a -> a.getXpEarned() != null ? a.getXpEarned() : 0).sum();
        long totalReviews = allActivities.stream().mapToLong(a -> a.getReviewCount() != null ? a.getReviewCount() : 0).sum();
        long totalDecks = deckEnrollmentRepository.countByUserId(userId);
        
        int currentStreak = calculateStreak(allActivities);

        for (Achievement achievement : allAchievements) {
            // Skip if already unlocked
            if (userAchievementRepository.existsByUserIdAndAchievementCode(userId, achievement.getCode())) {
                continue;
            }

            boolean unlocked = false;
            if ("XP".equalsIgnoreCase(achievement.getConditionType())) {
                unlocked = (totalXp >= achievement.getConditionValue());
            } else if ("STREAK".equalsIgnoreCase(achievement.getConditionType())) {
                unlocked = (currentStreak >= achievement.getConditionValue());
            } else if ("CARDS_REVIEWED".equalsIgnoreCase(achievement.getConditionType())) {
                unlocked = (totalReviews >= achievement.getConditionValue());
            } else if ("DECKS_LEARNED".equalsIgnoreCase(achievement.getConditionType())) {
                unlocked = (totalDecks >= achievement.getConditionValue());
            }

            if (unlocked) {
                unlockAchievement(user, achievement);
            }
        }
    }

    private void unlockAchievement(Users user, Achievement achievement) {
        UserAchievement ua = UserAchievement.builder()
                .user(user)
                .achievement(achievement)
                .unlockedAt(LocalDateTime.now())
                .build();
        userAchievementRepository.save(ua);

        // Also emit SSE event for new badge
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("title", achievement.getTitle());
        payload.put("description", achievement.getDescription());
        payload.put("iconUrl", achievement.getIconUrl());
        payload.put("xpReward", achievement.getXpReward());
        
        sseService.emitToUser(user.getId(), "badge_unlocked", payload);
        
        log.info("User {} unlocked achievement {}", user.getId(), achievement.getCode());
    }

    private int calculateStreak(List<DailyLearningActivity> activities) {
        if (activities == null || activities.isEmpty()) return 0;
        
        // Sort by date descending
        activities.sort((a1, a2) -> a2.getActivityDate().compareTo(a1.getActivityDate()));

        LocalDate today = LocalDate.now();
        LocalDate expectedDate = today;
        int streak = 0;

        for (DailyLearningActivity activity : activities) {
            if (activity.getActivityDate().equals(expectedDate)) {
                if (activity.getXpEarned() != null && activity.getXpEarned() > 0) {
                    streak++;
                    expectedDate = expectedDate.minusDays(1);
                }
            } else if (activity.getActivityDate().equals(today.minusDays(1)) && expectedDate.equals(today)) {
                // They haven't studied today, but they studied yesterday. Streak is still alive from yesterday.
                if (activity.getXpEarned() != null && activity.getXpEarned() > 0) {
                    streak++;
                    expectedDate = today.minusDays(2);
                }
            } else {
                break;
            }
        }
        return streak;
    }
}
