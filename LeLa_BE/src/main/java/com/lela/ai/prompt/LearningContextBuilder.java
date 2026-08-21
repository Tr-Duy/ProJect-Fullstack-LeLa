package com.lela.ai.prompt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.ai.dto.AiContextDto;
import com.lela.dailylearningactivity.DailyLearningActivityRepository;
import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;

@Slf4j
@Component
@RequiredArgsConstructor
public class LearningContextBuilder {

    private final ObjectMapper objectMapper;
    private final DailyLearningActivityRepository dailyActivityRepository;
    private final DailyLearningActivityService dailyActivityService;
    private final DeckRepository deckRepository;
    private final DeckEnrollmentRepository deckEnrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Transactional(readOnly = true)
    public AiContextDto buildContextObjectForUser(Users user) {
        if (user == null) {
            return new AiContextDto();
        }

        try {
            // 1. User Info
            AiContextDto.UserInfo userInfo = AiContextDto.UserInfo.builder()
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .totalXp(user.getXpTotal() != null ? user.getXpTotal().intValue() : 0)
                    .streakDays(user.getStreakCurrent() != null ? user.getStreakCurrent() : 0)
                    .build();

            // 2. Level Info
            String levelName = "Chưa xác định";
            String scoreRange = "TOEIC";
            Long currentLevelId = null;
            if (user.getCurrentLevel() != null) {
                levelName = user.getCurrentLevel().getName();
                currentLevelId = user.getCurrentLevel().getId();
                if (user.getCurrentLevel().getMinScore() != null) {
                    scoreRange = user.getCurrentLevel().getMinScore() + " - " + user.getCurrentLevel().getMaxScore();
                }
            }

            AiContextDto.LevelInfo levelInfo = AiContextDto.LevelInfo.builder()
                    .name(levelName)
                    .scoreRange(scoreRange)
                    .build();

            // 3. Today Stats
            int xpEarned = 0;
            int cardsLearned = 0;
            int quizCount = 0;
            int minutesSpent = 0;

            try {
                DailyLearningActivityResponse todayAct = dailyActivityService.getTodayActivity();
                if (todayAct != null) {
                    xpEarned = todayAct.getXpEarned() != null ? todayAct.getXpEarned() : 0;
                    cardsLearned = todayAct.getCardsLearned() != null ? todayAct.getCardsLearned() : 0;
                    quizCount = todayAct.getQuizCount() != null ? todayAct.getQuizCount() : 0;
                    minutesSpent = todayAct.getMinutesSpent() != null ? todayAct.getMinutesSpent() : 0;
                }
            } catch (Exception e) {
                log.warn("Failed to fetch today activity from service", e);
                Optional<DailyLearningActivity> todayActOpt = dailyActivityRepository.findByUserIdAndActivityDate(user.getId(), LocalDate.now());
                if (todayActOpt.isPresent()) {
                    DailyLearningActivity act = todayActOpt.get();
                    xpEarned = act.getXpEarned() != null ? act.getXpEarned() : 0;
                    cardsLearned = act.getCardsLearned() != null ? act.getCardsLearned() : 0;
                    quizCount = act.getQuizCount() != null ? act.getQuizCount() : 0;
                    minutesSpent = act.getMinutesSpent() != null ? act.getMinutesSpent() : 0;
                }
            }

            AiContextDto.TodayStats todayStats = AiContextDto.TodayStats.builder()
                    .xpEarned(xpEarned)
                    .cardsLearned(cardsLearned)
                    .quizCount(quizCount)
                    .minutesSpent(minutesSpent)
                    .build();

            // 4. Learning & Deck Progress
            int completedDecksCount = 0;
            int totalDecksInLevel = 0;
            int masteredCardsCount = 0;
            String currentActiveDeck = "Chưa có";

            if (currentLevelId != null) {
                final Long targetLevelId = currentLevelId;
                List<Deck> activeDecks = deckRepository.findAll().stream()
                        .filter(d -> d.isActive && d.getLevel() != null && Objects.equals(d.getLevel().getId(), targetLevelId))
                        .toList();
                totalDecksInLevel = activeDecks.size();

                List<DeckEnrollment> userEnrollments = deckEnrollmentRepository.findByUserId(user.getId(), Pageable.unpaged()).getContent();

                for (Deck d : activeDecks) {
                    Optional<DeckEnrollment> enOpt = userEnrollments.stream()
                            .filter(e -> e.getDeck() != null && Objects.equals(e.getDeck().getId(), d.getId()))
                            .findFirst();

                    int mastered = 0;
                    boolean isComp = false;
                    if (enOpt.isPresent()) {
                        DeckEnrollment en = enOpt.get();
                        mastered = en.getMasteredCards() != null ? en.getMasteredCards() : 0;
                        if (en.getCompletedAt() != null || (d.getTotalCards() != null && d.getTotalCards() > 0 && mastered >= d.getTotalCards())) {
                            isComp = true;
                        }
                    }
                    masteredCardsCount += mastered;
                    if (isComp) {
                        completedDecksCount++;
                    } else if ("Chưa có".equals(currentActiveDeck)) {
                        currentActiveDeck = d.getTitle();
                    }
                }
            }

            AiContextDto.LearningProgress learningProgress = AiContextDto.LearningProgress.builder()
                    .completedDecks(completedDecksCount)
                    .totalDecksInLevel(totalDecksInLevel)
                    .masteredCards(masteredCardsCount)
                    .currentActiveDeck(currentActiveDeck)
                    .build();

            // 5. Exam Status
            int requiredDecks = Math.min(15, totalDecksInLevel > 0 ? totalDecksInLevel : 15);
            boolean isEligible = completedDecksCount >= requiredDecks;

            Integer recentScore = null;
            String recentResult = "NOT_TAKEN";

            if (currentLevelId != null) {
                List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdAndQuizQuizCategoryAndQuizLevelIdOrderByStartedAtDesc(
                        user.getId(), QuizCategory.FINAL_LEVEL, currentLevelId);
                if (!attempts.isEmpty()) {
                    QuizAttempt latest = attempts.get(0);
                    if (latest.getScorePercent() != null) {
                        recentScore = (int) Math.round(latest.getScorePercent().doubleValue());
                    }
                    recentResult = Boolean.TRUE.equals(latest.getPassed()) ? "PASSED" : "FAILED";
                }
            }

            AiContextDto.ExamStatus examStatus = AiContextDto.ExamStatus.builder()
                    .isEligibleForExam(isEligible)
                    .requiredDecks(requiredDecks)
                    .recentScorePercent(recentScore)
                    .recentExamResult(recentResult)
                    .build();

            return AiContextDto.builder()
                    .user(userInfo)
                    .level(levelInfo)
                    .today(todayStats)
                    .learning(learningProgress)
                    .exam(examStatus)
                    .build();

        } catch (Exception e) {
            log.error("Error building context for user: {}", user.getUsername(), e);
            return new AiContextDto();
        }
    }

    public String buildContextForUser(Users user) {
        try {
            AiContextDto contextObj = buildContextObjectForUser(user);
            return objectMapper.writeValueAsString(contextObj);
        } catch (Exception e) {
            log.error("Error serializing context JSON", e);
            return "{}";
        }
    }
}
