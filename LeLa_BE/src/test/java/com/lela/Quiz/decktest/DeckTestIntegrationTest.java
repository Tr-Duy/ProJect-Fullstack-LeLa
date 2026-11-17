package com.lela.Quiz.decktest;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.QuizAttemptService;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class DeckTestIntegrationTest {

    @Autowired private DeckTestService deckTestService;
    @Autowired private QuizAttemptService quizAttemptService;
    @Autowired private DeckRepository deckRepository;
    @Autowired private FlashcardRepository flashcardRepository;
    @Autowired private DeckEnrollmentRepository deckEnrollmentRepository;
    @Autowired private CardProgressRepository cardProgressRepository;
    @Autowired private UsersRepository usersRepository;
    @Autowired private TimedQuizEngine timedQuizEngine;
    @Autowired private DeckCardFilter cardFilter;

    private Users learner;
    private Deck deck;

    @BeforeEach
    void setUp() {
        var seed = usersRepository.findByUsername("learner1").orElseThrow();
        learner = new Users();
        org.springframework.beans.BeanUtils.copyProperties(seed, learner, "id", "username", "email", "roleAssignments", "version", "createdAt", "updatedAt");
        learner.setUsername("topic-test-" + UUID.randomUUID());
        learner.setEmail(learner.getUsername() + "@example.invalid");
        learner.setVersion(0L);
        learner.setXpTotal(10L);
        learner.setStreakCurrent(1);
        learner.setStreakLongest(1);
        learner.setLastActivityDate(null);
        learner = usersRepository.saveAndFlush(learner);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(learner.getUsername(), null, List.of())
        );

        // Chọn bộ thẻ TOEIC Contracts (ID 18 hoặc 2004) có 16 thẻ hợp lệ
        deck = deckRepository.findByDeckCode("DECK-TOEIC-U500-L01")
                .or(() -> deckRepository.findAll().stream().filter(d -> d.isActive && d.getTotalCards() != null && d.getTotalCards() >= 8).findFirst())
                .orElseThrow();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("End-to-End: Chưa ghi danh -> khóa -> Ghi danh -> Chưa học đủ -> khóa -> Học đủ -> mở khóa -> Thi -> Nộp bài tăng XP")
    void testFullFlow() {
        // 1. Khi chưa ghi danh
        DeckTestStatusResponse status1 = deckTestService.getDeckTestStatus(deck.getId());
        assertThat(status1.isEnrolled()).isFalse();
        assertThat(status1.isEligible()).isFalse();
        assertThat(status1.getLockReason()).contains("chưa tham gia");

        // Gọi startDeckTest bị từ chối 403
        assertThatThrownBy(() -> deckTestService.startDeckTest(deck.getId()))
                .isInstanceOf(ResponseStatusException.class);

        // 2. Ghi danh bộ thẻ
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setUser(learner);
        enrollment.setDeck(deck);
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment = deckEnrollmentRepository.saveAndFlush(enrollment);

        // Kiểm tra lại: đã ghi danh nhưng 0 thẻ học -> bị khóa
        DeckTestStatusResponse status2 = deckTestService.getDeckTestStatus(deck.getId());
        assertThat(status2.isEnrolled()).isTrue();
        assertThat(status2.isEligible()).isFalse();
        assertThat(status2.getLearnedCards()).isEqualTo(0);
        assertThat(status2.getLockReason()).contains("Cần học thêm");

        // 3. Học đủ số thẻ (>= 50% số thẻ hợp lệ)
        List<Flashcard> validCards = cardFilter.filterValidCards(flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId()));
        assertThat(validCards.size()).isGreaterThanOrEqualTo(8);
        int needed = (int) Math.ceil(validCards.size() * 0.50);

        for (int i = 0; i < needed; i++) {
            CardProgress cp = new CardProgress();
            cp.setUser(learner);
            cp.setCard(validCards.get(i));
            cp.setState(CardProgressState.LEARNING);
            cardProgressRepository.save(cp);
        }
        cardProgressRepository.flush();

        // Kiểm tra lại: đã đủ điều kiện mở khóa!
        DeckTestStatusResponse status3 = deckTestService.getDeckTestStatus(deck.getId());
        assertThat(status3.isEligible()).isTrue();
        assertThat(status3.getLockReason()).isNull();

        // 4. Bắt đầu làm bài thi chủ đề
        TimedQuizEngine.View initialView = deckTestService.startDeckTest(deck.getId());
        assertThat(initialView).isNotNull();
        assertThat(initialView.attemptId()).isNotNull();
        assertThat(initialView.total()).isGreaterThanOrEqualTo(1);

        // 5. Nộp bài
        QuizSubmitRequest submitReq = new QuizSubmitRequest();
        QuizAttemptDetailResponse result = quizAttemptService.submit(initialView.attemptId(), submitReq);
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(QuizAttemptStatus.SUBMITTED);

        // 6. Kiểm tra User XP thực sự tăng trong DB
        Users updatedUser = usersRepository.findById(learner.getId()).orElseThrow();
        assertThat(updatedUser.getXpTotal()).isGreaterThanOrEqualTo(10L);

        // 7. Nộp lại (Idempotency): kết quả trả về như cũ, XP không tăng thêm
        long xpBefore = updatedUser.getXpTotal();
        QuizAttemptDetailResponse reResult = quizAttemptService.submit(initialView.attemptId(), submitReq);
        assertThat(reResult.getId()).isEqualTo(result.getId());
        Users userAfterResubmit = usersRepository.findById(learner.getId()).orElseThrow();
        assertThat(userAfterResubmit.getXpTotal()).isEqualTo(xpBefore);
    }
}
