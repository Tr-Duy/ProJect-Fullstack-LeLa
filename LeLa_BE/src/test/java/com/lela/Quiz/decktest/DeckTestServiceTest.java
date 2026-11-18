package com.lela.Quiz.decktest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.Quiz.domain.QuizType;
import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.Quiz.timed.TimedQuizState;
import com.lela.Quiz.timed.TimedQuizStateRepository;
import com.lela.Quiz.timed.VocabularyQuizRewards;
import com.lela.Quiz.timed.VocabularyRepository;
import com.lela.QuizAnswer.QuizAnswerRepository;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.achievement.AchievementService;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.common.exception.NotFoundExeception;
import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.DailyXpBudget;
import com.lela.dailylearningactivity.dto.DailyLearningActivityResponse;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.voice.config.VoiceConfigurationProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeckTestServiceTest {

    @Mock
    private DeckRepository deckRepository;
    @Mock
    private FlashcardRepository flashcardRepository;
    @Mock
    private DeckEnrollmentRepository deckEnrollmentRepository;
    @Mock
    private CardProgressRepository cardProgressRepository;
    @Mock
    private QuizRepository quizRepository;
    @Mock
    private QuizAttemptRepository quizAttemptRepository;
    @Mock
    private QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    @Mock
    private QuizAttemptOptionRepository quizAttemptOptionRepository;
    @Mock
    private QuizAnswerRepository quizAnswerRepository;
    @Mock
    private UsersRepository usersRepository;
    @Mock
    private TimedQuizStateRepository timedQuizStateRepository;
    @Mock
    private VocabularyRepository vocabularyRepository;
    @Mock
    private TimedQuizEngine timedQuizEngine;
    @Mock
    private VocabularyQuizRewards vocabularyQuizRewards;
    @Mock
    private DeckCardFilter cardFilter;
    @Mock
    private DeckTestQuestionGenerator questionGenerator;
    @Mock
    private DailyXpBudget dailyXpBudget;
    @Mock
    private DailyLearningActivityService activityService;
    @Mock
    private VoiceConfigurationProperties voiceConfig;
    @Mock
    private AchievementService achievementService;
    @Mock
    private ModelMapper mapper;
    @Mock
    private ObjectMapper json;

    private DeckTestProperties properties;
    private DeckTestServiceImpl service;

    private Users testUser;
    private Deck testDeck;

    @BeforeEach
    void setUp() {
        properties = new DeckTestProperties();
        properties.setMinValidCards(8);
        properties.setRequiredLearnedRatio(0.50);
        properties.setPassScorePercent(70.0);
        properties.setRepeatAttemptXpDiscount(0.50);
        properties.setMaxXpPerAttempt(40);
        properties.setXpPerMeaning(1);
        properties.setXpPerPair(2);

        service = new DeckTestServiceImpl(
                deckRepository, flashcardRepository, deckEnrollmentRepository, cardProgressRepository,
                quizRepository, quizAttemptRepository, quizAttemptQuestionRepository, quizAttemptOptionRepository,
                quizAnswerRepository, usersRepository, timedQuizStateRepository, vocabularyRepository,
                timedQuizEngine, vocabularyQuizRewards, properties, cardFilter, questionGenerator,
                dailyXpBudget, activityService, voiceConfig, achievementService, mapper, json);

        testUser = new Users();
        testUser.setId(100L);
        testUser.setUsername("learner");
        testUser.setXpTotal(50L);

        testDeck = new Deck();
        testDeck.setId(10L);
        testDeck.setDeckCode("TEST-DECK");
        testDeck.setTitle("Deck thử nghiệm");
        testDeck.isActive = true;

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("learner");
        SecurityContext secCtx = mock(SecurityContext.class);
        when(secCtx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(secCtx);

        when(usersRepository.findByUsername("learner")).thenReturn(Optional.of(testUser));
        when(voiceConfig.getTimezone()).thenReturn("Asia/Ho_Chi_Minh");
        when(voiceConfig.getDailyXpCap()).thenReturn(150);
        when(dailyXpBudget.remaining(anyLong(), any(LocalDate.class), anyInt())).thenReturn(100);
        DailyLearningActivityResponse actResp = new DailyLearningActivityResponse();
        actResp.setCurrentStreak(5);
        when(activityService.logActivity(any())).thenReturn(actResp);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private List<Flashcard> makeCards(int count) {
        List<Flashcard> list = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Flashcard f = new Flashcard();
            f.setId((long) (i + 1));
            f.setFrontText("word_" + i);
            f.setBackText("nghĩa " + i);
            f.isActive = true;
            list.add(f);
        }
        return list;
    }

    @Test
    @DisplayName("Status: Bộ thẻ không tồn tại ném NotFoundExeception")
    void shouldThrowNotFoundWhenDeckMissing() {
        when(deckRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDeckTestStatus(999L))
                .isInstanceOf(NotFoundExeception.class);
    }

    @Test
    @DisplayName("Status: Chưa enroll vào bộ thẻ thì eligible=false và có lockReason")
    void shouldReportLockedWhenNotEnrolled() {
        when(deckRepository.findById(10L)).thenReturn(Optional.of(testDeck));
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.empty());
        List<Flashcard> cards = makeCards(16);
        when(flashcardRepository.findAllByDeckIdAndIsActiveTrue(10L)).thenReturn(cards);
        when(cardFilter.filterValidCards(cards)).thenReturn(cards);

        DeckTestStatusResponse status = service.getDeckTestStatus(10L);

        assertThat(status.isEnrolled()).isFalse();
        assertThat(status.isEligible()).isFalse();
        assertThat(status.getLockReason()).contains("chưa tham gia bộ thẻ");
    }

    @Test
    @DisplayName("Status: Bộ thẻ có ít hơn 8 thẻ hợp lệ thì hasEnoughCards=false")
    void shouldReportNotEnoughCards() {
        when(deckRepository.findById(10L)).thenReturn(Optional.of(testDeck));
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        List<Flashcard> cards = makeCards(5);
        when(flashcardRepository.findAllByDeckIdAndIsActiveTrue(10L)).thenReturn(cards);
        when(cardFilter.filterValidCards(cards)).thenReturn(cards);

        DeckTestStatusResponse status = service.getDeckTestStatus(10L);

        assertThat(status.isHasEnoughCards()).isFalse();
        assertThat(status.isEligible()).isFalse();
        assertThat(status.getLockReason()).contains("chưa đủ dữ liệu cho bài thi");
    }

    @Test
    @DisplayName("Status: Đã enroll nhưng chưa học đủ 50% số thẻ hợp lệ thì bị khóa kèm số thẻ cần học")
    void shouldReportLockedWhenBelowThreshold() {
        when(deckRepository.findById(10L)).thenReturn(Optional.of(testDeck));
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        List<Flashcard> cards = makeCards(16);
        when(flashcardRepository.findAllByDeckIdAndIsActiveTrue(10L)).thenReturn(cards);
        when(cardFilter.filterValidCards(cards)).thenReturn(cards);

        // Giả sử học viên mới học 3 thẻ (yêu cầu là 8 thẻ = 50% của 16)
        List<CardProgress> progressList = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            CardProgress cp = new CardProgress();
            cp.setCard(cards.get(i));
            cp.setState(CardProgressState.LEARNING);
            progressList.add(cp);
        }
        when(cardProgressRepository.findAllByUserIdAndDeckId(100L, 10L)).thenReturn(progressList);

        DeckTestStatusResponse status = service.getDeckTestStatus(10L);

        assertThat(status.isEligible()).isFalse();
        assertThat(status.getLearnedCards()).isEqualTo(3);
        assertThat(status.getRequiredLearnedCards()).isEqualTo(8);
        assertThat(status.getLockReason()).contains("Cần học thêm 5 thẻ để mở khóa bài thi");
    }

    @Test
    @DisplayName("Status: Đã enroll và học đủ >= 50% số thẻ hợp lệ thì mở khóa eligible=true")
    void shouldReportUnlockedWhenThresholdMet() {
        when(deckRepository.findById(10L)).thenReturn(Optional.of(testDeck));
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        List<Flashcard> cards = makeCards(16);
        when(flashcardRepository.findAllByDeckIdAndIsActiveTrue(10L)).thenReturn(cards);
        when(cardFilter.filterValidCards(cards)).thenReturn(cards);

        // Học viên đã học 8 thẻ (50% của 16)
        List<CardProgress> progressList = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            CardProgress cp = new CardProgress();
            cp.setCard(cards.get(i));
            cp.setState(CardProgressState.REVIEW);
            progressList.add(cp);
        }
        when(cardProgressRepository.findAllByUserIdAndDeckId(100L, 10L)).thenReturn(progressList);

        DeckTestStatusResponse status = service.getDeckTestStatus(10L);

        assertThat(status.isEligible()).isTrue();
        assertThat(status.getLockReason()).isNull();
        assertThat(status.getLearnedCards()).isEqualTo(8);
    }

    @Test
    @DisplayName("startDeckTest: Từ chối 403 nếu chưa đủ điều kiện mở khóa")
    void shouldRejectStartWhenNotEligible() {
        when(deckRepository.findById(10L)).thenReturn(Optional.of(testDeck));
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.empty());
        List<Flashcard> cards = makeCards(16);
        when(flashcardRepository.findAllByDeckIdAndIsActiveTrue(10L)).thenReturn(cards);
        when(cardFilter.filterValidCards(cards)).thenReturn(cards);

        assertThatThrownBy(() -> service.startDeckTest(10L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("chưa tham gia bộ thẻ");
    }

    @Test
    @DisplayName("startDeckTest: Ném ResponseStatusException HTTP 422 khi generator ném IllegalStateException")
    void shouldThrow422WhenQuestionGeneratorFailsWithIllegalStateException() {
        when(deckRepository.findById(10L)).thenReturn(Optional.of(testDeck));
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        List<Flashcard> cards = makeCards(16);
        when(flashcardRepository.findAllByDeckIdAndIsActiveTrue(10L)).thenReturn(cards);
        when(cardFilter.filterValidCards(cards)).thenReturn(cards);

        List<CardProgress> progressList = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            CardProgress cp = new CardProgress();
            cp.setCard(cards.get(i));
            cp.setState(CardProgressState.LEARNING);
            progressList.add(cp);
        }
        when(cardProgressRepository.findAllByUserIdAndDeckId(100L, 10L)).thenReturn(progressList);

        when(questionGenerator.generateExam(any(), any(), anyInt(), anyInt(), anyInt(), anyInt()))
                .thenThrow(new IllegalStateException("Không đủ 4 lựa chọn không trùng nghĩa cho câu hỏi"));

        assertThatThrownBy(() -> service.startDeckTest(10L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode().value()).isEqualTo(422);
                    assertThat(rse.getReason()).contains("Không thể sinh đề thi cho bộ thẻ này");
                });
    }

    @Test
    @DisplayName("submitDeckTest: Idempotent - nộp lần 2 cùng một attempt không cộng thêm XP")
    void shouldBeIdempotentOnResubmit() {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(500L);
        attempt.setUser(testUser);
        attempt.setSubmittedAt(LocalDateTime.now().minusMinutes(5));
        attempt.setXpAwarded(25);
        when(quizAttemptRepository.findById(500L)).thenReturn(Optional.of(attempt));

        QuizAttemptDetailResponse mockResp = new QuizAttemptDetailResponse();
        mockResp.setXpAwarded(25);
        when(mapper.map(attempt, QuizAttemptDetailResponse.class)).thenReturn(mockResp);

        QuizAttemptDetailResponse res = service.submitDeckTest(500L, new QuizSubmitRequest());

        assertThat(res.getXpAwarded()).isEqualTo(25);
        verify(activityService, never()).logActivity(any());
        verify(usersRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitDeckTest: Nộp lần đầu hôm nay nhận đủ XP và cập nhật user.xp_total")
    void shouldAwardFullXpOnFirstSubmitToday() {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(501L);
        attempt.setUser(testUser);
        Quiz quiz = new Quiz();
        quiz.setDeck(testDeck);
        quiz.setQuizCategory(QuizCategory.DECK_TEST);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(5));

        when(quizAttemptRepository.findById(501L)).thenReturn(Optional.of(attempt));
        when(quizAttemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Mock 1 screen with 4 points
        TimedQuizEngine.Earned earned = new TimedQuizEngine.Earned(BigDecimal.valueOf(4), 4, BigDecimal.valueOf(4));
        when(timedQuizEngine.finalizeForSubmit(501L)).thenReturn(Map.of(1L, earned));
        when(timedQuizEngine.participated(501L)).thenReturn(true);

        com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion q = new com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion();
        q.setId(1L);
        q.setPoints(4);
        q.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MATCHING_PAIRS);
        when(quizAttemptQuestionRepository.findByAttemptId(501L)).thenReturn(List.of(q));

        // Không có lần nộp nào trước đó hôm nay
        when(quizAttemptRepository.countSubmittedDeckAttemptsOnDate(eq(100L), eq(10L), any(), any(), eq(501L)))
                .thenReturn(0L);

        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setUser(testUser);
        enrollment.setDeck(testDeck);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        QuizAttemptDetailResponse mockResp = new QuizAttemptDetailResponse();
        when(mapper.map(any(), eq(QuizAttemptDetailResponse.class))).thenReturn(mockResp);

        service.submitDeckTest(501L, new QuizSubmitRequest());

        // rawXp = 4 * 2 (pair points) = 8 XP
        verify(activityService, times(1)).logActivity(argThat(req -> req.getXpEarned() == 8));
        assertThat(attempt.getXpAwarded()).isEqualTo(8);
        assertThat(enrollment.getTopicTestPassed()).isTrue(); // Đạt 100% >= 70%
        verify(deckEnrollmentRepository, times(1)).save(enrollment);
    }

    @Test
    @DisplayName("submitDeckTest: Nộp lần 2 trong cùng ngày nhận 0 XP nhưng vẫn cập nhật streak")
    void shouldAwardZeroXpOnSubsequentSubmitToday() {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(502L);
        attempt.setUser(testUser);
        Quiz quiz = new Quiz();
        quiz.setDeck(testDeck);
        quiz.setQuizCategory(QuizCategory.DECK_TEST);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(3));

        when(quizAttemptRepository.findById(502L)).thenReturn(Optional.of(attempt));
        when(quizAttemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TimedQuizEngine.Earned earned = new TimedQuizEngine.Earned(BigDecimal.valueOf(4), 4, BigDecimal.valueOf(4));
        when(timedQuizEngine.finalizeForSubmit(502L)).thenReturn(Map.of(1L, earned));
        when(timedQuizEngine.participated(502L)).thenReturn(true);

        com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion q = new com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion();
        q.setId(1L);
        q.setPoints(4);
        q.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MATCHING_PAIRS);
        when(quizAttemptQuestionRepository.findByAttemptId(502L)).thenReturn(List.of(q));

        // Đã có 1 lần nộp trước đó hôm nay
        when(quizAttemptRepository.countSubmittedDeckAttemptsOnDate(eq(100L), eq(10L), any(), any(), eq(502L)))
                .thenReturn(1L);

        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setUser(testUser);
        enrollment.setDeck(testDeck);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        QuizAttemptDetailResponse mockResp = new QuizAttemptDetailResponse();
        when(mapper.map(any(), eq(QuizAttemptDetailResponse.class))).thenReturn(mockResp);

        service.submitDeckTest(502L, new QuizSubmitRequest());

        // Lần thứ 2 nhận 0 XP, user.xpTotal giữ nguyên 50L
        assertThat(testUser.getXpTotal()).isEqualTo(50L);
        assertThat(attempt.getXpAwarded()).isEqualTo(0);
        // Nhưng hoạt động học vẫn được ghi nhận để giữ streak!
        verify(activityService, times(1))
                .logActivity(argThat(req -> req.getXpEarned() == 0 && req.getQuizCount() == 1));
        verify(usersRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Branch (a): Ngày khác nhưng CHƯA TỪNG ĐẠT trước đó -> nhận 100% full XP")
    void shouldAwardFullXpOnDifferentDayWhenNeverPassedBefore() {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(503L);
        attempt.setUser(testUser);
        Quiz quiz = new Quiz();
        quiz.setDeck(testDeck);
        quiz.setQuizCategory(QuizCategory.DECK_TEST);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(3));

        when(quizAttemptRepository.findById(503L)).thenReturn(Optional.of(attempt));
        when(quizAttemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TimedQuizEngine.Earned earned = new TimedQuizEngine.Earned(BigDecimal.valueOf(4), 4, BigDecimal.valueOf(4));
        when(timedQuizEngine.finalizeForSubmit(503L)).thenReturn(Map.of(1L, earned));
        when(timedQuizEngine.participated(503L)).thenReturn(true);

        com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion q = new com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion();
        q.setId(1L);
        q.setPoints(4);
        q.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MATCHING_PAIRS);
        when(quizAttemptQuestionRepository.findByAttemptId(503L)).thenReturn(List.of(q));

        // Lần đầu hôm nay: 0 submissions today
        when(quizAttemptRepository.countSubmittedDeckAttemptsOnDate(eq(100L), eq(10L), any(), any(), eq(503L)))
                .thenReturn(0L);
        // Chưa từng pass trước hôm nay
        when(quizAttemptRepository.countPassedDeckAttemptsBefore(eq(100L), eq(10L), any())).thenReturn(0L);

        // Enrollment có lần thi hôm qua nhưng FAILED (topicTestPassed = false)
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setUser(testUser);
        enrollment.setDeck(testDeck);
        enrollment.setTopicTestPassed(false);
        enrollment.setTopicTestLastAttemptAt(LocalDateTime.now().minusDays(1));
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        QuizAttemptDetailResponse mockResp = new QuizAttemptDetailResponse();
        when(mapper.map(any(), eq(QuizAttemptDetailResponse.class))).thenReturn(mockResp);

        service.submitDeckTest(503L, new QuizSubmitRequest());

        // Nhận đủ 100% XP: 4 * 2 = 8 XP
        assertThat(attempt.getXpAwarded()).isEqualTo(8);
        verify(activityService, times(1)).logActivity(argThat(req -> req.getXpEarned() == 8));
    }

    @Test
    @DisplayName("Branch (b): Ngày khác và ĐÃ TỪNG ĐẠT trước đó -> nhận 50% XP")
    void shouldAwardFiftyPercentXpOnDifferentDayWhenPreviouslyPassed() {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(504L);
        attempt.setUser(testUser);
        Quiz quiz = new Quiz();
        quiz.setDeck(testDeck);
        quiz.setQuizCategory(QuizCategory.DECK_TEST);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(3));

        when(quizAttemptRepository.findById(504L)).thenReturn(Optional.of(attempt));
        when(quizAttemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TimedQuizEngine.Earned earned = new TimedQuizEngine.Earned(BigDecimal.valueOf(4), 4, BigDecimal.valueOf(4));
        when(timedQuizEngine.finalizeForSubmit(504L)).thenReturn(Map.of(1L, earned));
        when(timedQuizEngine.participated(504L)).thenReturn(true);

        com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion q = new com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion();
        q.setId(1L);
        q.setPoints(4);
        q.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MATCHING_PAIRS);
        when(quizAttemptQuestionRepository.findByAttemptId(504L)).thenReturn(List.of(q));

        // Lần đầu hôm nay: 0 submissions today
        when(quizAttemptRepository.countSubmittedDeckAttemptsOnDate(eq(100L), eq(10L), any(), any(), eq(504L)))
                .thenReturn(0L);
        // Đã từng pass trước hôm nay
        when(quizAttemptRepository.countPassedDeckAttemptsBefore(eq(100L), eq(10L), any())).thenReturn(1L);

        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setUser(testUser);
        enrollment.setDeck(testDeck);
        enrollment.setTopicTestPassed(true);
        enrollment.setTopicTestLastAttemptAt(LocalDateTime.now().minusDays(1));
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        QuizAttemptDetailResponse mockResp = new QuizAttemptDetailResponse();
        when(mapper.map(any(), eq(QuizAttemptDetailResponse.class))).thenReturn(mockResp);

        service.submitDeckTest(504L, new QuizSubmitRequest());

        // Nhận 50% XP: 8 * 0.5 = 4 XP
        assertThat(attempt.getXpAwarded()).isEqualTo(4);
        verify(activityService, times(1)).logActivity(argThat(req -> req.getXpEarned() == 4));
    }

    @Test
    @DisplayName("Regression: users.xp_total chỉ tăng đúng 1 lần qua activityService (không bị cộng đúp trong DeckTestService)")
    void shouldNotDoubleCountUserXpTotal() {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(505L);
        attempt.setUser(testUser);
        Quiz quiz = new Quiz();
        quiz.setDeck(testDeck);
        quiz.setQuizCategory(QuizCategory.DECK_TEST);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(2));

        when(quizAttemptRepository.findById(505L)).thenReturn(Optional.of(attempt));
        when(quizAttemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TimedQuizEngine.Earned earned = new TimedQuizEngine.Earned(BigDecimal.valueOf(4), 4, BigDecimal.valueOf(4));
        when(timedQuizEngine.finalizeForSubmit(505L)).thenReturn(Map.of(1L, earned));
        when(timedQuizEngine.participated(505L)).thenReturn(true);

        com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion q = new com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion();
        q.setId(1L);
        q.setPoints(4);
        q.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MATCHING_PAIRS);
        when(quizAttemptQuestionRepository.findByAttemptId(505L)).thenReturn(List.of(q));
        when(quizAttemptRepository.countSubmittedDeckAttemptsOnDate(eq(100L), eq(10L), any(), any(), eq(505L)))
                .thenReturn(0L);
        when(quizAttemptRepository.countPassedDeckAttemptsBefore(eq(100L), eq(10L), any())).thenReturn(0L);

        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setUser(testUser);
        enrollment.setDeck(testDeck);
        when(deckEnrollmentRepository.findByUserIdAndDeckId(100L, 10L)).thenReturn(Optional.of(enrollment));

        // Ban đầu testUser có xpTotal = 50L.
        // Khi logActivity được gọi, nó trả về response (ở implementation thực sẽ cộng 8
        // vào xp_total = 58L).
        // DeckTestServiceImpl tải refreshedUser từ DB và chỉ cập nhật streak, KHÔNG
        // setXpTotal lần nữa.
        testUser.setXpTotal(58L); // Giả lập trạng thái sau khi activityService.logActivity hoàn thành
        when(usersRepository.findById(100L)).thenReturn(Optional.of(testUser));

        QuizAttemptDetailResponse mockResp = new QuizAttemptDetailResponse();
        when(mapper.map(any(), eq(QuizAttemptDetailResponse.class))).thenReturn(mockResp);

        service.submitDeckTest(505L, new QuizSubmitRequest());

        // Xác nhận testUser.xpTotal vẫn là 58L, không bị tăng thành 66L
        assertThat(testUser.getXpTotal()).isEqualTo(58L);
        verify(activityService, times(1)).logActivity(argThat(req -> req.getXpEarned() == 8));
        verify(usersRepository, times(1)).save(testUser);
    }
}
