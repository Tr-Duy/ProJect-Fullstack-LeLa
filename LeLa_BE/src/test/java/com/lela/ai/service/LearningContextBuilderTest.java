package com.lela.ai.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.prompt.LearningContextBuilder;
import com.lela.dailylearningactivity.*;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.deck.*;
import com.lela.deck.domain.Deck;
import com.lela.deckenrollment.*;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.QuizAttempt.*;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.users.domain.Users;
import com.lela.common.domain.ProficiencyLevel;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

class LearningContextBuilderTest {
    @Test void matchesPanelReviewsGoalLatestQuizAndActualEnrolledDeck() {
        var daily=mock(DailyLearningActivityService.class);var decks=mock(DeckRepository.class);
        var enrollments=mock(DeckEnrollmentRepository.class);var quizzes=mock(QuizAttemptRepository.class);
        var user=new Users();user.setId(7L);user.setXpTotal(44L);user.setDailyGoalCards(20);
        var level=new ProficiencyLevel();level.setId(1L);level.setName("Cơ bản (Dưới 500)");user.setCurrentLevel(level);
        var today=new DailyLearningActivityResponse();today.setCardsLearned(1);today.setReviewCount(5);
        when(daily.getTodayActivity()).thenReturn(today);
        var deck=new Deck();deck.setId(1L);deck.setTitle("Contracts");deck.setTotalCards(16);deck.setLevel(level);deck.isActive=true;
        var enrollment=new DeckEnrollment();enrollment.setDeck(deck);enrollment.setMasteredCards(4);
        when(decks.findAll()).thenReturn(List.of(deck));
        when(enrollments.findByUserId(eq(7L),any())).thenReturn(new PageImpl<>(List.of(enrollment)));
        var latest=new QuizAttempt();latest.setCorrectAnswers(2);latest.setTotalQuestions(5);
        when(quizzes.findByUserId(eq(7L),any())).thenReturn(new PageImpl<>(List.of(latest)));
        when(quizzes.findByUserIdAndQuizQuizCategoryAndQuizLevelIdOrderByStartedAtDesc(anyLong(),any(),anyLong())).thenReturn(List.of());
        var builder=new LearningContextBuilder(new ObjectMapper(),mock(DailyLearningActivityRepository.class),daily,decks,enrollments,quizzes);
        var context=builder.buildContextObjectForUser(user);
        assertEquals(44,context.getUser().getTotalXp());assertEquals(6,context.getToday().getCardsStudied());
        assertEquals(20,context.getToday().getDailyGoalCards());assertEquals(2,context.getExam().getLatestCorrectAnswers());
        assertEquals(5,context.getExam().getLatestTotalQuestions());assertEquals("Contracts",context.getLearning().getCurrentActiveDeck());
        assertEquals(4,context.getLearning().getEnrolledDecks().get(0).masteredCards());
        assertEquals(16,context.getLearning().getEnrolledDecks().get(0).totalCards());
    }
}
