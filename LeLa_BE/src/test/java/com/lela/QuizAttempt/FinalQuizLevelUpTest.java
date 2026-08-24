package com.lela.QuizAttempt;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttempt.dto.QuizAnswerSubmitRequest;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAnswer.QuizAnswerRepository;
import com.lela.QuizQuestionOption.QuizQuestionOptionRepository;
import com.lela.common.ProficiencyLevelRepository;
import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.BeforeEach;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class FinalQuizLevelUpTest {

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ProficiencyLevelRepository levelRepository;

    @Mock
    private QuizAttemptQuestionRepository quizAttemptQuestionRepository;

    @Mock
    private QuizAttemptOptionRepository quizAttemptOptionRepository;

    @Mock
    private QuizQuestionOptionRepository quizQuestionOptionRepository;

    @Mock
    private QuizAnswerRepository quizAnswerRepository;

    @Mock
    private ModelMapper mapper;

    @Mock
    private com.lela.deck.DeckRepository deckRepository;

    @Mock
    private com.lela.deckenrollment.DeckEnrollmentRepository deckEnrollmentRepository;


    @InjectMocks
    private QuizAttemptServiceImpl quizAttemptService;


    private Users userA;
    private Users userB;
    private ExamType toeicExamType;
    private ProficiencyLevel level1;
    private ProficiencyLevel level2;
    private ProficiencyLevel level3;
    private ProficiencyLevel level4;
    private Quiz finalQuizLevel2;
    private Quiz finalQuizLevel3;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @BeforeEach

    void setUp() {
        toeicExamType = new ExamType();
        toeicExamType.setId(1L);
        toeicExamType.setCode("TOEIC");
        toeicExamType.setName("TOEIC");

        level1 = new ProficiencyLevel();
        level1.setId(10L);
        level1.setName("Cơ bản");
        level1.setDisplayOrder(1);
        level1.setExamType(toeicExamType);
        level1.setMaxScore(new BigDecimal("500"));

        level2 = new ProficiencyLevel();
        level2.setId(20L);
        level2.setName("Trung bình - Khá");
        level2.setDisplayOrder(2);
        level2.setExamType(toeicExamType);
        level2.setMaxScore(new BigDecimal("700"));

        level3 = new ProficiencyLevel();
        level3.setId(30L);
        level3.setName("Khá - Giỏi");
        level3.setDisplayOrder(3);
        level3.setExamType(toeicExamType);
        level3.setMaxScore(new BigDecimal("850"));

        level4 = new ProficiencyLevel();
        level4.setId(40L);
        level4.setName("Xuất sắc");
        level4.setDisplayOrder(4);
        level4.setExamType(toeicExamType);
        level4.setMaxScore(new BigDecimal("990"));

        userA = new Users();
        userA.setId(100L);
        userA.setUsername("userA");
        userA.setCurrentLevel(level2);

        userB = new Users();
        userB.setId(200L);
        userB.setUsername("userB");
        userB.setCurrentLevel(level2);

        finalQuizLevel2 = new Quiz();
        finalQuizLevel2.setId(1000L);
        finalQuizLevel2.setTitle("FINAL Level 2 Test");
        finalQuizLevel2.setQuizCategory(QuizCategory.FINAL_LEVEL);
        finalQuizLevel2.setLevel(level2);
        finalQuizLevel2.setPassScore(new BigDecimal("80"));

        finalQuizLevel3 = new Quiz();
        finalQuizLevel3.setId(2000L);
        finalQuizLevel3.setTitle("FINAL Level 3 Test");
        finalQuizLevel3.setQuizCategory(QuizCategory.FINAL_LEVEL);
        finalQuizLevel3.setLevel(level3);
        finalQuizLevel3.setPassScore(new BigDecimal("80"));



        when(deckRepository.findAll()).thenReturn(Collections.emptyList());
        when(deckEnrollmentRepository.findByUserId(any(), any())).thenReturn(org.springframework.data.domain.Page.empty());

        when(mapper.map(any(), eq(com.lela.QuizAttempt.dto.QuizAttemptDetailResponse.class)))
                .thenReturn(new com.lela.QuizAttempt.dto.QuizAttemptDetailResponse());
        when(mapper.map(any(), eq(com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse.class)))
                .thenReturn(new com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse());

        mockAuthentication("userA");
    }


    private void mockAuthentication(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(username);
        when(auth.getName()).thenReturn(username);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    private QuizAttempt prepareAttemptForSubmit(Quiz quiz, Users user, int totalCount) {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(500L);
        attempt.setQuiz(quiz);
        attempt.setUser(user);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(10));
        attempt.setTotalQuestions(totalCount);

        List<QuizAttemptQuestion> questions = new ArrayList<>();
        List<QuizAttemptOption> options = new ArrayList<>();

        for (int i = 0; i < totalCount; i++) {
            QuizAttemptQuestion q = new QuizAttemptQuestion();
            q.setId((long) (i + 1));
            q.setAttempt(attempt);
            q.setPoints(1);
            q.setQuestionType(com.lela.QuizQuestion.domain.QuestionType.MULTIPLE_CHOICE);
            questions.add(q);

            QuizAttemptOption opt = new QuizAttemptOption();
            opt.setId((long) (i + 100));
            opt.setAttemptQuestion(q);
            opt.setIsCorrect(true);
            options.add(opt);
        }

        when(quizAttemptRepository.findById(500L)).thenReturn(Optional.of(attempt));
        when(quizAttemptQuestionRepository.findByAttemptId(500L)).thenReturn(questions);
        when(quizAttemptOptionRepository.findByAttemptQuestionIdIn(any())).thenReturn(options);
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        return attempt;
    }

    private QuizSubmitRequest createSubmitRequest(int correctCount, int totalCount) {
        QuizSubmitRequest req = new QuizSubmitRequest();
        List<QuizAnswerSubmitRequest> answers = new ArrayList<>();

        for (int i = 0; i < totalCount; i++) {
            QuizAnswerSubmitRequest a = new QuizAnswerSubmitRequest();
            a.setAttemptQuestionId((long) (i + 1));
            if (i < correctCount) {
                a.setSelectedAttemptOptionId((long) (i + 100));
            } else {
                a.setSelectedAttemptOptionId(9999L);
            }
            answers.add(a);
        }

        req.setAnswers(answers);
        return req;
    }

    // TEST 1: Level 2 + 10/10 -> PASS -> Level 3
    @Test
    void test1_Level2_10of10_PASS_UpgradesToLevel3() {
        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel2, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(10, 10);

        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(level1, level2, level3, level4));

        quizAttemptService.submit(500L, req);

        assertTrue(attempt.getPassed());
        assertEquals(level3, userA.getCurrentLevel());
        verify(usersRepository).save(userA);
    }

    // TEST 2: Level 2 + 8/10 -> PASS -> Level 3
    @Test
    void test2_Level2_8of10_PASS_UpgradesToLevel3() {
        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel2, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(8, 10);

        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(level1, level2, level3, level4));

        quizAttemptService.submit(500L, req);

        assertTrue(attempt.getPassed());
        assertEquals(level3, userA.getCurrentLevel());
        verify(usersRepository).save(userA);
    }

    // TEST 3 & TEST 12: Level 2 + 7/10 -> FAIL -> Remains Level 2
    @Test
    void test3_12_Level2_7of10_FAIL_RemainsLevel2() {
        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel2, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(7, 10);

        quizAttemptService.submit(500L, req);

        assertFalse(attempt.getPassed());
        assertEquals(level2, userA.getCurrentLevel());
        verify(usersRepository, never()).save(userA);
    }

    // TEST 4: Level 2 + 0/10 -> FAIL -> Remains Level 2
    @Test
    void test4_Level2_0of10_FAIL_RemainsLevel2() {
        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel2, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(0, 10);

        quizAttemptService.submit(500L, req);

        assertFalse(attempt.getPassed());
        assertEquals(level2, userA.getCurrentLevel());
        verify(usersRepository, never()).save(userA);
    }

    // TEST 5: Level 2 + FAIL -> Retry before 12h -> Throws Exception (Locked)
    @Test
    void test5_Level2_FAIL_RetryBefore24h_IsLocked() {
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(1000L)).thenReturn(Optional.of(finalQuizLevel2));

        QuizAttempt failedAttempt = new QuizAttempt();
        failedAttempt.setUser(userA);
        failedAttempt.setQuiz(finalQuizLevel2);
        failedAttempt.setPassed(false);
        failedAttempt.setSubmittedAt(LocalDateTime.now().minusHours(2));

        when(quizAttemptRepository.findByUserId(any(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(failedAttempt)));
        when(quizAttemptRepository.findByUserIdAndQuizIdOrderByStartedAtDesc(any(), any()))
                .thenReturn(List.of(failedAttempt));
        when(quizAttemptRepository.findByUserIdAndQuizQuizCategoryAndQuizLevelIdOrderByStartedAtDesc(any(), any(), any()))
                .thenReturn(List.of(failedAttempt));
        when(quizAttemptRepository.findAllByUserIdWithQuiz(any()))
                .thenReturn(List.of(failedAttempt));
        when(quizAttemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            quizAttemptService.startAttempt(1000L);
        });

        assertTrue(ex.getMessage().contains("tạm khóa"));
    }





    // TEST 6: Level 2 + FAIL -> Retry after >= 24h -> Allowed
    @Test
    void test6_Level2_FAIL_RetryAfter24h_Allowed() {
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(1000L)).thenReturn(Optional.of(finalQuizLevel2));

        QuizAttempt failedAttempt = new QuizAttempt();
        failedAttempt.setUser(userA);
        failedAttempt.setQuiz(finalQuizLevel2);
        failedAttempt.setPassed(false);
        failedAttempt.setSubmittedAt(LocalDateTime.now().minusHours(25));

        when(quizAttemptRepository.findByUserId(eq(100L), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(failedAttempt)));
        when(quizAttemptRepository.findMaxAttemptNumber(100L, 1000L)).thenReturn(1);
        when(quizAttemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> {
            quizAttemptService.startAttempt(1000L);
        });
    }

    // TEST 7: Level 2 + PASS -> No 24h lock
    @Test
    void test7_Level2_PASS_NoLock() {
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(1000L)).thenReturn(Optional.of(finalQuizLevel2));

        QuizAttempt passedAttempt = new QuizAttempt();
        passedAttempt.setUser(userA);
        passedAttempt.setQuiz(finalQuizLevel2);
        passedAttempt.setPassed(true);
        passedAttempt.setSubmittedAt(LocalDateTime.now().minusHours(1));

        when(quizAttemptRepository.findByUserId(eq(100L), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(passedAttempt)));
        when(quizAttemptRepository.findMaxAttemptNumber(100L, 1000L)).thenReturn(1);
        when(quizAttemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> {
            quizAttemptService.startAttempt(1000L);
        });
    }

    // TEST 8: Level 4 + 10/10 -> PASS -> Remains Level 4 (no Level 5)
    @Test
    void test8_Level4_PASS_RemainsLevel4() {
        userA.setCurrentLevel(level4);
        finalQuizLevel3.setLevel(level4);

        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel3, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(10, 10);

        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(level1, level2, level3, level4));

        quizAttemptService.submit(500L, req);

        assertTrue(attempt.getPassed());
        assertEquals(level4, userA.getCurrentLevel());
    }

    // TEST 9 & TEST 15: User A fail FINAL -> User A locked, User B on same quiz is NOT locked
    @Test
    void test9_15_UserAFail_LocksUserA_UserBNotAffected() {
        // User A check
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(1000L)).thenReturn(Optional.of(finalQuizLevel2));

        QuizAttempt failedAttemptUserA = new QuizAttempt();
        failedAttemptUserA.setUser(userA);
        failedAttemptUserA.setQuiz(finalQuizLevel2);
        failedAttemptUserA.setPassed(false);
        failedAttemptUserA.setSubmittedAt(LocalDateTime.now().minusHours(2));

        when(quizAttemptRepository.findByUserId(eq(100L), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(failedAttemptUserA)));
        when(quizAttemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThrows(IllegalStateException.class, () -> {
            quizAttemptService.startAttempt(1000L);
        });

        // User B check
        mockAuthentication("userB");
        when(usersRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(usersRepository.findById(200L)).thenReturn(Optional.of(userB));

        when(quizAttemptRepository.findByUserId(eq(200L), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(Collections.emptyList()));
        when(quizAttemptRepository.findMaxAttemptNumber(200L, 1000L)).thenReturn(0);

        assertDoesNotThrow(() -> {
            quizAttemptService.startAttempt(1000L);
        });
    }





    // TEST 11: Learner at Level 2 submits FINAL of Level 3 -> Rejected by backend
    @Test
    void test11_LearnerLevel2_SubmitsLevel3FINAL_Rejected() {
        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel3, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(10, 10);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            quizAttemptService.submit(500L, req);
        });

        assertTrue(ex.getMessage().contains("không thuộc trình độ hiện tại"));
        assertEquals(level2, userA.getCurrentLevel());
    }

    // TEST 13: Learner Level 2 PASS FINAL Level 2 -> currentLevel changes to Level 3
    @Test
    void test13_Level2_PASS_ChangesToLevel3() {
        QuizAttempt attempt = prepareAttemptForSubmit(finalQuizLevel2, userA, 10);
        QuizSubmitRequest req = createSubmitRequest(9, 10);

        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L))
                .thenReturn(List.of(level1, level2, level3, level4));

        quizAttemptService.submit(500L, req);

        assertTrue(attempt.getPassed());
        assertEquals(level3, userA.getCurrentLevel());
    }
}
