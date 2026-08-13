package com.lela.Quiz;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.Quiz.dto.QuizRequest;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.QuizQuestion.domain.QuestionType;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.common.ExamTypeRepository;
import com.lela.common.ProficiencyLevelRepository;
import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
import com.lela.deck.DeckRepository;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuizUpdateMergeServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ExamTypeRepository examTypeRepository;

    @Mock
    private ProficiencyLevelRepository proficiencyLevelRepository;

    @Mock
    private com.lela.QuizAttempt.QuizAttemptRepository quizAttemptRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizServiceImpl service;

    private Quiz existingQuiz;
    private QuizQuestion existingQuestion;
    private QuizQuestionOption optionA;
    private QuizQuestionOption optionB;
    private Users currentUser;
    private ExamType toeic;
    private ProficiencyLevel level2;

    @BeforeEach
    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("admin");
        Mockito.lenient().when(authentication.isAuthenticated()).thenReturn(true);
        Mockito.lenient().when(authentication.getPrincipal()).thenReturn("admin");
        SecurityContextHolder.setContext(securityContext);

        currentUser = new Users();
        currentUser.setId(2L);
        currentUser.setUsername("admin");
        Mockito.lenient().when(usersRepository.findByUsername("admin")).thenReturn(Optional.of(currentUser));
        Mockito.lenient().when(usersRepository.findById(2L)).thenReturn(Optional.of(currentUser));

        toeic = new ExamType();
        toeic.setId(1L);
        toeic.setCode("TOEIC");

        level2 = new ProficiencyLevel();
        level2.setId(2L);
        level2.setExamType(toeic);

        Mockito.lenient().when(examTypeRepository.findByCode("TOEIC")).thenReturn(Optional.of(toeic));
        Mockito.lenient().when(examTypeRepository.findById(1L)).thenReturn(Optional.of(toeic));
        Mockito.lenient().when(proficiencyLevelRepository.findById(2L)).thenReturn(Optional.of(level2));

        existingQuiz = new Quiz();
        existingQuiz.setId(3L);
        existingQuiz.setQuizCode("Q-EN-ANIMALS-01");
        existingQuiz.setQuizCategory(QuizCategory.NORMAL);
        existingQuiz.setTitle("Animals");
        existingQuiz.setPassScore(new BigDecimal("80"));
        existingQuiz.setMaxAttempts(3);
        existingQuiz.setShuffleQuestions(true);
        existingQuiz.setShuffleOptions(true);
        existingQuiz.setIsActive(true);

        existingQuestion = new QuizQuestion();
        existingQuestion.setId(10L);
        existingQuestion.setQuestionText("Question");
        existingQuestion.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        existingQuestion.setDisplayOrder(1);
        existingQuestion.setPoints(10);
        existingQuestion.setIsActive(true);
        existingQuestion.setQuiz(existingQuiz);

        optionA = new QuizQuestionOption();
        optionA.setId(5L);
        optionA.setOptionKey("A");
        optionA.setOptionText("Dog");
        optionA.setDisplayOrder(1);
        optionA.setIsCorrect(true);
        optionA.setQuestion(existingQuestion);

        optionB = new QuizQuestionOption();
        optionB.setId(6L);
        optionB.setOptionKey("B");
        optionB.setOptionText("Cat");
        optionB.setDisplayOrder(2);
        optionB.setIsCorrect(false);
        optionB.setQuestion(existingQuestion);

        existingQuestion.getOptions().add(optionA);
        existingQuestion.getOptions().add(optionB);
        existingQuiz.getQuestions().add(existingQuestion);

        Mockito.lenient().when(quizRepository.findById(3L)).thenReturn(Optional.of(existingQuiz));
        Mockito.lenient().when(quizRepository.saveAndFlush(any(Quiz.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QuizResponse response = new QuizResponse();
        response.setId(3L);
        Mockito.lenient().when(mapper.map(any(Quiz.class), Mockito.eq(QuizResponse.class))).thenReturn(response);
    }

    @Test
    void update_normalToFinal_preservesExistingOptionIds() {
        QuizRequest request = buildBaseRequest(QuizCategory.FINAL, 1L, 2L);

        QuizResponse response = service.update(3L, request);

        assertNotNull(response);
        assertEquals(QuizCategory.FINAL, existingQuiz.getQuizCategory());
        assertEquals(2L, existingQuiz.getLevel().getId());
        assertEquals(5L, existingQuestion.getOptions().get(0).getId());
        assertEquals(6L, existingQuestion.getOptions().get(1).getId());
    }

    @Test
    void update_finalToNormal_allowsNullLevel() {
        existingQuiz.setQuizCategory(QuizCategory.FINAL);
        existingQuiz.setExamType(toeic);
        existingQuiz.setLevel(level2);

        QuizRequest request = buildBaseRequest(QuizCategory.NORMAL, 1L, null);

        service.update(3L, request);

        assertEquals(QuizCategory.NORMAL, existingQuiz.getQuizCategory());
        assertNull(existingQuiz.getLevel());
    }

    @Test
    void update_existingOptionText_keepsSameOptionEntityAndId() {
        QuizRequest request = buildBaseRequest(QuizCategory.NORMAL, 1L, null);
        request.getQuestions().get(0).getOptions().get(0).setOptionText("Wolf");

        service.update(3L, request);

        assertSame(optionA, existingQuestion.getOptions().get(0));
        assertEquals(5L, existingQuestion.getOptions().get(0).getId());
        assertEquals("Wolf", existingQuestion.getOptions().get(0).getOptionText());
    }

    @Test
    void update_addOption_createsNewOptionWithoutChangingOldIds() {
        QuizRequest request = buildBaseRequest(QuizCategory.NORMAL, 1L, null);
        QuizQuestionOptionRequest newOption = new QuizQuestionOptionRequest();
        newOption.setOptionKey("C");
        newOption.setOptionText("Bird");
        newOption.setIsCorrect(false);
        newOption.setDisplayOrder(3);
        request.getQuestions().get(0).getOptions().add(newOption);

        service.update(3L, request);

        assertEquals(3, existingQuestion.getOptions().size());
        assertEquals(5L, existingQuestion.getOptions().get(0).getId());
        assertEquals(6L, existingQuestion.getOptions().get(1).getId());
        assertNull(existingQuestion.getOptions().get(2).getId());
        assertEquals("Bird", existingQuestion.getOptions().get(2).getOptionText());
    }

    @Test
    void update_removeOption_deletesOnlyMissingOption() {
        QuizRequest request = buildBaseRequest(QuizCategory.NORMAL, 1L, null);
        request.getQuestions().get(0).setOptions(List.of(request.getQuestions().get(0).getOptions().get(0)));

        service.update(3L, request);

        assertEquals(1, existingQuestion.getOptions().size());
        assertEquals(5L, existingQuestion.getOptions().get(0).getId());
        assertFalse(existingQuestion.getOptions().stream().anyMatch(opt -> opt.getId() != null && opt.getId().equals(6L)));
    }

    @Test
    void update_normalToLevelUp_setsTargetLevel() {
        QuizRequest request = buildBaseRequest(QuizCategory.LEVEL_UP, 1L, 2L);

        service.update(3L, request);

        assertEquals(QuizCategory.LEVEL_UP, existingQuiz.getQuizCategory());
        assertEquals(2L, existingQuiz.getLevel().getId());
    }

    private QuizRequest buildBaseRequest(QuizCategory category, Long examTypeId, Long levelId) {
        QuizQuestionOptionRequest opt1 = new QuizQuestionOptionRequest();
        opt1.setId(5L);
        opt1.setQuestionId(10L);
        opt1.setOptionKey("A");
        opt1.setOptionText("Dog");
        opt1.setIsCorrect(true);
        opt1.setDisplayOrder(1);

        QuizQuestionOptionRequest opt2 = new QuizQuestionOptionRequest();
        opt2.setId(6L);
        opt2.setQuestionId(10L);
        opt2.setOptionKey("B");
        opt2.setOptionText("Cat");
        opt2.setIsCorrect(false);
        opt2.setDisplayOrder(2);

        QuizQuestionRequest question = new QuizQuestionRequest();
        question.setId(10L);
        question.setQuizId(3L);
        question.setQuestionText("Question");
        question.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        question.setPoints(10);
        question.setDisplayOrder(1);
        question.setIsActive(true);
        question.setOptions(new java.util.ArrayList<>(List.of(opt1, opt2)));

        QuizRequest request = new QuizRequest();
        request.setCreatedById(2L);
        request.setQuizCode("Q-EN-ANIMALS-01");
        request.setTitle("Animals");
        request.setDescription("Updated");
        request.setQuizType(com.lela.Quiz.domain.QuizType.MULTIPLE_CHOICE);
        request.setQuizCategory(category);
        request.setExamTypeId(examTypeId);
        request.setLevelId(levelId);
        request.setPassScore(new BigDecimal("80"));
        request.setMaxAttempts(3);
        request.setShuffleQuestions(true);
        request.setShuffleOptions(true);
        request.setIsActive(true);
        request.setQuestions(new java.util.ArrayList<>(List.of(question)));
        return request;
    }
}
