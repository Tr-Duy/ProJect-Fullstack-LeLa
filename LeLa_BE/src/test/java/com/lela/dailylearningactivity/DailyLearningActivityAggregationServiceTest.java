package com.lela.dailylearningactivity;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.srsreview.SrsReviewRepository;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyLearningActivityAggregationServiceTest {

    @Mock
    private DailyLearningActivityRepository repository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private com.lela.notification.SseService sseService;

    @Mock
    private com.lela.achievement.AchievementService achievementService;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private SrsReviewRepository srsReviewRepository;

    @Mock
    private CardProgressRepository cardProgressRepository;

    @InjectMocks
    private DailyLearningActivityServiceImpl service;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @BeforeEach

    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("zxc");
        SecurityContextHolder.setContext(securityContext);

        Users user = new Users();
        user.setId(12L);
        Mockito.lenient().when(usersRepository.findByUsername("zxc")).thenReturn(Optional.of(user));

        Mockito.lenient().when(repository.findAllByUserIdOrderByActivityDateAsc(anyLong())).thenReturn(List.of());
        Mockito.lenient().when(repository.findByUserIdAndActivityDateBetween(anyLong(), Mockito.any(), Mockito.any())).thenReturn(List.of());
        Mockito.lenient().when(srsReviewRepository.findAllForActivityByUserId(anyLong())).thenReturn(List.of());
        Mockito.lenient().when(cardProgressRepository.findAllByUserId(anyLong())).thenReturn(List.of());
    }

    @Test
    void getHistory_marksPlacementQuizOnlyDayAsActive() {
        Quiz quiz = new Quiz();
        quiz.setQuizCategory(QuizCategory.PLACEMENT);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setStartedAt(LocalDateTime.of(2026, 8, 9, 19, 56, 31));
        attempt.setSubmittedAt(LocalDateTime.of(2026, 8, 9, 19, 56, 34));

        when(quizAttemptRepository.findAllByUserIdWithQuiz(12L)).thenReturn(List.of(attempt));

        List<DailyLearningActivityResponse> history = service.getHistory(
                LocalDate.of(2026, 8, 9),
                LocalDate.of(2026, 8, 9)
        );

        assertEquals(1, history.size());
        assertEquals(LocalDate.of(2026, 8, 9), history.get(0).getActivityDate());
        assertTrue(Boolean.TRUE.equals(history.get(0).getActive()));
        assertEquals(1, history.get(0).getQuizCount());
    }

    @Test
    void getTodayActivity_countsYesterdayWhenTodayIsInactive() {
        Quiz finalQuiz = new Quiz();
        finalQuiz.setQuizCategory(QuizCategory.FINAL);

        QuizAttempt yesterdayAttempt = new QuizAttempt();
        yesterdayAttempt.setQuiz(finalQuiz);
        yesterdayAttempt.setStatus(QuizAttemptStatus.SUBMITTED);
        yesterdayAttempt.setSubmittedAt(LocalDate.now().minusDays(1).atTime(8, 0, 0));


        when(quizAttemptRepository.findAllByUserIdWithQuiz(12L)).thenReturn(List.of(yesterdayAttempt));
        when(repository.findByUserIdAndActivityDateBetween(12L, LocalDate.now(), LocalDate.now())).thenReturn(List.of());

        DailyLearningActivityResponse today = service.getTodayActivity();

        assertNotNull(today);
        assertEquals(LocalDate.now(), today.getActivityDate());
        assertEquals(1, today.getCurrentStreak());
        assertTrue(Boolean.FALSE.equals(today.getActive()));
    }
}
