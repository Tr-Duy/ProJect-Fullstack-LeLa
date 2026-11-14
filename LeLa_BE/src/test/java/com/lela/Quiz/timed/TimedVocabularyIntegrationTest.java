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
    @BeforeEach void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("learner1", null, List.of()));
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
        assertEquals(0, BigDecimal.ONE.compareTo(result.getPreciseScore())); assertEquals(10, result.getXpAwarded());
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
        assertEquals(10, result.getXpAwarded());
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
        assertEquals(0, new BigDecimal("11").compareTo(result.getPreciseScore())); assertEquals(20, result.getXpAwarded());
        assertEquals(3, result.getQuestions().size()); assertEquals(3, result.getAnswers().size());
    }
}
