package com.lela.finallevelassessment.service;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import com.lela.common.exception.NotFoundExeception;
import com.lela.finallevelassessment.dto.FinalLevelAssessmentResponse;
import com.lela.finallevelassessment.dto.FinalLevelAssessmentResponse.DeckEligibilityItem;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FinalLevelAssessmentServiceImpl implements FinalLevelAssessmentService {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private DeckEnrollmentRepository deckEnrollmentRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private ModelMapper modelMapper;

    private Users getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("Vui lòng đăng nhập để truy cập bài kiểm tra kết thúc mức độ.");
        }
        return usersRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new NotFoundExeception("User not found: " + auth.getName()));
    }

    @Override
    public FinalLevelAssessmentResponse getAssessmentOverview() {
        Users user = getCurrentUser();
        if (user.getCurrentLevel() == null) {
            return FinalLevelAssessmentResponse.builder()
                    .isEligible(false)
                    .lockMessage("Bạn chưa chọn hoặc thiết lập trình độ học.")
                    .quizzes(List.of())
                    .decks(List.of())
                    .build();
        }

        Long levelId = user.getCurrentLevel().getId();
        String levelName = user.getCurrentLevel().getName();

        // 1. Deck completion check
        List<Deck> activeDecks = deckRepository.findAll().stream()
                .filter(d -> d.isActive && d.getLevel() != null && Objects.equals(d.getLevel().getId(), levelId))
                .sorted(Comparator.comparing(d -> d.getDeckCode() != null ? d.getDeckCode() : ""))
                .toList();

        List<DeckEnrollment> userEnrollments = deckEnrollmentRepository.findByUserId(user.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
        Map<Long, DeckEnrollment> enrollmentMap = userEnrollments.stream()
                .filter(e -> e.getDeck() != null)
                .collect(Collectors.toMap(e -> e.getDeck().getId(), e -> e, (a, b) -> a));

        List<DeckEligibilityItem> deckItems = new ArrayList<>();
        int completedCount = 0;

        for (Deck d : activeDecks) {
            DeckEnrollment en = enrollmentMap.get(d.getId());
            boolean isComp = false;
            int mastered = 0;
            if (en != null) {
                mastered = en.getMasteredCards() != null ? en.getMasteredCards() : 0;
                if (en.getCompletedAt() != null || en.getStatus() == DeckEnrollmentStatus.COMPLETED
                        || (d.getTotalCards() != null && d.getTotalCards() > 0 && mastered >= d.getTotalCards())) {
                    isComp = true;
                }
            }
            if (isComp) completedCount++;

            deckItems.add(DeckEligibilityItem.builder()
                    .id(d.getId())
                    .deckCode(d.getDeckCode())
                    .title(d.getTitle())
                    .totalCards(d.getTotalCards())
                    .masteredCards(mastered)
                    .isCompleted(isComp)
                    .build());
        }

        int requiredDecks = activeDecks.isEmpty() ? 0 : Math.min(15, activeDecks.size());
        boolean isEligible = activeDecks.isEmpty() || completedCount >= requiredDecks;

        // 2. Quiz and attempt status check
        List<Quiz> finalQuizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.FINAL_LEVEL, levelId)
                .stream()
                .sorted(Comparator.comparing(q -> q.getQuizCode() != null ? q.getQuizCode() : ""))
                .toList();

        List<QuizAttempt> allUserAttempts = quizAttemptRepository.findByUserId(user.getId(), org.springframework.data.domain.Pageable.unpaged())
                .getContent()
                .stream()
                .filter(a -> a.getQuiz() != null && a.getQuiz().getQuizCategory() == QuizCategory.FINAL_LEVEL
                        && a.getQuiz().getLevel() != null && Objects.equals(a.getQuiz().getLevel().getId(), levelId))
                .toList();

        int maxCycle = allUserAttempts.stream()
                .map(QuizAttempt::getCycleNumber)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(1);

        List<QuizAttempt> currentCycleAttempts = allUserAttempts.stream()
                .filter(a -> Objects.equals(a.getCycleNumber(), maxCycle))
                .toList();

        // 12h Global Cooldown Check
        Optional<QuizAttempt> latestFailedAttempt = currentCycleAttempts.stream()
                .filter(a -> Boolean.FALSE.equals(a.getPassed()) && a.getSubmittedAt() != null)
                .max(Comparator.comparing(QuizAttempt::getSubmittedAt));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cooldownUntil = null;
        Long cooldownRemainingSeconds = 0L;
        boolean globalCooldownActive = false;

        if (latestFailedAttempt.isPresent()) {
            LocalDateTime failedTime = latestFailedAttempt.get().getSubmittedAt();
            LocalDateTime until = failedTime.plusHours(12);
            if (now.isBefore(until)) {
                globalCooldownActive = true;
                cooldownUntil = until;
                cooldownRemainingSeconds = Duration.between(now, until).getSeconds();
            }
        }

        boolean anyPassed = currentCycleAttempts.stream().anyMatch(a -> Boolean.TRUE.equals(a.getPassed()));
        long failedQuizCount = currentCycleAttempts.stream()
                .filter(a -> Boolean.FALSE.equals(a.getPassed()) && a.getSubmittedAt() != null)
                .map(a -> a.getQuiz().getId())
                .distinct()
                .count();

        String cycleStatus = "IN_PROGRESS";
        if (anyPassed) {
            cycleStatus = "PASSED";
        } else if (failedQuizCount >= finalQuizzes.size() && finalQuizzes.size() > 0) {
            cycleStatus = "REQUIRES_REVIEW";
        }

        Map<Long, QuizAttempt> latestAttemptByQuizId = currentCycleAttempts.stream()
                .filter(a -> a.getQuiz() != null)
                .collect(Collectors.toMap(
                        a -> a.getQuiz().getId(),
                        a -> a,
                        (a1, a2) -> a1.getStartedAt() != null && a2.getStartedAt() != null && a1.getStartedAt().isAfter(a2.getStartedAt()) ? a1 : a2
                ));

        List<QuizResponse> quizResponses = new ArrayList<>();

        for (Quiz q : finalQuizzes) {
            QuizResponse res = modelMapper.map(q, QuizResponse.class);
            QuizAttempt attempt = latestAttemptByQuizId.get(q.getId());

            if (anyPassed) {
                if (attempt != null && Boolean.TRUE.equals(attempt.getPassed())) {
                    res.setAttemptStatus("COMPLETED_PASSED");
                    res.setIsLocked(false);
                } else {
                    res.setAttemptStatus("NOT_REQUIRED");
                    res.setIsLocked(true);
                    res.setLockReason("Bạn đã đạt bài thi ở trình độ này.");
                }
            } else if (attempt != null && attempt.getSubmittedAt() != null) {
                if (Boolean.TRUE.equals(attempt.getPassed())) {
                    res.setAttemptStatus("COMPLETED_PASSED");
                    res.setIsLocked(false);
                } else {
                    res.setAttemptStatus("COMPLETED_FAILED");
                    res.setIsLocked(true);
                    res.setLockReason("Đã làm bài trong chu kỳ này và chưa đạt. Không thể làm lại.");
                }
            } else if (globalCooldownActive) {
                long hours = cooldownRemainingSeconds / 3600;
                long mins = (cooldownRemainingSeconds % 3600) / 60;
                String timeStr = hours > 0 ? hours + " giờ " + mins + " phút" : mins + " phút";
                res.setAttemptStatus("GLOBAL_COOLDOWN");
                res.setIsLocked(true);
                res.setLockReason("Tất cả bài đang tạm khóa 12h sau bài làm chưa đạt. Còn lại " + timeStr + ".");
            } else if (!isEligible) {
                res.setAttemptStatus("LOCKED");
                res.setIsLocked(true);
                res.setLockReason("Bạn chưa hoàn thành đủ 15 bộ thẻ của Level hiện tại (Hiện tại: " + completedCount + "/" + requiredDecks + " bộ thẻ).");
            } else {
                res.setAttemptStatus("AVAILABLE");
                res.setIsLocked(false);
            }

            quizResponses.add(res);
        }

        return FinalLevelAssessmentResponse.builder()
                .isEligible(isEligible)
                .currentLevelId(levelId)
                .currentLevelName(levelName)
                .totalDecks(activeDecks.size())
                .completedDecks(completedCount)
                .cycleNumber(maxCycle)
                .cycleStatus(cycleStatus)
                .cooldownUntil(cooldownUntil)
                .cooldownRemainingSeconds(cooldownRemainingSeconds)
                .lockMessage(!isEligible ? "Bạn chưa đủ điều kiện thi. Cần hoàn thành ít nhất " + requiredDecks + " bộ thẻ của Level hiện tại (Hiện tại: " + completedCount + "/" + requiredDecks + ")." : null)
                .quizzes(quizResponses)
                .decks(deckItems)
                .build();
    }

    @Transactional
    @Override
    public FinalLevelAssessmentResponse resetCycle() {
        Users user = getCurrentUser();
        if (user.getCurrentLevel() == null) {
            throw new IllegalStateException("Bạn chưa chọn trình độ.");
        }

        Long levelId = user.getCurrentLevel().getId();
        List<QuizAttempt> allUserAttempts = quizAttemptRepository.findByUserId(user.getId(), org.springframework.data.domain.Pageable.unpaged())
                .getContent()
                .stream()
                .filter(a -> a.getQuiz() != null && a.getQuiz().getQuizCategory() == QuizCategory.FINAL_LEVEL
                        && a.getQuiz().getLevel() != null && Objects.equals(a.getQuiz().getLevel().getId(), levelId))
                .toList();

        int maxCycle = allUserAttempts.stream()
                .map(QuizAttempt::getCycleNumber)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(1);

        // Advance to new cycle
        int newCycle = maxCycle + 1;
        // The getAssessmentOverview will use maxCycle = newCycle for future attempts!
        return getAssessmentOverview();
    }

    @Transactional
    @Override
    public FinalLevelAssessmentResponse simulateCompleteDeck(Long deckId) {
        Users user = getCurrentUser();
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new NotFoundExeception("Deck not found: " + deckId));

        DeckEnrollment enrollment = deckEnrollmentRepository.findByUserIdAndDeckId(user.getId(), deckId)
                .orElseGet(() -> {
                    DeckEnrollment newEn = new DeckEnrollment();
                    newEn.setUser(user);
                    newEn.setDeck(deck);
                    newEn.setEnrolledAt(LocalDateTime.now());
                    return newEn;
                });

        enrollment.setStatus(DeckEnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(LocalDateTime.now());
        enrollment.setMasteredCards(deck.getTotalCards() != null ? deck.getTotalCards() : 16);
        deckEnrollmentRepository.save(enrollment);

        return getAssessmentOverview();
    }
}
