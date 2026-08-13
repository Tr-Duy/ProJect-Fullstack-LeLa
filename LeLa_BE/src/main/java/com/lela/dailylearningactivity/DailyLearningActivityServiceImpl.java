package com.lela.dailylearningactivity;

import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.srsreview.SrsReviewRepository;
import com.lela.srsreview.domain.SrsReview;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
@RequiredArgsConstructor
public class DailyLearningActivityServiceImpl implements DailyLearningActivityService {
    private static final ZoneId ACTIVITY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String ACTIVITY_TIMEZONE = "Asia/Ho_Chi_Minh";

    private final DailyLearningActivityRepository repository;
    private final EntityManager entityManager;
    private final ModelMapper modelMapper;
    private final UsersRepository usersRepository;
    private final com.lela.notification.SseService sseService;
    private final com.lela.achievement.AchievementService achievementService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final SrsReviewRepository srsReviewRepository;
    private final CardProgressRepository cardProgressRepository;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional
    public DailyLearningActivityResponse logActivity(DailyLearningActivityRequest request) {
        Long userId = getCurrentUserId();
        LocalDate today = request.getActivityDate() != null ? request.getActivityDate() : LocalDate.now(ACTIVITY_ZONE);

        DailyLearningActivity activity = repository.findByUserIdAndActivityDate(userId, today)
                .orElseGet(() -> {
                    DailyLearningActivity newActivity = new DailyLearningActivity();
                    newActivity.setUser(entityManager.getReference(Users.class, userId));
                    newActivity.setActivityDate(today);
                    newActivity.setTimezone(ACTIVITY_TIMEZONE);
                    return newActivity;
                });

        activity.setReviewCount(activity.getReviewCount() + (request.getReviewCount() != null ? request.getReviewCount() : 0));
        activity.setCardsLearned(activity.getCardsLearned() + (request.getCardsLearned() != null ? request.getCardsLearned() : 0));
        activity.setQuizCount(activity.getQuizCount() + (request.getQuizCount() != null ? request.getQuizCount() : 0));
        activity.setMinutesSpent(activity.getMinutesSpent() + (request.getMinutesSpent() != null ? request.getMinutesSpent() : 0));
        activity.setXpEarned(activity.getXpEarned() + (request.getXpEarned() != null ? request.getXpEarned() : 0));

        if (request.getGoalMet() != null) {
            activity.setGoalMet(request.getGoalMet());
        }

        DailyLearningActivity saved = repository.save(activity);
        
        // Emit SSE for real-time gamification and update user total XP
        if (request.getXpEarned() != null && request.getXpEarned() > 0) {
            Users userToUpdate = usersRepository.findById(userId).orElseThrow();
            Long currentXp = userToUpdate.getXpTotal() != null ? userToUpdate.getXpTotal() : 0L;
            userToUpdate.setXpTotal(currentXp + request.getXpEarned());
            usersRepository.save(userToUpdate);

            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("gainedXp", request.getXpEarned());
            payload.put("totalXp", userToUpdate.getXpTotal());
            payload.put("cardsReviewed", saved.getReviewCount());
            sseService.emitToUser(userId, "xp_update", payload);
            
            // Evaluate achievements
            achievementService.evaluateAchievements(userId);
        }

        DailyLearningActivityResponse response = mapToResponse(saved);
        response.setActive(isPersistedActivityActive(saved));
        response.setCurrentStreak(calculateCurrentStreak(buildActiveDates(userId), today));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public DailyLearningActivityResponse getTodayActivity() {
        Long userId = getCurrentUserId();
        LocalDate today = LocalDate.now(ACTIVITY_ZONE);
        List<DailyLearningActivityResponse> history = aggregateHistory(userId, today, today);
        DailyLearningActivityResponse response = history.isEmpty() ? emptyResponse(userId, today) : history.get(0);
        response.setCurrentStreak(calculateCurrentStreak(buildActiveDates(userId), today));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<DailyLearningActivityResponse> getHistory(LocalDate startDate, LocalDate endDate) {
        Long userId = getCurrentUserId();
        return aggregateHistory(userId, startDate, endDate);
    }

    private DailyLearningActivityResponse mapToResponse(DailyLearningActivity entity) {
        DailyLearningActivityResponse response = modelMapper.map(entity, DailyLearningActivityResponse.class);
        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
        }
        response.setTimezone(ACTIVITY_TIMEZONE);
        response.setActive(isPersistedActivityActive(entity));
        return response;
    }

    private List<DailyLearningActivityResponse> aggregateHistory(Long userId, LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, DailyLearningActivityResponse> mergedByDate = new LinkedHashMap<>();

        repository.findByUserIdAndActivityDateBetween(userId, startDate, endDate).forEach(activity -> {
            DailyLearningActivityResponse response = mapToResponse(activity);
            response.setCurrentStreak(null);
            mergedByDate.put(activity.getActivityDate(), response);
        });

        for (QuizAttempt attempt : quizAttemptRepository.findAllByUserIdWithQuiz(userId)) {
            LocalDate activityDate = toActivityDate(resolveQuizTimestamp(attempt));
            if (activityDate == null || activityDate.isBefore(startDate) || activityDate.isAfter(endDate)) {
                continue;
            }
            DailyLearningActivityResponse response = mergedByDate.computeIfAbsent(activityDate, date -> emptyResponse(userId, date));
            response.setActive(true);
            response.setQuizCount(Math.max(defaultInt(response.getQuizCount()), 1));
        }

        for (SrsReview review : srsReviewRepository.findAllForActivityByUserId(userId)) {
            LocalDate activityDate = toActivityDate(resolveReviewTimestamp(review));
            if (activityDate == null || activityDate.isBefore(startDate) || activityDate.isAfter(endDate)) {
                continue;
            }
            DailyLearningActivityResponse response = mergedByDate.computeIfAbsent(activityDate, date -> emptyResponse(userId, date));
            response.setActive(true);
            response.setReviewCount(Math.max(defaultInt(response.getReviewCount()), 1));
        }

        for (CardProgress progress : cardProgressRepository.findAllByUserId(userId)) {
            mergeCardProgressTimestamp(userId, startDate, endDate, mergedByDate, progress.getCreatedAt(), progress);
            mergeCardProgressTimestamp(userId, startDate, endDate, mergedByDate, progress.getLastReviewedAt(), progress);
        }

        List<DailyLearningActivityResponse> responses = new ArrayList<>(mergedByDate.values());
        responses.sort(Comparator.comparing(DailyLearningActivityResponse::getActivityDate));
        return responses;
    }

    private void mergeCardProgressTimestamp(Long userId,
                                            LocalDate startDate,
                                            LocalDate endDate,
                                            Map<LocalDate, DailyLearningActivityResponse> mergedByDate,
                                            LocalDateTime timestamp,
                                            CardProgress progress) {
        LocalDate activityDate = toActivityDate(timestamp);
        if (activityDate == null || activityDate.isBefore(startDate) || activityDate.isAfter(endDate)) {
            return;
        }
        DailyLearningActivityResponse response = mergedByDate.computeIfAbsent(activityDate, date -> emptyResponse(userId, date));
        response.setActive(true);
        if (timestamp != null && timestamp.equals(progress.getCreatedAt())) {
            response.setCardsLearned(Math.max(defaultInt(response.getCardsLearned()), 1));
        }
        if (progress.getLastReviewedAt() != null && timestamp.equals(progress.getLastReviewedAt())) {
            response.setReviewCount(Math.max(defaultInt(response.getReviewCount()), 1));
        }
    }

    private TreeSet<LocalDate> buildActiveDates(Long userId) {
        TreeSet<LocalDate> activeDates = new TreeSet<>();

        repository.findAllByUserIdOrderByActivityDateAsc(userId).forEach(activity -> {
            if (isPersistedActivityActive(activity)) {
                activeDates.add(activity.getActivityDate());
            }
        });

        quizAttemptRepository.findAllByUserIdWithQuiz(userId).forEach(attempt -> {
            LocalDate activityDate = toActivityDate(resolveQuizTimestamp(attempt));
            if (activityDate != null) {
                activeDates.add(activityDate);
            }
        });

        srsReviewRepository.findAllForActivityByUserId(userId).forEach(review -> {
            LocalDate activityDate = toActivityDate(resolveReviewTimestamp(review));
            if (activityDate != null) {
                activeDates.add(activityDate);
            }
        });

        cardProgressRepository.findAllByUserId(userId).forEach(progress -> {
            LocalDate createdDate = toActivityDate(progress.getCreatedAt());
            if (createdDate != null) {
                activeDates.add(createdDate);
            }
            LocalDate reviewedDate = toActivityDate(progress.getLastReviewedAt());
            if (reviewedDate != null) {
                activeDates.add(reviewedDate);
            }
        });

        return activeDates;
    }

    private int calculateCurrentStreak(TreeSet<LocalDate> activeDates, LocalDate today) {
        if (activeDates.isEmpty()) {
            return 0;
        }

        LocalDate cursor = activeDates.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (activeDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private DailyLearningActivityResponse emptyResponse(Long userId, LocalDate date) {
        DailyLearningActivityResponse empty = new DailyLearningActivityResponse();
        empty.setUserId(userId);
        empty.setActivityDate(date);
        empty.setTimezone(ACTIVITY_TIMEZONE);
        empty.setActive(false);
        empty.setCurrentStreak(null);
        empty.setReviewCount(0);
        empty.setCardsLearned(0);
        empty.setQuizCount(0);
        empty.setMinutesSpent(0);
        empty.setXpEarned(0);
        empty.setGoalMet(false);
        return empty;
    }

    private boolean isPersistedActivityActive(DailyLearningActivity activity) {
        return defaultInt(activity.getReviewCount()) > 0
                || defaultInt(activity.getCardsLearned()) > 0
                || defaultInt(activity.getQuizCount()) > 0
                || defaultInt(activity.getMinutesSpent()) > 0
                || defaultInt(activity.getXpEarned()) > 0
                || Boolean.TRUE.equals(activity.getGoalMet());
    }

    private LocalDateTime resolveQuizTimestamp(QuizAttempt attempt) {
        if (attempt.getSubmittedAt() != null) {
            return attempt.getSubmittedAt();
        }
        if (attempt.getStartedAt() != null) {
            return attempt.getStartedAt();
        }
        return attempt.getCreatedAt();
    }

    private LocalDateTime resolveReviewTimestamp(SrsReview review) {
        if (review.getClientReviewedAt() != null) {
            return review.getClientReviewedAt();
        }
        if (review.getReviewedAt() != null) {
            return review.getReviewedAt();
        }
        if (review.getServerReceivedAt() != null) {
            return review.getServerReceivedAt();
        }
        return review.getCreatedAt();
    }

    private LocalDate toActivityDate(LocalDateTime timestamp) {
        if (timestamp == null) {
            return null;
        }
        return timestamp.atZone(ACTIVITY_ZONE).toLocalDate();
    }

    private int defaultInt(Integer value) {
        return value != null ? value : 0;
    }
}
