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

    // TEST 7 & TEST 8: User already completed PLACEMENT -> cannot start PLACEMENT 2nd time
    @Test
    void test7_8_CompletedPlacement_BlocksSecondAttempt() {
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(5000L)).thenReturn(Optional.of(placementQuiz));

        when(quizAttemptRepository.existsByUserIdAndQuizQuizCategoryAndStatusIn(
                100L, QuizCategory.PLACEMENT, List.of(QuizAttemptStatus.SUBMITTED)))
                .thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            quizAttemptService.startAttempt(5000L);
        });

        assertEquals("Placement Test chỉ được thực hiện một lần.", ex.getMessage());
    }

    // TEST 7 & TEST 8 (variant): User already HAS a level -> cannot start PLACEMENT
    @Test
    void test7_8_UserWithLevel_BlocksPlacementAttempt() {
        userA.setCurrentLevel(level1);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(5000L)).thenReturn(Optional.of(placementQuiz));

        when(quizAttemptRepository.existsByUserIdAndQuizQuizCategoryAndStatusIn(
                100L, QuizCategory.PLACEMENT, List.of(QuizAttemptStatus.SUBMITTED)))
                .thenReturn(false);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            quizAttemptService.startAttempt(5000L);
        });

        assertEquals("Placement Test chỉ được thực hiện một lần.", ex.getMessage());
    }

    // TEST 9: User A completed Placement -> User B can still attempt Placement if User B hasn't done it
    @Test
    void test9_UserACompletedPlacement_UserBNotBlocked() {
        // User A check -> blocked
        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(usersRepository.findById(100L)).thenReturn(Optional.of(userA));
        when(quizRepository.findById(5000L)).thenReturn(Optional.of(placementQuiz));
        when(quizAttemptRepository.existsByUserIdAndQuizQuizCategoryAndStatusIn(
                100L, QuizCategory.PLACEMENT, List.of(QuizAttemptStatus.SUBMITTED)))
                .thenReturn(true);

        assertThrows(IllegalStateException.class, () -> {
            quizAttemptService.startAttempt(5000L);
        });

        // User B check -> allowed
        mockAuthentication("userB");
        when(usersRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(usersRepository.findById(200L)).thenReturn(Optional.of(userB));
        when(quizAttemptRepository.existsByUserIdAndQuizQuizCategoryAndStatusIn(
                200L, QuizCategory.PLACEMENT, List.of(QuizAttemptStatus.SUBMITTED)))
                .thenReturn(false);
        when(quizAttemptRepository.findMaxAttemptNumber(200L, 5000L)).thenReturn(0);
        when(quizAttemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mapper.map(any(), eq(com.lela.QuizAttempt.dto.QuizAttemptDetailResponse.class)))
                .thenReturn(new com.lela.QuizAttempt.dto.QuizAttemptDetailResponse());

        assertDoesNotThrow(() -> {
            quizAttemptService.startAttempt(5000L);
        });
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
