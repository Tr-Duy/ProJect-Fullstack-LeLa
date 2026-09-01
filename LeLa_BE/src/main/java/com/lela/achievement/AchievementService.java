package com.lela.achievement;

import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.achievement.domain.Achievement;
import com.lela.achievement.domain.UserAchievement;
import com.lela.achievement.dto.AchievementAdminRequest;
import com.lela.achievement.dto.AchievementResponse;
import com.lela.achievement.dto.UserAchievementProgressResponse;
import com.lela.common.exception.ConflictException;
import com.lela.common.exception.NotFoundExeception;
import com.lela.dailylearningactivity.DailyLearningActivityRepository;
import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.notification.SseService;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final DailyLearningActivityRepository dailyActivityRepository;
    private final DeckEnrollmentRepository deckEnrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UsersRepository usersRepository;
    private final SseService sseService;

    @Transactional
    public void evaluateAchievements(Long userId) {
        Users user = usersRepository.findById(userId).orElse(null);
        if (user == null) return;

        List<Achievement> allAchievements = achievementRepository.findAll();
        if (allAchievements.isEmpty()) return;

        // Calculate global user metrics
        List<DailyLearningActivity> allActivities = dailyActivityRepository.findByUserIdAndActivityDateBetween(
                userId, LocalDate.now().minusYears(10), LocalDate.now());

        long totalXp = allActivities.stream().mapToLong(a -> a.getXpEarned() != null ? a.getXpEarned() : 0).sum();
        long totalReviews = allActivities.stream().mapToLong(a -> a.getReviewCount() != null ? a.getReviewCount() : 0).sum();
        long totalDecks = deckEnrollmentRepository.countByUserId(userId);
        long totalQuizAttempts = quizAttemptRepository.countByUserId(userId);
        long totalQuizPassed = quizAttemptRepository.countByUserIdAndPassedTrue(userId);
        
        List<QuizAttempt> allAttempts = quizAttemptRepository.findAllByUserIdWithQuiz(userId);
        long totalQuizPerfect = allAttempts.stream()
                .filter(a -> a.getScorePercent() != null && a.getScorePercent().compareTo(BigDecimal.valueOf(100)) >= 0)
                .count();

        int currentStreak = calculateStreak(allActivities);
        int toeicLevelOrder = user.getCurrentLevel() != null ? user.getCurrentLevel().getDisplayOrder() : 0;

        Set<String> unlockedCodes = new HashSet<>(userAchievementRepository.findAchievementCodesByUserId(userId));

        for (Achievement achievement : allAchievements) {
            if (!achievement.isActive()) continue;

            // Skip if already unlocked
            if (unlockedCodes.contains(achievement.getCode())) {
                continue;
            }

            boolean unlocked = false;
            String ctype = achievement.getConditionType() != null ? achievement.getConditionType().toUpperCase() : "";
            int cval = achievement.getConditionValue() != null ? achievement.getConditionValue() : 1;
            String code = achievement.getCode();

            if ("FIRST_LOGIN".equals(code)) {
                unlocked = true;
            } else if ("FIRST_CARD".equals(code)) {
                unlocked = totalReviews > 0;
            } else if ("FIRST_DECK".equals(code)) {
                unlocked = totalDecks > 0;
            } else if ("FIRST_QUIZ".equals(code)) {
                unlocked = totalQuizAttempts > 0;
            } else if ("FIRST_PERFECT_QUIZ".equals(code)) {
                unlocked = totalQuizPerfect > 0;
            } else if ("XP".equalsIgnoreCase(ctype)) {
                unlocked = (totalXp >= cval);
            } else if ("STREAK".equalsIgnoreCase(ctype)) {
                unlocked = (currentStreak >= cval);
            } else if ("CARDS_REVIEWED".equalsIgnoreCase(ctype)) {
                unlocked = (totalReviews >= cval);
            } else if ("DECKS_LEARNED".equalsIgnoreCase(ctype)) {
                unlocked = (totalDecks >= cval);
            } else if ("QUIZ_PASS".equalsIgnoreCase(ctype)) {
                unlocked = (totalQuizPassed >= cval);
            } else if ("QUIZ_PERFECT".equalsIgnoreCase(ctype)) {
                unlocked = (totalQuizPerfect >= cval);
            } else if ("TOEIC_LEVEL".equalsIgnoreCase(ctype)) {
                unlocked = (toeicLevelOrder >= cval);
            } else if ("TOPIC_DECKS".equalsIgnoreCase(ctype)) {
                unlocked = (totalDecks >= cval);
            } else if ("TOPICS_MASTERED".equalsIgnoreCase(ctype)) {
                unlocked = (totalDecks >= cval);
            }

            if (unlocked) {
                unlockAchievement(user, achievement);
            }
        }
    }

    private void unlockAchievement(Users user, Achievement achievement) {
        // Double check in service layer
        if (userAchievementRepository.existsByUserIdAndAchievementId(user.getId(), achievement.getId())) {
            return;
        }

        try {
            UserAchievement ua = UserAchievement.builder()
                    .user(user)
                    .achievement(achievement)
                    .unlockedAt(LocalDateTime.now())
                    .build();
            userAchievementRepository.save(ua);

            // Grant XP reward to user's daily learning activity
            if (achievement.getXpReward() != null && achievement.getXpReward() > 0) {
                LocalDate today = LocalDate.now();
                DailyLearningActivity todayActivity = dailyActivityRepository
                        .findByUserIdAndActivityDate(user.getId(), today)
                        .orElseGet(() -> {
                            DailyLearningActivity act = new DailyLearningActivity();
                            act.setUser(user);
                            act.setActivityDate(today);
                            act.setTimezone("Asia/Ho_Chi_Minh");
                            act.setXpEarned(0);
                            act.setReviewCount(0);
                            act.setQuizCount(0);
                            return act;
                        });
                int currentXp = todayActivity.getXpEarned() != null ? todayActivity.getXpEarned() : 0;
                int reward = achievement.getXpReward() != null ? achievement.getXpReward() : 0;
                todayActivity.setXpEarned(currentXp + reward);
                dailyActivityRepository.save(todayActivity);
            }

            // Emit SSE event for new badge notification
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", achievement.getId());
            payload.put("code", achievement.getCode());
            payload.put("title", achievement.getTitle());
            payload.put("description", achievement.getDescription());
            payload.put("iconUrl", achievement.getIconUrl());
            payload.put("xpReward", achievement.getXpReward());

            sseService.emitToUser(user.getId(), "badge_unlocked", payload);
            log.info("User {} successfully unlocked achievement {} and received {} XP", user.getId(), achievement.getCode(), achievement.getXpReward());
        } catch (DataIntegrityViolationException e) {
            log.warn("Concurrent achievement unlock prevented by DB unique constraint for user {} and achievement {}", user.getId(), achievement.getCode());
        }
    }

    @Transactional(readOnly = true)
    public List<UserAchievementProgressResponse> getUserAchievementsProgress(Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new NotFoundExeception("User không tồn tại: " + userId));

        List<Achievement> allAchievements = achievementRepository.findAll();
        List<UserAchievement> unlockedList = userAchievementRepository.findAllByUserId(userId);
        Map<Long, UserAchievement> unlockedMap = unlockedList.stream()
                .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua, (a, b) -> a));

        List<DailyLearningActivity> allActivities = dailyActivityRepository.findByUserIdAndActivityDateBetween(
                userId, LocalDate.now().minusYears(10), LocalDate.now());

        long totalXp = allActivities.stream().mapToLong(a -> a.getXpEarned() != null ? a.getXpEarned() : 0).sum();
        long totalReviews = allActivities.stream().mapToLong(a -> a.getReviewCount() != null ? a.getReviewCount() : 0).sum();
        long totalDecks = deckEnrollmentRepository.countByUserId(userId);
        long totalQuizAttempts = quizAttemptRepository.countByUserId(userId);
        long totalQuizPassed = quizAttemptRepository.countByUserIdAndPassedTrue(userId);

        List<QuizAttempt> allAttempts = quizAttemptRepository.findAllByUserIdWithQuiz(userId);
        long totalQuizPerfect = allAttempts.stream()
                .filter(a -> a.getScorePercent() != null && a.getScorePercent().compareTo(BigDecimal.valueOf(100)) >= 0)
                .count();

        int currentStreak = calculateStreak(allActivities);
        int toeicLevelOrder = user.getCurrentLevel() != null ? user.getCurrentLevel().getDisplayOrder() : 0;

        List<UserAchievementProgressResponse> resList = new ArrayList<>();
        for (Achievement a : allAchievements) {
            if (!a.isActive()) continue;

            boolean isUnlocked = unlockedMap.containsKey(a.getId());
            UserAchievement ua = unlockedMap.get(a.getId());

            long currentVal = 0;
            String ctype = a.getConditionType() != null ? a.getConditionType().toUpperCase() : "";

            if ("FIRST_LOGIN".equals(a.getCode())) {
                currentVal = 1;
            } else if ("FIRST_CARD".equals(a.getCode())) {
                currentVal = totalReviews > 0 ? 1 : 0;
            } else if ("FIRST_DECK".equals(a.getCode())) {
                currentVal = totalDecks > 0 ? 1 : 0;
            } else if ("FIRST_QUIZ".equals(a.getCode())) {
                currentVal = totalQuizAttempts > 0 ? 1 : 0;
            } else if ("FIRST_PERFECT_QUIZ".equals(a.getCode())) {
                currentVal = totalQuizPerfect > 0 ? 1 : 0;
            } else if ("XP".equalsIgnoreCase(ctype)) {
                currentVal = totalXp;
            } else if ("STREAK".equalsIgnoreCase(ctype)) {
                currentVal = currentStreak;
            } else if ("CARDS_REVIEWED".equalsIgnoreCase(ctype)) {
                currentVal = totalReviews;
            } else if ("DECKS_LEARNED".equalsIgnoreCase(ctype)) {
                currentVal = totalDecks;
            } else if ("QUIZ_PASS".equalsIgnoreCase(ctype)) {
                currentVal = totalQuizPassed;
            } else if ("QUIZ_PERFECT".equalsIgnoreCase(ctype)) {
                currentVal = totalQuizPerfect;
            } else if ("TOEIC_LEVEL".equalsIgnoreCase(ctype)) {
                currentVal = toeicLevelOrder;
            } else if ("TOPIC_DECKS".equalsIgnoreCase(ctype)) {
                currentVal = totalDecks;
            } else if ("TOPICS_MASTERED".equalsIgnoreCase(ctype)) {
                currentVal = totalDecks;
            }

            int targetVal = a.getConditionValue() != null && a.getConditionValue() > 0 ? a.getConditionValue() : 1;
            double percent = isUnlocked ? 100.0 : Math.min(100.0, (currentVal * 100.0) / targetVal);

            resList.add(UserAchievementProgressResponse.builder()
                    .id(a.getId())
                    .code(a.getCode())
                    .title(a.getTitle())
                    .description(a.getDescription())
                    .iconUrl(a.getIconUrl())
                    .category(a.getCategory())
                    .conditionType(a.getConditionType())
                    .conditionValue(targetVal)
                    .currentValue(currentVal)
                    .progressPercent(percent)
                    .xpReward(a.getXpReward())
                    .isUnlocked(isUnlocked)
                    .unlockedAt(ua != null ? ua.getUnlockedAt() : null)
                    .build());
        }

        return resList;
    }

    // --- ADMIN CRUD METHODS ---

    @Transactional(readOnly = true)
    public List<AchievementResponse> getAllAchievementsForAdmin() {
        Map<Long, Long> countsMap = new HashMap<>();
        List<Object[]> groupedCounts = userAchievementRepository.countGroupedByAchievementId();
        for (Object[] row : groupedCounts) {
            if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                countsMap.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }
        return achievementRepository.findAll().stream()
                .map(a -> {
                    long count = countsMap.getOrDefault(a.getId(), 0L);
                    return AchievementResponse.fromEntity(a, count);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public AchievementResponse createAchievement(AchievementAdminRequest req) {
        if (achievementRepository.findByCode(req.getCode()).isPresent()) {
            throw new ConflictException("Mã thành tựu đã tồn tại: " + req.getCode());
        }

        Achievement a = Achievement.builder()
                .code(req.getCode().trim().toUpperCase())
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .iconUrl(req.getIconUrl())
                .category(req.getCategory().trim().toUpperCase())
                .conditionType(req.getConditionType().trim().toUpperCase())
                .conditionValue(req.getConditionValue())
                .xpReward(req.getXpReward())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        Achievement saved = achievementRepository.save(a);
        return AchievementResponse.fromEntity(saved, 0L);
    }

    @Transactional
    public AchievementResponse updateAchievement(Long id, AchievementAdminRequest req) {
        Achievement a = achievementRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy thành tựu với ID: " + id));

        if (!a.getCode().equalsIgnoreCase(req.getCode()) && achievementRepository.findByCode(req.getCode()).isPresent()) {
            throw new ConflictException("Mã thành tựu đã tồn tại: " + req.getCode());
        }

        a.setCode(req.getCode().trim().toUpperCase());
        a.setTitle(req.getTitle().trim());
        a.setDescription(req.getDescription());
        if (req.getIconUrl() != null) a.setIconUrl(req.getIconUrl());
        a.setCategory(req.getCategory().trim().toUpperCase());
        a.setConditionType(req.getConditionType().trim().toUpperCase());
        a.setConditionValue(req.getConditionValue());
        a.setXpReward(req.getXpReward());
        if (req.getIsActive() != null) a.setActive(req.getIsActive());

        Achievement updated = achievementRepository.save(a);
        long count = userAchievementRepository.countByAchievementId(id);
        return AchievementResponse.fromEntity(updated, count);
    }

    @Transactional
    public AchievementResponse toggleActive(Long id) {
        Achievement a = achievementRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy thành tựu với ID: " + id));

        a.setActive(!a.isActive());
        Achievement updated = achievementRepository.save(a);
        long count = userAchievementRepository.countByAchievementId(id);
        return AchievementResponse.fromEntity(updated, count);
    }

    private int calculateStreak(List<DailyLearningActivity> activities) {
        if (activities == null || activities.isEmpty()) return 0;

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
