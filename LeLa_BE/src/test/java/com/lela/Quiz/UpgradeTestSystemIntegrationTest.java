package com.lela.Quiz;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.QuizAttemptService;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttempt.dto.QuizAnswerSubmitRequest;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class UpgradeTestSystemIntegrationTest {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptService quizAttemptService;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private com.lela.common.ProficiencyLevelRepository levelRepository;

    private void authenticateUser(String username) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        Users learner1 = usersRepository.findByUsername("learner1").orElse(null);
        if (learner1 != null) {
            com.lela.common.domain.ProficiencyLevel level1 = levelRepository.findById(1L).orElse(null);
            if (level1 != null) {
                learner1.setCurrentLevel(level1);
                usersRepository.saveAndFlush(learner1);
            }
            var attempts = quizAttemptRepository.findAllByUserIdWithQuiz(learner1.getId());
            quizAttemptRepository.deleteAll(attempts);
            quizAttemptRepository.flush();
        }
    }





    @Test
    @DisplayName("1. Learner gets 10 Upgrade Tests: ONLY Test #01 is AVAILABLE, #02..#10 are LOCKED")
    void testLearnerGetsTenUpgradeTestsSequential() {
        authenticateUser("learner1");
        Page<QuizResponse> page = quizService.findAll(PageRequest.of(0, 50), QuizCategory.LEVEL_UP, null, null);
        
        List<QuizResponse> quizzes = page.getContent();
        assertThat(quizzes).hasSize(10);
        
        // Test #01 must be AVAILABLE
        assertThat(quizzes.get(0).getAttemptStatus()).isEqualTo("AVAILABLE");
        assertThat(quizzes.get(0).getIsLocked()).isFalse();

        // Tests #02..#10 must be LOCKED
        for (int i = 1; i < 10; i++) {
            assertThat(quizzes.get(i).getAttemptStatus()).isEqualTo("LOCKED");
            assertThat(quizzes.get(i).getIsLocked()).isTrue();
        }

        // Verify starting Test #02 directly when #01 is unattempted triggers Exception
        Quiz test2 = quizRepository.findByQuizCode("UPGRADE-U500-02").orElseThrow();
        assertThatThrownBy(() -> quizAttemptService.startAttempt(test2.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bạn phải làm bài thi theo đúng thứ tự chuỗi 10 bài");

        // Also verify searchQuizzes API maintains EXACT same invariant
        List<QuizResponse> searchResults = quizService.searchQuizzes(QuizCategory.LEVEL_UP, null, null);
        long availableCount = searchResults.stream().filter(q -> "AVAILABLE".equals(q.getAttemptStatus())).count();
        assertThat(availableCount).isEqualTo(1);
        assertThat(searchResults.get(0).getAttemptStatus()).isEqualTo("AVAILABLE");
    }

    @Test
    @DisplayName("2. FAIL attempt on #01 locks #01 as COMPLETED_FAILED and locks #02 under 24h WAITING_24H cooldown")
    void testFailLocksEntireChainFor24h() {
        authenticateUser("learner1");
        Quiz test1 = quizRepository.findByQuizCode("UPGRADE-U500-01").orElseThrow();
        Quiz test2 = quizRepository.findByQuizCode("UPGRADE-U500-02").orElseThrow();

        // Start and submit FAIL attempt on Test #01 (0 correct answers)
        QuizAttemptDetailResponse started = quizAttemptService.startAttempt(test1.getId());
        QuizSubmitRequest submitReq = new QuizSubmitRequest();
        submitReq.setAnswers(new ArrayList<>());

        QuizAttemptDetailResponse result = quizAttemptService.submit(started.getId(), submitReq);
        assertThat(result.getPassed()).isFalse();

        // Check updated status list
        Page<QuizResponse> page = quizService.findAll(PageRequest.of(0, 50), QuizCategory.LEVEL_UP, null, null);
        List<QuizResponse> quizzes = page.getContent();
        
        assertThat(quizzes.get(0).getAttemptStatus()).isEqualTo("COMPLETED_FAILED");
        assertThat(quizzes.get(0).getIsLocked()).isTrue();

        assertThat(quizzes.get(1).getAttemptStatus()).isEqualTo("WAITING_24H");
        assertThat(quizzes.get(1).getIsLocked()).isTrue();

        // Verify starting Test #02 triggers 24h cooldown Exception
        assertThatThrownBy(() -> quizAttemptService.startAttempt(test2.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Chuỗi bài thi đang trong thời gian chờ 24 giờ");
    }

    @Autowired
    private com.lela.QuizAttemptOption.QuizAttemptOptionRepository quizAttemptOptionRepository;

    @Test
    @DisplayName("3. PASS attempt (>= 80%) instantly upgrades user's currentLevel in DB transaction")
    void testPassInstantlyUpgradesLevel() {
        authenticateUser("learner1");
        Users learner1 = usersRepository.findByUsername("learner1").orElseThrow();
        assertThat(learner1.getCurrentLevel().getCode()).isEqualTo("TOEIC_BASIC"); // Level 1 (Dưới 500)

        Quiz test1 = quizRepository.findByQuizCode("UPGRADE-U500-01")
                .orElseThrow(() -> new AssertionError("UPGRADE-U500-01 not found"));

        QuizAttemptDetailResponse started = quizAttemptService.startAttempt(test1.getId());
        
        List<Long> qIds = started.getQuestions().stream().map(q -> q.getId()).collect(java.util.stream.Collectors.toList());
        var dbAttemptOpts = quizAttemptOptionRepository.findByAttemptQuestionIdIn(qIds);
        var correctOptsByQId = dbAttemptOpts.stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .collect(java.util.stream.Collectors.groupingBy(o -> o.getAttemptQuestion().getId()));

        // Submit 25 correct answers out of 30 (25/30 = 83.33% >= 80% -> PASS)
        List<QuizAnswerSubmitRequest> answers = new ArrayList<>();
        for (com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse q : started.getQuestions()) {
            if (answers.size() < 25) {
                var correctOpts = correctOptsByQId.get(q.getId());
                Long selectedOptId = (correctOpts != null && !correctOpts.isEmpty())
                        ? correctOpts.get(0).getId()
                        : (q.getOptions() != null && !q.getOptions().isEmpty() ? q.getOptions().get(0).getId() : null);

                QuizAnswerSubmitRequest ansReq = new QuizAnswerSubmitRequest();
                ansReq.setAttemptQuestionId(q.getId());
                ansReq.setSelectedAttemptOptionId(selectedOptId);
                if (q.getQuestionType() == com.lela.QuizQuestion.domain.QuestionType.FILL_BLANK && correctOpts != null && !correctOpts.isEmpty()) {
                    ansReq.setAnswerText(correctOpts.get(0).getOptionText());
                }
                answers.add(ansReq);
            }
        }

        QuizSubmitRequest submitReq = new QuizSubmitRequest();
        submitReq.setAnswers(answers);

        QuizAttemptDetailResponse result = quizAttemptService.submit(started.getId(), submitReq);
        assertThat(result.getPassed()).isTrue();

        // Verify user level upgraded in DB to Level 2 (TOEIC_INTERMEDIATE - 500-650)
        Users updatedLearner1 = usersRepository.findByUsername("learner1").orElseThrow();
        assertThat(updatedLearner1.getCurrentLevel().getCode()).isEqualTo("TOEIC_INTERMEDIATE");
    }
}
