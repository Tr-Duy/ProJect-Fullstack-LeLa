package com.lela.Quiz.timed;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.*;
import com.lela.QuizAttempt.*;
import com.lela.QuizAttempt.dto.*;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizQuestion.domain.*;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import com.lela.users.UsersRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest @ActiveProfiles("dev") @Transactional
class TimedVocabularyIntegrationTest {
    @Autowired TimedQuizEngine engine;
    @Autowired TimedQuizStateRepository states;
    @Autowired QuizAttemptService service;
    @Autowired QuizAttemptRepository attempts;
    @Autowired QuizAttemptQuestionRepository snapshots;
    @Autowired QuizRepository quizzes;
    @Autowired UsersRepository users;
    @Autowired jakarta.persistence.EntityManager entityManager;
    @Autowired com.lela.dailylearningactivity.DailyLearningActivityRepository dailyActivities;
    @Autowired TimedQuizProperties config;
    @Autowired com.lela.dailylearningactivity.DailyLearningActivityService activityService;
    @Autowired com.lela.dailylearningactivity.DailyXpBudget dailyBudget;
    @Autowired com.lela.voice.config.VoiceConfigurationProperties voiceConfig;
    @Autowired com.lela.voice.service.VoiceSessionFinalizer voiceFinalizer;
    private com.lela.users.domain.Users learner;
    @BeforeEach void authenticate() {
        var seed = users.findByUsername("learner1").orElseThrow();
        learner = new com.lela.users.domain.Users();
        org.springframework.beans.BeanUtils.copyProperties(seed, learner, "id", "username", "email", "roleAssignments", "version", "createdAt", "updatedAt");
        learner.setUsername("reward-" + UUID.randomUUID()); learner.setEmail(learner.getUsername() + "@example.invalid");
        learner.setVersion(0L); learner.setXpTotal(0L); learner.setStreakCurrent(0); learner.setStreakLongest(0); learner.setLastActivityDate(null);
        learner = users.saveAndFlush(learner);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(learner.getUsername(), null, List.of()));
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    TimedQuizEngine.Event event(TimedQuizEngine.View view, String action, String left, String right) {
        var event = new TimedQuizEngine.Event(); event.setIndex(view.index()); event.setAction(action);
        event.setRequestId(UUID.randomUUID().toString()); event.setLeftId(left); event.setRightId(right);
        return event;
    }
    QuizAttemptDetailResponse finish(long id, boolean exit, List<QuizAnswerSubmitRequest> answers) {
        var req = new QuizSubmitRequest(); req.setAnswers(answers); req.setAbandoned(exit); return service.submit(id, req);
    }
    TimedQuizEngine.Session session(long id) { return engine.read(states.findById(id).orElseThrow()); }

