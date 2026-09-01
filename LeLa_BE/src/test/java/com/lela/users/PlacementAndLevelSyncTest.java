package com.lela.users;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.QuizAttemptServiceImpl;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.QuizQuestionOption.QuizQuestionOptionRepository;
import com.lela.common.ProficiencyLevelRepository;
import com.lela.common.ExamTypeRepository;
import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class PlacementAndLevelSyncTest {

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ProficiencyLevelRepository levelRepository;

    @Mock
    private ExamTypeRepository examTypeRepository;

    @Mock
    private QuizQuestionOptionRepository quizQuestionOptionRepository;

    @Mock
    private com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository quizAttemptQuestionRepository;

    @Mock
    private com.lela.QuizAttemptOption.QuizAttemptOptionRepository quizAttemptOptionRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizAttemptServiceImpl quizAttemptService;

    @InjectMocks
    private OnboardingService onboardingService;

    private Users userA;
    private Users userB;
    private ExamType toeicExamType;
    private ProficiencyLevel level1;
    private ProficiencyLevel level2;
    private Quiz placementQuiz;

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
        level1.setMinScore(new BigDecimal("0"));
        level1.setMaxScore(new BigDecimal("500"));

        level2 = new ProficiencyLevel();
        level2.setId(20L);
        level2.setName("Trung bình - Khá");
        level2.setDisplayOrder(2);
        level2.setExamType(toeicExamType);
        level2.setMinScore(new BigDecimal("500"));
        level2.setMaxScore(new BigDecimal("700"));

        userA = new Users();
        userA.setId(100L);
        userA.setUsername("userA");
        userA.setCurrentLevel(null); // New user without level

        userB = new Users();
        userB.setId(200L);
        userB.setUsername("userB");
        userB.setCurrentLevel(null);

        placementQuiz = new Quiz();
        placementQuiz.setId(5000L);
        placementQuiz.setTitle("TOEIC Placement Test");
        placementQuiz.setQuizCategory(QuizCategory.PLACEMENT);
        placementQuiz.setExamType(toeicExamType);

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

    // TEST 1: New user registration -> currentLevel is null
    @Test
    void test1_NewUser_CurrentLevelIsNull() {
        assertNull(userA.getCurrentLevel());
    }

    // TEST 2: New user manual select level "Cơ bản" -> level updated to Level 1
    @Test
    void test2_NewUser_SelectsLevel1_SetsCurrentLevel() {
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(examTypeRepository.findById(1L)).thenReturn(Optional.of(toeicExamType));
        when(levelRepository.findById(10L)).thenReturn(Optional.of(level1));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));

        onboardingService.manualSelectLevel(1L, 10L);

        assertEquals(level1, userA.getCurrentLevel());
        assertEquals(toeicExamType, userA.getCurrentExamType());
    }

    // TEST 1: selectedLevel = Dưới 500 (Level 1), score = 13/30 -> FAIL -> currentLevel = Dưới 500, placementCompleted = true
    @Test
    void test1_SelectedLowestLevel_Failed_AssignsLowestLevelAndCompletesPlacement() {
        placementQuiz.setLevel(level1);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(1001L);
        attempt.setPublicId("att-u500-fail");
        attempt.setUser(userA);
        attempt.setQuiz(placementQuiz);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setTotalQuestions(30);
        attempt.setCorrectAnswers(13);
        attempt.setScorePercent(new BigDecimal("43.33"));
        attempt.setPassed(false);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-u500-fail")).thenReturn(Optional.of(attempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        com.lela.users.dto.PlacementTestResult result = onboardingService.processPlacementResult("att-u500-fail");

        assertFalse(result.getPassed());
        assertTrue(result.getIsLowestLevel());
        assertTrue(result.getPlacementCompleted());
        assertEquals(level1, userA.getCurrentLevel());
        assertEquals(level1, attempt.getLevelAtAttempt());
    }

    // TEST 2: selectedLevel = Dưới 500 (Level 1), score = 24/30 -> PASS -> currentLevel = Dưới 500, placementCompleted = true
    @Test
    void test2_SelectedLowestLevel_Passed_AssignsLowestLevelAndCompletesPlacement() {
        placementQuiz.setLevel(level1);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(1002L);
        attempt.setPublicId("att-u500-pass");
        attempt.setUser(userA);
        attempt.setQuiz(placementQuiz);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setTotalQuestions(30);
        attempt.setCorrectAnswers(24);
        attempt.setScorePercent(new BigDecimal("80.00"));
        attempt.setPassed(true);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-u500-pass")).thenReturn(Optional.of(attempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        com.lela.users.dto.PlacementTestResult result = onboardingService.processPlacementResult("att-u500-pass");

        assertTrue(result.getPassed());
        assertTrue(result.getIsLowestLevel());
        assertTrue(result.getPlacementCompleted());
        assertEquals(level1, userA.getCurrentLevel());
    }

    // TEST 3: selectedLevel = 500-700 (Level 2), FAIL -> currentLevel != Level 2, offers fallback to Level 1
    @Test
    void test3_SelectedLevel2_Failed_DoesNotAssignLevel2() {
        placementQuiz.setLevel(level2);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(1003L);
        attempt.setPublicId("att-500-700-fail");
        attempt.setUser(userA);
        attempt.setQuiz(placementQuiz);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setTotalQuestions(30);
        attempt.setCorrectAnswers(15);
        attempt.setScorePercent(new BigDecimal("50.00"));
        attempt.setPassed(false);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-500-700-fail")).thenReturn(Optional.of(attempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2));

        com.lela.users.dto.PlacementTestResult result = onboardingService.processPlacementResult("att-500-700-fail");

        assertFalse(result.getPassed());
        assertFalse(result.getIsLowestLevel());
        assertFalse(result.getPlacementCompleted());
        assertNull(userA.getCurrentLevel());
        assertFalse(result.getLowerLevels().isEmpty());
    }

    // TEST 4: selectedLevel = 500-700 (Level 2), PASS -> currentLevel = Level 2
    @Test
    void test4_SelectedLevel2_Passed_AssignsLevel2() {
        placementQuiz.setLevel(level2);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(1004L);
        attempt.setPublicId("att-500-700-pass");
        attempt.setUser(userA);
        attempt.setQuiz(placementQuiz);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setTotalQuestions(30);
        attempt.setCorrectAnswers(26);
        attempt.setScorePercent(new BigDecimal("86.67"));
        attempt.setPassed(true);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-500-700-pass")).thenReturn(Optional.of(attempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        com.lela.users.dto.PlacementTestResult result = onboardingService.processPlacementResult("att-500-700-pass");

        assertTrue(result.getPassed());
        assertTrue(result.getPlacementCompleted());
        assertEquals(level2, userA.getCurrentLevel());
    }

    // TEST 5 & TEST 6: selectedLevel = 700-850 (Level 3) PASS -> assigns Level 3; FAIL -> does not assign Level 3
    @Test
    void test5_6_SelectedLevel3_PassAndFailCases() {
        ProficiencyLevel level3 = new ProficiencyLevel();
        level3.setId(30L);
        level3.setName("Khá - Giỏi");
        level3.setDisplayOrder(3);
        level3.setExamType(toeicExamType);

        placementQuiz.setLevel(level3);

        // FAIL case
        QuizAttempt failAttempt = new QuizAttempt();
        failAttempt.setId(1005L);
        failAttempt.setPublicId("att-700-850-fail");
        failAttempt.setUser(userA);
        failAttempt.setQuiz(placementQuiz);
        failAttempt.setStatus(QuizAttemptStatus.SUBMITTED);
        failAttempt.setTotalQuestions(30);
        failAttempt.setCorrectAnswers(18);
        failAttempt.setScorePercent(new BigDecimal("60.00"));
        failAttempt.setPassed(false);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-700-850-fail")).thenReturn(Optional.of(failAttempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2, level3));

        com.lela.users.dto.PlacementTestResult failResult = onboardingService.processPlacementResult("att-700-850-fail");
        assertFalse(failResult.getPassed());
        assertFalse(failResult.getPlacementCompleted());
        assertNull(userA.getCurrentLevel());
        assertEquals(2, failResult.getLowerLevels().size()); // Level 1 and Level 2 available

        // PASS case
        QuizAttempt passAttempt = new QuizAttempt();
        passAttempt.setId(1006L);
        passAttempt.setPublicId("att-700-850-pass");
        passAttempt.setUser(userA);
        passAttempt.setQuiz(placementQuiz);
        passAttempt.setStatus(QuizAttemptStatus.SUBMITTED);
        passAttempt.setTotalQuestions(30);
        passAttempt.setCorrectAnswers(28);
        passAttempt.setScorePercent(new BigDecimal("93.33"));
        passAttempt.setPassed(true);

        when(quizAttemptRepository.findByPublicId("att-700-850-pass")).thenReturn(Optional.of(passAttempt));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        com.lela.users.dto.PlacementTestResult passResult = onboardingService.processPlacementResult("att-700-850-pass");
        assertTrue(passResult.getPassed());
        assertTrue(passResult.getPlacementCompleted());
        assertEquals(level3, userA.getCurrentLevel());
    }

    // TEST 7 & TEST 8: selectedLevel = 850-990 (Level 4) PASS -> assigns Level 4; FAIL -> does not assign Level 4
    @Test
    void test7_8_SelectedLevel4_PassAndFailCases() {
        ProficiencyLevel level4 = new ProficiencyLevel();
        level4.setId(40L);
        level4.setName("Xuất sắc");
        level4.setDisplayOrder(4);
        level4.setExamType(toeicExamType);

        placementQuiz.setLevel(level4);

        // FAIL case
        QuizAttempt failAttempt = new QuizAttempt();
        failAttempt.setId(1007L);
        failAttempt.setPublicId("att-850-990-fail");
        failAttempt.setUser(userA);
        failAttempt.setQuiz(placementQuiz);
        failAttempt.setStatus(QuizAttemptStatus.SUBMITTED);
        failAttempt.setTotalQuestions(30);
        failAttempt.setCorrectAnswers(20);
        failAttempt.setScorePercent(new BigDecimal("66.67"));
        failAttempt.setPassed(false);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-850-990-fail")).thenReturn(Optional.of(failAttempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2, level4));

        com.lela.users.dto.PlacementTestResult failResult = onboardingService.processPlacementResult("att-850-990-fail");
        assertFalse(failResult.getPassed());
        assertFalse(failResult.getPlacementCompleted());

        // PASS case
        QuizAttempt passAttempt = new QuizAttempt();
        passAttempt.setId(1008L);
        passAttempt.setPublicId("att-850-990-pass");
        passAttempt.setUser(userA);
        passAttempt.setQuiz(placementQuiz);
        passAttempt.setStatus(QuizAttemptStatus.SUBMITTED);
        passAttempt.setTotalQuestions(30);
        passAttempt.setCorrectAnswers(29);
        passAttempt.setScorePercent(new BigDecimal("96.67"));
        passAttempt.setPassed(true);

        when(quizAttemptRepository.findByPublicId("att-850-990-pass")).thenReturn(Optional.of(passAttempt));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        com.lela.users.dto.PlacementTestResult passResult = onboardingService.processPlacementResult("att-850-990-pass");
        assertTrue(passResult.getPassed());
        assertTrue(passResult.getPlacementCompleted());
        assertEquals(level4, userA.getCurrentLevel());
    }

    // EDGE CASE: User already Level 1, takes Level 1 test and fails -> remains Level 1
    @Test
    void test9_EdgeCase_UserAlreadyLevel1_FailsLevel1_RemainsLevel1() {
        userA.setCurrentLevel(level1);
        placementQuiz.setLevel(level1);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(1009L);
        attempt.setPublicId("att-u500-repeat-fail");
        attempt.setUser(userA);
        attempt.setQuiz(placementQuiz);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setTotalQuestions(30);
        attempt.setCorrectAnswers(10);
        attempt.setScorePercent(new BigDecimal("33.33"));
        attempt.setPassed(false);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(quizAttemptRepository.findByPublicId("att-u500-repeat-fail")).thenReturn(Optional.of(attempt));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        com.lela.users.dto.PlacementTestResult result = onboardingService.processPlacementResult("att-u500-repeat-fail");

        assertFalse(result.getPassed());
        assertTrue(result.getIsLowestLevel());
        assertTrue(result.getPlacementCompleted());
        assertEquals(level1, userA.getCurrentLevel());
    }

    // TEST 10: Manual level downgrade from Level 2 to Level 1
    @Test
    void test10_ManualSelectLevel_DowngradeLevel2ToLevel1_Allowed() {
        userA.setCurrentLevel(level2);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(examTypeRepository.findById(1L)).thenReturn(Optional.of(toeicExamType));
        when(levelRepository.findById(10L)).thenReturn(Optional.of(level1));
        when(levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(level1, level2));
        when(usersRepository.save(any(Users.class))).thenAnswer(i -> i.getArgument(0));

        onboardingService.manualSelectLevel(1L, 10L);

        assertEquals(level1, userA.getCurrentLevel());
    }
}
