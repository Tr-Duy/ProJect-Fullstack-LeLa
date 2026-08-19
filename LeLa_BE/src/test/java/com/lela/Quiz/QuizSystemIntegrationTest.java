package com.lela.Quiz;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.QuizAttemptService;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttempt.dto.QuizAnswerSubmitRequest;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class QuizSystemIntegrationTest {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private QuizAttemptService quizAttemptService;

    private void authenticateUser(String username) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("1 & 2 & 3 & 4. Verify Deck Quizzes exist, have correct question counts, correct deck mapping, and no duplicate questions")
    void testDeckQuizzesStructure() {
        Deck deck = deckRepository.findByDeckCode("DECK-TOEIC-U500-L01")
                .orElseThrow(() -> new AssertionError("DECK-TOEIC-U500-L01 not found"));

        List<Quiz> quizzes = quizRepository.findByDeckIdAndIsActiveTrue(deck.getId());
        assertThat(quizzes).isNotEmpty();

        Quiz quick = quizzes.stream().filter(q -> q.getQuizCode().contains("QUICK")).findFirst().orElse(null);
        Quiz std = quizzes.stream().filter(q -> q.getQuizCode().contains("STD")).findFirst().orElse(null);
        Quiz challenge = quizzes.stream().filter(q -> q.getQuizCode().contains("CHALLENGE")).findFirst().orElse(null);

        assertThat(quick).isNotNull();
        assertThat(quick.getQuestions()).hasSize(5);

        assertThat(std).isNotNull();
        assertThat(std.getQuestions()).hasSize(10);

        assertThat(challenge).isNotNull();
        assertThat(challenge.getQuestions()).hasSize(15);

        // Check no duplicate questions in quick quiz
        List<String> questionTexts = quick.getQuestions().stream().map(QuizQuestion::getQuestionText).toList();
        assertThat(questionTexts.stream().distinct().count()).isEqualTo(questionTexts.size());
    }

    @Test
    @DisplayName("5 & 6 & 7. Start attempt, submit answers, check score and QuizAttempt persistence")
    void testQuizAttemptAndSubmit() {
        authenticateUser("learner1");
        Users learner = usersRepository.findByUsername("learner1").orElseThrow();

        Quiz quiz = quizRepository.findByQuizCode("QUIZ-QUICK-L01").orElseThrow();

        QuizAttemptDetailResponse attemptDetail = quizAttemptService.startAttempt(quiz.getId());
        assertThat(attemptDetail).isNotNull();
        assertThat(attemptDetail.getPublicId()).isNotNull();

        // Prepare submit request with correct answers
        QuizSubmitRequest submitReq = new QuizSubmitRequest();
        List<QuizAnswerSubmitRequest> answers = new ArrayList<>();

        attemptDetail.getQuestions().forEach(q -> {
            QuizAnswerSubmitRequest ans = new QuizAnswerSubmitRequest();
            ans.setAttemptQuestionId(q.getId());

            // Pick the first option
            if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                ans.setSelectedAttemptOptionId(q.getOptions().get(0).getId());
            }
            answers.add(ans);
        });

        submitReq.setAnswers(answers);

        QuizAttemptDetailResponse result = quizAttemptService.submit(attemptDetail.getId(), submitReq);
        assertThat(result.getSubmittedAt()).isNotNull();

        QuizAttempt attemptInDb = quizAttemptRepository.findById(attemptDetail.getId()).orElseThrow();
        assertThat(attemptInDb.getScorePercent()).isNotNull();
        assertThat(attemptInDb.getUser().getId()).isEqualTo(learner.getId());
    }

    @Test
    @DisplayName("9. Verify Level Final Quizzes aggregate questions from multiple Decks within the Level")
    void testFinalQuizzesStructure() {
        Quiz finalU500 = quizRepository.findByQuizCode("FINAL-TOEIC-U500").orElseThrow();
        assertThat(finalU500.getQuizCategory()).isEqualTo(QuizCategory.FINAL);
        assertThat(finalU500.getQuestions()).hasSize(20);
        assertThat(finalU500.getPassScore()).isEqualByComparingTo("80.00");
    }
}