    @Test void meaningExitKeepsConfirmedAnswerInExistingResultHistoryAndDuplicateSubmit() {
        var view = engine.start("MULTIPLE_CHOICE_MEANING");
        assertEquals(4, view.left().size()); assertTrue(view.solution().isEmpty());
        String correct = session(view.attemptId()).getScreens().getFirst().getSolution().get("answer");
        var action = event(view, "ANSWER", correct, null);
        view = engine.event(view.attemptId(), action); assertTrue(view.done()); assertEquals(BigDecimal.ONE, view.score());
        assertEquals(view.score(), engine.event(view.attemptId(), action).score());
        var result = finish(view.attemptId(), true, List.of());
        assertEquals(0, BigDecimal.ONE.compareTo(result.getPreciseScore())); assertEquals(1, result.getXpAwarded());
        assertNotNull(result.getAbandonedAt()); assertNotNull(result.getSubmittedAt());
        var duplicate = finish(view.attemptId(), false, List.of());
        assertEquals(result.getXpAwarded(), duplicate.getXpAwarded()); assertEquals(result.getSubmittedAt(), duplicate.getSubmittedAt());
        assertTrue(service.findMyAttempts(PageRequest.of(0, 100)).stream().anyMatch(a -> a.getPublicId().equals(result.getPublicId())));
    }
    @Test void matchingCountsErrorOnceAndPreservesPartialPairsOnExit() {
        var view = engine.start("MATCHING_PAIRS");
        var screen = session(view.attemptId()).getScreens().getFirst();
        String left = screen.getLeft().getFirst().getId(), correct = screen.getSolution().get(left);
        String wrong = screen.getRight().stream().filter(c -> !c.getId().equals(correct)).findFirst().orElseThrow().getId();
        var action = event(view, "PAIR", left, wrong);
        engine.event(view.attemptId(), action); engine.event(view.attemptId(), action);
        assertEquals(1, session(view.attemptId()).getScreens().getFirst().getErrors());
        engine.event(view.attemptId(), event(view, "PAIR", left, correct));
        var result = finish(view.attemptId(), true, List.of());
        assertEquals(0, new BigDecimal("0.75").compareTo(result.getPreciseScore()));
        assertEquals(2, result.getXpAwarded());
        assertEquals(0, new BigDecimal("20").compareTo(result.getPreciseMaxScore()));
        assertEquals(1, result.getTimedReview().getFirst().getErrors());
    }
    @Test void lateAnswerIsTimeoutAndDoesNotEarnXp() {
        var view = engine.start("MULTIPLE_CHOICE_MEANING");
        var state = states.findById(view.attemptId()).orElseThrow(); var session = engine.read(state);
        session.getScreens().getFirst().setDeadline(TimedQuizEngine.now() - 3_000); engine.save(state, session);
        view = engine.event(view.attemptId(), event(view, "ANSWER", session.getScreens().getFirst().getSolution().get("answer"), null));
        assertTrue(view.timedOut()); assertEquals(BigDecimal.ZERO, view.score());
        assertEquals(0, finish(view.attemptId(), false, List.of()).getXpAwarded());
    }
    @Test void pauseHidesCellsAndResumeExtendsServerDeadline() {
        var view = engine.start("MATCHING_PAIRS");
        var paused = engine.event(view.attemptId(), event(view, "PAUSE", null, null));
        assertTrue(paused.paused()); assertTrue(paused.left().isEmpty()); assertTrue(paused.right().isEmpty()); assertTrue(paused.solution().isEmpty());
        var state = states.findById(view.attemptId()).orElseThrow(); var session = engine.read(state);
        session.getScreens().getFirst().setPausedAt(TimedQuizEngine.now() - 10_000); engine.save(state, session);
        var resumed = engine.event(view.attemptId(), event(view, "RESUME", null, null));
        assertFalse(resumed.paused()); assertTrue(resumed.deadline() >= view.deadline() + 9_000);
    }
    private TimedQuizEngine.View answerOneMeaning() {
        var view = engine.start("MULTIPLE_CHOICE_MEANING");
        return engine.event(view.attemptId(), event(view, "ANSWER", session(view.attemptId()).getScreens().getFirst().getSolution().get("answer"), null));
    }
    @Test void creditsWalletDailyActivityAndStreakOnceEvenExitThenSubmitTwice() {
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        var view = answerOneMeaning();
        var result = finish(view.attemptId(), true, List.of());
        assertEquals(1, result.getXpAwarded());
        assertEquals(1L, users.findById(learner.getId()).orElseThrow().getXpTotal());
        var activity = dailyActivities.findByUserIdAndActivityDate(learner.getId(), today).orElseThrow();
        assertEquals(1, activity.getXpEarned()); assertEquals(1, activity.getQuizCount());
        assertEquals(1, learner.getStreakCurrent()); assertEquals(today, learner.getLastActivityDate());
        finish(view.attemptId(), false, List.of()); finish(view.attemptId(), true, List.of());
        assertEquals(1L, learner.getXpTotal()); assertEquals(1, activity.getQuizCount()); assertEquals(1, activity.getXpEarned());
    }
    @Test void exhaustedDailyCapStillLogsActivityAndContinuesStreakOnce() {
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        learner.setXpTotal(150L); learner.setStreakCurrent(7); learner.setStreakLongest(7); learner.setLastActivityDate(today.minusDays(1));
        users.saveAndFlush(learner);
        var activity = new com.lela.dailylearningactivity.domain.DailyLearningActivity();
        activity.setUser(learner); activity.setActivityDate(today); activity.setTimezone("Asia/Ho_Chi_Minh"); activity.setXpEarned(150);
        dailyActivities.saveAndFlush(activity);
        var view = answerOneMeaning(); var result = finish(view.attemptId(), true, List.of());
        assertEquals(0, result.getXpAwarded()); assertEquals(150L, learner.getXpTotal());
        assertEquals(8, learner.getStreakCurrent()); assertEquals(today, learner.getLastActivityDate());
        assertEquals(1, activity.getQuizCount()); assertEquals(150, activity.getXpEarned());
        finish(view.attemptId(), false, List.of());
        assertEquals(8, learner.getStreakCurrent()); assertEquals(1, activity.getQuizCount());
    }
    @Test void wrongAnswerStillCountsAsLearningButEmptyExitDoesNot() {
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        var empty = engine.start("MULTIPLE_CHOICE_MEANING"); finish(empty.attemptId(), true, List.of());
        assertTrue(dailyActivities.findByUserIdAndActivityDate(learner.getId(), today).isEmpty());
        var view = engine.start("MULTIPLE_CHOICE_MEANING"); var correct = session(view.attemptId()).getScreens().getFirst().getSolution().get("answer");
        var wrong = view.left().stream().filter(c -> !c.getId().equals(correct)).findFirst().orElseThrow().getId();
        view = engine.event(view.attemptId(), event(view, "ANSWER", wrong, null)); finish(view.attemptId(), true, List.of());
        assertEquals(0L, learner.getXpTotal()); assertEquals(1, learner.getStreakCurrent());
        assertEquals(1, dailyActivities.findByUserIdAndActivityDate(learner.getId(), today).orElseThrow().getQuizCount());
    }
    @Test void usesSharedDailyActivityBudgetAndClipsAwardToRemainingOneXp() {
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        var voiceActivity = new com.lela.dailylearningactivity.dto.DailyLearningActivityRequest();
        // This account already owns the first-voice badge; isolate session XP from its separate 100-XP bonus.
        var badgeId = (Number) entityManager.createNativeQuery("select id from achievements where code='VOICE_SESSION_1'").getSingleResult();
        entityManager.persist(com.lela.achievement.domain.UserAchievement.builder().user(learner)
                .achievement(entityManager.getReference(com.lela.achievement.domain.Achievement.class, badgeId.longValue()))
                .unlockedAt(java.time.LocalDateTime.now()).build());
        entityManager.flush();
        voiceActivity.setActivityDate(today); voiceActivity.setVoiceSessionCount(1); voiceActivity.setXpEarned(149);
        activityService.logActivity(voiceActivity);
        assertEquals(150, voiceConfig.getDailyXpCap());
        assertEquals(149, dailyActivities.findByUserIdAndActivityDate(learner.getId(), today).orElseThrow().getXpEarned());
        assertEquals(1, dailyBudget.remaining(learner.getId(), today, voiceConfig.getDailyXpCap()));
        var view = engine.start("MATCHING_PAIRS"); var screen = session(view.attemptId()).getScreens().getFirst();
        for (var cell : screen.getLeft().subList(0, 2)) engine.event(view.attemptId(), event(view, "PAIR", cell.getId(), screen.getSolution().get(cell.getId())));
        assertTrue(session(view.attemptId()).isParticipated());
        assertEquals(2, session(view.attemptId()).getScreens().getFirst().getMatched().size());
        assertEquals(1, finish(view.attemptId(), true, List.of()).getXpAwarded());
        assertEquals(150L, learner.getXpTotal());
        var next = answerOneMeaning(); assertEquals(0, finish(next.attemptId(), true, List.of()).getXpAwarded());
        assertEquals(150L, learner.getXpTotal());
        var activity = dailyActivities.findByUserIdAndActivityDate(learner.getId(), today).orElseThrow();
        assertEquals(150, activity.getXpEarned()); assertEquals(2, activity.getQuizCount()); assertEquals(1, activity.getVoiceSessionCount());
    }
    @Test void perAttemptCapAndXpRateAreConfigurable() {
        int oldRate = config.getXpPerMeaning(), oldCap = config.getMaxXpPerAttempt();
        try {
            config.setXpPerMeaning(3); config.setMaxXpPerAttempt(2);
            var view = answerOneMeaning(); assertEquals(2, finish(view.attemptId(), true, List.of()).getXpAwarded());
            assertEquals(2L, learner.getXpTotal());
        } finally { config.setXpPerMeaning(oldRate); config.setMaxXpPerAttempt(oldCap); }
    }
    @Test void voiceAlsoUsesTheBudgetAlreadySpentByQuizActivity() {
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        learner.setXpTotal(149L); users.saveAndFlush(learner);
        var activity = new com.lela.dailylearningactivity.domain.DailyLearningActivity();
        activity.setUser(learner); activity.setActivityDate(today); activity.setTimezone("Asia/Ho_Chi_Minh");
        activity.setQuizCount(1); activity.setXpEarned(149); dailyActivities.saveAndFlush(activity);
        var badgeId = (Number) entityManager.createNativeQuery("select id from achievements where code='VOICE_SESSION_1'").getSingleResult();
        entityManager.persist(com.lela.achievement.domain.UserAchievement.builder().user(learner)
                .achievement(entityManager.getReference(com.lela.achievement.domain.Achievement.class, badgeId.longValue()))
                .unlockedAt(java.time.LocalDateTime.now()).build());
        var scenario = entityManager.createQuery("select s from ConversationScenario s", com.lela.voice.domain.ConversationScenario.class).setMaxResults(1).getSingleResult();
        var voice = com.lela.voice.domain.ConversationSession.builder().publicId(UUID.randomUUID().toString()).user(learner)
                .scenario(scenario).quotaDate(today).levelAtStart(200).durationSeconds(60).validTurnCount(3).build();
        entityManager.persist(voice);
        for (int i = 1; i <= 3; i++) entityManager.persist(com.lela.voice.domain.ConversationTurn.builder().session(voice)
                .turnNumber(i).role("USER").transcript("A valid test sentence").isValid(true).grammarErrorsJson("[]").build());
        entityManager.flush();
        assertEquals(1, voiceFinalizer.finalizeSession(voice.getPublicId(), learner.getId(), null).getXpAwarded());
        assertEquals(150L, learner.getXpTotal()); assertEquals(150, activity.getXpEarned());
        voiceFinalizer.finalizeSession(voice.getPublicId(), learner.getId(), null);
        assertEquals(1, activity.getVoiceSessionCount());
        var quiz = answerOneMeaning(); assertEquals(0, finish(quiz.attemptId(), true, List.of()).getXpAwarded());
        assertEquals(150L, learner.getXpTotal()); assertEquals(2, activity.getQuizCount());
    }
    @Test void legacyOnlyQuizRetainsItsExistingScoringAndRewardBehavior() {
        var quiz = new Quiz(); quiz.setQuizCode("LEGACY-TEST-" + UUID.randomUUID()); quiz.setTitle("Legacy regression");
        quiz.setCreatedBy(users.findByUsername("admin").orElseThrow());
        var question = new QuizQuestion(); question.setQuiz(quiz); question.setQuestionText("Legacy question"); question.setQuestionType(QuestionType.MULTIPLE_CHOICE); question.setPoints(10);
        var option = new QuizQuestionOption(); option.setQuestion(question); option.setOptionText("Correct"); option.setIsCorrect(true);
        question.getOptions().add(option); quiz.getQuestions().add(question); quiz = quizzes.saveAndFlush(quiz);
        var attempt = service.startAttempt(quiz.getId()); assertNull(attempt.getTimedScreen());
        var answer = new QuizAnswerSubmitRequest(); answer.setAttemptQuestionId(attempt.getQuestions().getFirst().getId());
        answer.setSelectedAttemptOptionId(attempt.getQuestions().getFirst().getOptions().getFirst().getId());
        var result = finish(attempt.getId(), false, List.of(answer));
        assertEquals(10, result.getScorePoints()); assertEquals(10, result.getXpAwarded()); assertNull(result.getPreciseScore());
        assertEquals(0L, learner.getXpTotal());
        assertTrue(dailyActivities.findAllByUserIdOrderByActivityDateAsc(learner.getId()).isEmpty());
    }
    @Test void accountWithNoEnrolledDeckOrCardProgressCanStartBothModes() {
        var seed = users.findByUsername("learner1").orElseThrow();
        var learner = new com.lela.users.domain.Users();
        org.springframework.beans.BeanUtils.copyProperties(seed, learner, "id", "username", "email", "roleAssignments", "version", "createdAt", "updatedAt");
        learner.setUsername("vocab-" + UUID.randomUUID()); learner.setEmail(learner.getUsername() + "@example.invalid");
        learner.setCurrentLevel(null); learner.setVersion(0L); learner = users.saveAndFlush(learner);
        assertEquals(0L, ((Number) entityManager.createNativeQuery("select count(*) from card_progress where user_id = :id").setParameter("id", learner.getId()).getSingleResult()).longValue());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(learner.getUsername(), null, List.of()));
        assertTrue(engine.start("MULTIPLE_CHOICE_MEANING").total() > 0);
        assertTrue(engine.start("MATCHING_PAIRS").total() > 0);
    }
    @Test void matchingTimeoutPreservesOnlyPairsAcceptedBeforeDeadline() {
        var view = engine.start("MATCHING_PAIRS");
        var screen = session(view.attemptId()).getScreens().getFirst();
        String left = screen.getLeft().getFirst().getId();
        engine.event(view.attemptId(), event(view, "PAIR", left, screen.getSolution().get(left)));
        var state = states.findById(view.attemptId()).orElseThrow(); var session = engine.read(state);
        session.getScreens().getFirst().setDeadline(TimedQuizEngine.now() - 3000); engine.save(state, session);
        var other = screen.getLeft().get(1).getId();
        view = engine.event(view.attemptId(), event(view, "PAIR", other, screen.getSolution().get(other)));
        assertTrue(view.timedOut()); assertEquals(2, view.matched().size());
        assertEquals(0, BigDecimal.ONE.compareTo(finish(view.attemptId(), false, List.of()).getPreciseScore()));
    }
    @Test void mixedLegacyAndNewTypesUseOneSubmitAndScore() {
        var quiz = new Quiz(); quiz.setQuizCode("MIXED-TEST-" + UUID.randomUUID()); quiz.setTitle("Mixed integration");
        quiz.setQuizType(QuizType.MIXED); quiz.setCreatedBy(users.findByUsername("admin").orElseThrow());
        var old = new QuizQuestion(); old.setQuiz(quiz); old.setQuestionText("Existing question"); old.setQuestionType(QuestionType.MULTIPLE_CHOICE); old.setPoints(10);
        var option = new QuizQuestionOption(); option.setQuestion(old); option.setOptionText("Existing correct"); option.setIsCorrect(true); option.setDisplayOrder(0);
        old.getOptions().add(option); quiz.getQuestions().add(old);
        for (var type : List.of(QuestionType.MULTIPLE_CHOICE_MEANING, QuestionType.MATCHING_PAIRS)) {
            var q = new QuizQuestion(); q.setQuiz(quiz); q.setQuestionText("Generated at start"); q.setQuestionType(type); q.setPoints(1); q.setDisplayOrder(quiz.getQuestions().size()); quiz.getQuestions().add(q);
        }
        quiz = quizzes.saveAndFlush(quiz);
        var attempt = service.startAttempt(quiz.getId()); assertNotNull(attempt.getTimedScreen());
        var oldSnapshot = attempt.getQuestions().stream().filter(q -> q.getQuestionType() == QuestionType.MULTIPLE_CHOICE).findFirst().orElseThrow();
        var legacyAnswer = new QuizAnswerSubmitRequest(); legacyAnswer.setAttemptQuestionId(oldSnapshot.getId()); legacyAnswer.setSelectedAttemptOptionId(oldSnapshot.getOptions().getFirst().getId());
        var view = attempt.getTimedScreen(); engine.event(view.attemptId(), event(view, "BEGIN", null, null));
        engine.event(view.attemptId(), event(view, "ANSWER", session(view.attemptId()).getScreens().getFirst().getSolution().get("answer"), null));
        var result = finish(view.attemptId(), true, List.of(legacyAnswer));
        assertEquals(0, new BigDecimal("11").compareTo(result.getPreciseScore())); assertEquals(11, result.getXpAwarded());
        assertEquals(3, result.getQuestions().size()); assertEquals(3, result.getAnswers().size());
    }
}
