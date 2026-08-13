package com.lela.QuizAttempt;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.common.domain.ProficiencyLevel;
import com.lela.QuizAttempt.domain.QuizAttempt;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.lang.reflect.Method;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

public class QuizAttemptScoringTest {

    private QuizAttemptServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        // create service with null dependencies via reflection
        service = org.mockito.Mockito.mock(QuizAttemptServiceImpl.class, org.mockito.Mockito.CALLS_REAL_METHODS);
        // since we only call private methods via reflection, it's fine to use a partial
        // mock
    }

    private Object callPrivate(String name, Class<?> paramType, Object param) throws Exception {
        Method m = QuizAttemptServiceImpl.class.getDeclaredMethod(name, paramType);
        m.setAccessible(true);
        return m.invoke(service, param);
    }

    @Test
    void testNormal10of10() throws Exception {
        QuizAttempt a = new QuizAttempt();
        Quiz q = new Quiz();
        q.setQuizCategory(QuizCategory.NORMAL);
        a.setQuiz(q);
        a.setCorrectAnswers(10);
        a.setTotalQuestions(10);

        BigDecimal max = (BigDecimal) callPrivate("determineAttemptMaxScore", QuizAttempt.class, a);
        assertEquals(100, max.intValue());

        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(100, est.intValue());
    }

    private QuizAttempt makeAttempt(QuizCategory category, int levelOrder, double levelMax, int correct, int total) {
        QuizAttempt a = new QuizAttempt();
        Quiz q = new Quiz();
        q.setQuizCategory(category);
        ProficiencyLevel lvl = new ProficiencyLevel();
        lvl.setDisplayOrder(levelOrder);
        lvl.setMaxScore(BigDecimal.valueOf(levelMax));
        q.setLevel(lvl);
        a.setQuiz(q);
        a.setCorrectAnswers(correct);
        a.setTotalQuestions(total);
        return a;
    }

    @Test
    void testFinalBasic10of10() throws Exception {
        QuizAttempt a = makeAttempt(QuizCategory.FINAL, 1, 499.99, 10, 10);
        BigDecimal max = (BigDecimal) callPrivate("determineAttemptMaxScore", QuizAttempt.class, a);
        assertEquals(500, max.intValue());
        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(500, est.intValue());
    }

    @Test
    void testFinalIntermediate10of10() throws Exception {
        QuizAttempt a = makeAttempt(QuizCategory.FINAL, 2, 700.99, 10, 10);
        BigDecimal max = (BigDecimal) callPrivate("determineAttemptMaxScore", QuizAttempt.class, a);
        assertEquals(700, max.intValue());
        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(700, est.intValue());
    }

    @Test
    void testFinalAdvanced10of10() throws Exception {
        QuizAttempt a = makeAttempt(QuizCategory.FINAL, 3, 850.99, 10, 10);
        BigDecimal max = (BigDecimal) callPrivate("determineAttemptMaxScore", QuizAttempt.class, a);
        assertEquals(850, max.intValue());
        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(850, est.intValue());
    }

    @Test
    void testFinalExcellent10of10() throws Exception {
        QuizAttempt a = makeAttempt(QuizCategory.FINAL, 4, 990, 10, 10);
        BigDecimal max = (BigDecimal) callPrivate("determineAttemptMaxScore", QuizAttempt.class, a);
        assertEquals(990, max.intValue());
        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(990, est.intValue());
    }

    @Test
    void testFinalIntermediate8of10() throws Exception {
        QuizAttempt a = makeAttempt(QuizCategory.FINAL, 2, 700.99, 8, 10);
        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(560, est.intValue());
    }

    @Test
    void testFinalIntermediate7of10() throws Exception {
        QuizAttempt a = makeAttempt(QuizCategory.FINAL, 2, 700.99, 7, 10);
        BigDecimal est = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a);
        assertEquals(490, est.intValue());
    }

    @Test
    void testLevelUpPassCases() throws Exception {
        QuizAttempt a1 = makeAttempt(QuizCategory.LEVEL_UP, 2, 700.99, 10, 10);
        BigDecimal est1 = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a1);
        assertEquals(700, est1.intValue());
        int percent1 = (int) Math.round((double) a1.getCorrectAnswers() / a1.getTotalQuestions() * 100);
        assertTrue(percent1 >= 80);

        QuizAttempt a2 = makeAttempt(QuizCategory.LEVEL_UP, 2, 700.99, 8, 10);
        BigDecimal est2 = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a2);
        assertEquals(560, est2.intValue());
        int percent2 = (int) Math.round((double) a2.getCorrectAnswers() / a2.getTotalQuestions() * 100);
        assertTrue(percent2 >= 80);

        QuizAttempt a3 = makeAttempt(QuizCategory.LEVEL_UP, 2, 700.99, 7, 10);
        BigDecimal est3 = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, a3);
        assertEquals(490, est3.intValue());
        int percent3 = (int) Math.round((double) a3.getCorrectAnswers() / a3.getTotalQuestions() * 100);
        assertFalse(percent3 >= 80);
    }

    @Test
    void testEdgeCases() throws Exception {
        QuizAttempt zero = makeAttempt(QuizCategory.FINAL, 2, 700.99, 0, 10);
        BigDecimal e0 = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, zero);
        assertEquals(0, e0.intValue());

        QuizAttempt one = makeAttempt(QuizCategory.FINAL, 2, 700.99, 1, 10);
        BigDecimal e1 = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, one);
        assertEquals(70, e1.intValue());

        // not exceed maxScore
        QuizAttempt over = makeAttempt(QuizCategory.FINAL, 2, 700.99, 1000, 10);
        BigDecimal ov = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, over);
        assertTrue(ov.intValue() <= 700);

        // not negative
        QuizAttempt neg = makeAttempt(QuizCategory.FINAL, 2, 700.99, -1, 10);
        BigDecimal ne = (BigDecimal) callPrivate("calculateEstimatedToeicScoreForAttempt", QuizAttempt.class, neg);
        assertTrue(ne.intValue() >= 0);
    }
}
