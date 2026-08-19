package com.lela.finallevelassessment;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.finallevelassessment.dto.FinalLevelAssessmentResponse;
import com.lela.finallevelassessment.service.FinalLevelAssessmentService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class FinalLevelAssessmentApiTest {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private FinalLevelAssessmentService assessmentService;

    @Test
    public void testFinalLevelQuizzesSeeded() {
        List<Quiz> level1Quizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.FINAL_LEVEL, 1L);
        List<Quiz> level2Quizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.FINAL_LEVEL, 2L);
        List<Quiz> level3Quizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.FINAL_LEVEL, 3L);
        List<Quiz> level4Quizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.FINAL_LEVEL, 4L);

        assertEquals(10, level1Quizzes.size(), "Level 1 should have 10 FINAL_LEVEL quizzes");
        assertEquals(10, level2Quizzes.size(), "Level 2 should have 10 FINAL_LEVEL quizzes");
        assertEquals(10, level3Quizzes.size(), "Level 3 should have 10 FINAL_LEVEL quizzes");
        assertEquals(10, level4Quizzes.size(), "Level 4 should have 10 FINAL_LEVEL quizzes");
    }

    @Test
    @WithMockUser(username = "learner1", roles = {"LEARNER"})
    public void testGetOverviewForLearner() {
        FinalLevelAssessmentResponse overview = assessmentService.getAssessmentOverview();
        assertNotNull(overview);
        assertNotNull(overview.getCurrentLevelName());
        assertNotNull(overview.getQuizzes());
        assertTrue(overview.getQuizzes().size() <= 10);
    }
}
