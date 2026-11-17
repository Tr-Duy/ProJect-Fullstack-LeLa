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
import com.lela.QuizAnswer.domain.QuizAnswer;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizAnswerResponse;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizQuestion.domain.QuestionType;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse;
import com.lela.achievement.AchievementService;
import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.common.exception.NotFoundExeception;
import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.DailyXpBudget;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeckTestServiceImpl implements DeckTestService {

    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final DeckEnrollmentRepository deckEnrollmentRepository;
    private final CardProgressRepository cardProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    private final QuizAttemptOptionRepository quizAttemptOptionRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final UsersRepository usersRepository;
    private final TimedQuizStateRepository timedQuizStateRepository;
    private final VocabularyRepository vocabularyRepository;
    private final TimedQuizEngine timedQuizEngine;
    private final VocabularyQuizRewards vocabularyQuizRewards;
    private final DeckTestProperties properties;
    private final DeckCardFilter cardFilter;
    private final DeckTestQuestionGenerator questionGenerator;
    private final DailyXpBudget dailyXpBudget;
    private final DailyLearningActivityService activityService;
    private final VoiceConfigurationProperties voiceConfig;
    private final AchievementService achievementService;
    private final ModelMapper mapper;
    private final ObjectMapper json;

    private Users getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("Yêu cầu đăng nhập");
        }
        return usersRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy người dùng: " + auth.getName()));
    }

    @Override
    @Transactional(readOnly = true)
    public DeckTestStatusResponse getDeckTestStatus(Long deckId) {
        Users user = getCurrentUser();
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy bộ thẻ: " + deckId));

        return computeStatus(deck, user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeckTestStatusResponse> getMyDeckTestsOverview() {
        Users user = getCurrentUser();
        List<DeckEnrollment> userEnrollments = deckEnrollmentRepository.findByUserId(user.getId(), Pageable.unpaged()).getContent();

        List<DeckTestStatusResponse> results = new ArrayList<>();
        for (DeckEnrollment enrollment : userEnrollments) {
            Deck deck = enrollment.getDeck();
            if (deck != null && deck.isActive && deck.getDeletedAt() == null) {
                results.add(computeStatusWithEnrollment(deck, user, enrollment));
            }
        }
        return results;
    }

    private DeckTestStatusResponse computeStatus(Deck deck, Users user) {
        Optional<DeckEnrollment> enrollmentOpt = deckEnrollmentRepository.findByUserIdAndDeckId(user.getId(), deck.getId());
        return computeStatusWithEnrollment(deck, user, enrollmentOpt.orElse(null));
    }

    private DeckTestStatusResponse computeStatusWithEnrollment(Deck deck, Users user, DeckEnrollment enrollment) {
        List<Flashcard> allCards = flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId());
        List<Flashcard> validCards = cardFilter.filterValidCards(allCards);
        int totalValidCards = validCards.size();
        boolean hasEnoughCards = totalValidCards >= properties.getMinValidCards();

        boolean isEnrolled = enrollment != null && enrollment.getStatus() != DeckEnrollmentStatus.DROPPED;
        int requiredLearned = (int) Math.ceil(totalValidCards * properties.getRequiredLearnedRatio());

        int learnedCards = 0;
        if (isEnrolled && totalValidCards > 0) {
            Set<Long> validCardIds = validCards.stream().map(Flashcard::getId).collect(Collectors.toSet());
            List<CardProgress> userProgress = cardProgressRepository.findAllByUserIdAndDeckId(user.getId(), deck.getId());
            learnedCards = (int) userProgress.stream()
                    .filter(cp -> cp.getCard() != null
                            && validCardIds.contains(cp.getCard().getId())
                            && cp.getState() != CardProgressState.NEW
                            && cp.getState() != CardProgressState.SUSPENDED)
                    .count();
        }

        boolean eligible = false;
        String lockReason = null;

        if (!hasEnoughCards) {
            eligible = false;
            lockReason = "Bộ thẻ này chưa đủ dữ liệu cho bài thi (cần tối thiểu " + properties.getMinValidCards() + " thẻ hợp lệ, hiện có " + totalValidCards + " thẻ).";
        } else if (!isEnrolled) {
            eligible = false;
            lockReason = "Bạn chưa tham gia bộ thẻ này. Vui lòng tham gia bộ thẻ trước khi làm bài thi.";
        } else if (learnedCards < requiredLearned) {
            eligible = false;
            int needed = requiredLearned - learnedCards;
            lockReason = "Cần học thêm " + needed + " thẻ để mở khóa bài thi (đã học " + learnedCards + "/" + requiredLearned + " thẻ).";
        } else {
            eligible = true;
            lockReason = null;
        }

        boolean hasPassed = enrollment != null && Boolean.TRUE.equals(enrollment.getTopicTestPassed());
        BigDecimal bestScore = enrollment != null ? enrollment.getTopicTestBestScore() : null;
        LocalDateTime lastAttemptAt = enrollment != null ? enrollment.getTopicTestLastAttemptAt() : null;

        return DeckTestStatusResponse.builder()
                .deckId(deck.getId())
                .deckCode(deck.getDeckCode())
                .deckTitle(deck.getTitle())
                .deckLevelName(deck.getLevel() != null ? deck.getLevel().getName() : null)
                .enrolled(isEnrolled)
                .hasEnoughCards(hasEnoughCards)
                .totalValidCards(totalValidCards)
                .learnedCards(learnedCards)
                .requiredLearnedCards(requiredLearned)
                .minValidCardsRequired(properties.getMinValidCards())
                .eligible(eligible)
                .lockReason(lockReason)
                .hasPassed(hasPassed)
                .bestScore(bestScore)
                .lastAttemptAt(lastAttemptAt)
                .build();
    }

    @Override
    @Transactional
    public TimedQuizEngine.View startDeckTest(Long deckId) {
        Users user = getCurrentUser();
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy bộ thẻ: " + deckId));

        DeckTestStatusResponse status = computeStatus(deck, user);

        if (!status.isHasEnoughCards()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, status.getLockReason());
        }
        if (!status.isEnrolled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, status.getLockReason());
        }
        if (!status.isEligible()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, status.getLockReason());
        }

        // Lấy thẻ của deck và fallback pool
        List<Flashcard> deckCards = cardFilter.filterValidCards(flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId()));
        Long levelId = deck.getLevel() != null ? deck.getLevel().getId() : null;
        List<Flashcard> fallbackPool = vocabularyRepository.findSystemWords(properties.getSystemOwner(), levelId);

        // Sinh đề bài thi kết hợp
        DeckTestQuestionGenerator.GeneratedExam exam = questionGenerator.generateExam(
                deckCards,
                fallbackPool,
                properties.getMcQuestionCount(),
                properties.getMatchingScreensCount(),
                properties.getMcQuestionSeconds(),
                properties.getMatchingScreenSeconds()
        );

        // Tạo hoặc lấy Quiz cho chủ đề
        String quizCode = "DECK-TEST-" + deck.getId();
        Quiz quiz = quizRepository.findByQuizCode(quizCode).orElseGet(() -> {
            Quiz q = new Quiz();
            q.setQuizCode(quizCode);
            q.setTitle("Bài thi chủ đề: " + deck.getTitle());
            q.setDescription("Bài thi kiểm tra từ vựng chủ đề " + deck.getTitle());
            q.setQuizType(QuizType.MIXED);
            q.setQuizCategory(QuizCategory.DECK_TEST);
            q.setDeck(deck);
            q.setLevel(deck.getLevel());
            q.setExamType(deck.getExamType());
            q.setPassScore(BigDecimal.valueOf(properties.getPassScorePercent()));
            q.setIsActive(true);
            q.setCreatedBy(user);
            return quizRepository.save(q);
        });

        // Tạo QuizAttempt
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setUser(user);
        attempt.setPublicId(UUID.randomUUID().toString());
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setLevelAtAttempt(user.getCurrentLevel());
        attempt.setAttemptNumber(quizAttemptRepository.findMaxAttemptNumber(user.getId(), quiz.getId()) + 1);
        attempt.setTotalQuestions(exam.allScreens().size());
        attempt = quizAttemptRepository.save(attempt);

        // Tạo Session & Screens cho TimedQuizEngine
        TimedQuizEngine.Session session = new TimedQuizEngine.Session();
        session.setPairPoints(properties.getPairPoints());
        session.setErrorPenalty(properties.getErrorPenalty());
        session.setToleranceSeconds(properties.getToleranceSeconds());

        int order = 0;
        for (DeckTestQuestionGenerator.GeneratedScreen genScreen : exam.allScreens()) {
            QuizAttemptQuestion question = new QuizAttemptQuestion();
            question.setAttempt(attempt);
            question.setQuestionType(QuestionType.valueOf(genScreen.type()));
            question.setQuestionText(genScreen.prompt());
            question.setPoints(genScreen.type().equals("MATCHING_PAIRS") ? 4 : 1);
            question.setQuestionTimeLimitSeconds(genScreen.seconds());
            question.setDisplayOrder(order++);
            question = quizAttemptQuestionRepository.save(question);

            TimedQuizEngine.Screen screen = new TimedQuizEngine.Screen();
            screen.setQuestionId(question.getId());
            screen.setType(genScreen.type());
            screen.setPrompt(question.getQuestionText());
            screen.setSeconds(question.getQuestionTimeLimitSeconds());

            if (genScreen.type().equals("MULTIPLE_CHOICE_MEANING")) {
                int optOrder = 0;
                for (TimedQuizEngine.Cell cell : genScreen.left()) {
                    boolean isCorrect = cell.getId().equals(genScreen.solution().get("answer"));
                    QuizAttemptOption option = new QuizAttemptOption();
                    option.setAttemptQuestion(question);
                    option.setOptionText(cell.getText());
                    option.setIsCorrect(isCorrect);
                    option.setDisplayOrder(optOrder++);
                    option = quizAttemptOptionRepository.save(option);

                    String key = option.getId().toString();
                    screen.getLeft().add(new TimedQuizEngine.Cell(key, cell.getText()));
                    if (isCorrect) {
                        screen.getSolution().put("answer", key);
                    }
                }
            } else {
                screen.getLeft().addAll(genScreen.left());
                screen.getRight().addAll(genScreen.right());
                screen.getSolution().putAll(genScreen.solution());
            }

            session.getScreens().add(screen);
        }

        long now = Instant.now().toEpochMilli();
        if (!session.getScreens().isEmpty()) {
            session.getScreens().getFirst().setDeadline(now + session.getScreens().getFirst().getSeconds() * 1000L);
        }

        TimedQuizState state = new TimedQuizState();
        state.setAttemptId(attempt.getId());
        timedQuizEngine.save(state, session);

        return timedQuizEngine.view(attempt, session, null);
    }

    @Override
    @Transactional
    public QuizAttemptDetailResponse submitDeckTest(Long attemptId, QuizSubmitRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy lần làm bài: " + attemptId));

        Users currentUser = getCurrentUser();
        if (!Objects.equals(attempt.getUser().getId(), currentUser.getId())) {
            throw new AccessDeniedException("Bạn không có quyền nộp bài làm này.");
        }

        // Idempotent: Nếu đã nộp trước đó, trả về chi tiết ngay lập tức, không cộng thêm điểm / XP
        if (attempt.getSubmittedAt() != null) {
            return buildDetailResponse(attempt);
        }

        Map<Long, TimedQuizEngine.Earned> timedScores = timedQuizEngine.finalizeForSubmit(attemptId);
        List<QuizAttemptQuestion> questions = quizAttemptQuestionRepository.findByAttemptId(attemptId);

        // Xóa câu trả lời cũ nếu có
        quizAnswerRepository.deleteAll(quizAnswerRepository.findByAttemptId(attemptId));

        int totalScore = 0;
        int maxScore = 0;
        int correctCount = 0;
        int meaningCorrect = 0;
        int pairsCorrect = 0;
        BigDecimal preciseScore = BigDecimal.ZERO;
        BigDecimal preciseMax = BigDecimal.ZERO;

        List<QuizAnswer> answersToSave = new ArrayList<>();

        for (QuizAttemptQuestion question : questions) {
            maxScore += question.getPoints();
            TimedQuizEngine.Earned timed = timedScores.get(question.getId());
            preciseMax = preciseMax.add(timed != null ? timed.maxScore() : BigDecimal.valueOf(question.getPoints()));

            if (timed != null) {
                preciseScore = preciseScore.add(timed.score());
                totalScore += timed.score().intValue();
                if (question.getQuestionType() == QuestionType.MATCHING_PAIRS) {
                    pairsCorrect += timed.correct();
                } else {
                    meaningCorrect += timed.correct();
                }
                if (timed.score().compareTo(timed.maxScore()) == 0) {
                    correctCount++;
                }

                QuizAnswer answer = new QuizAnswer();
                answer.setAttempt(attempt);
                answer.setAttemptQuestion(question);
                answer.setAnsweredAt(LocalDateTime.now());
                answer.setPointsAwarded(timed.score().intValue());
                answer.setIsCorrect(timed.score().compareTo(timed.maxScore()) == 0);
                answersToSave.add(answer);
            }
        }

        if (!answersToSave.isEmpty()) {
            quizAnswerRepository.saveAll(answersToSave);
        }

        if (request != null && request.isAbandoned()) {
            attempt.setAbandonedAt(LocalDateTime.now());
        }
        attempt.setSubmittedAt(LocalDateTime.now());
        if (attempt.getStartedAt() != null) {
            long seconds = Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds();
            attempt.setTimeSpentSeconds((int) seconds);
        }
        attempt.setScorePoints(totalScore);
        attempt.setPreciseScore(preciseScore);
        attempt.setPreciseMaxScore(preciseMax);

        BigDecimal percent = preciseMax.signum() > 0
                ? preciseScore.multiply(BigDecimal.valueOf(100)).divide(preciseMax, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        attempt.setScorePercent(percent);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setCorrectAnswers(correctCount);

        boolean passed = percent.compareTo(BigDecimal.valueOf(properties.getPassScorePercent())) >= 0;
        attempt.setPassed(passed);

        // Quy tắc chống cày XP
        Users user = attempt.getUser();
        Deck deck = attempt.getQuiz() != null ? attempt.getQuiz().getDeck() : null;
        Long deckId = deck != null ? deck.getId() : null;

        LocalDate today = LocalDate.now(ZoneId.of(voiceConfig.getTimezone()));
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        long prevSubmissionsToday = 0;
        if (deckId != null) {
            prevSubmissionsToday = quizAttemptRepository.countSubmittedDeckAttemptsOnDate(user.getId(), deckId, startOfDay, endOfDay, attemptId);
        }

        Optional<DeckEnrollment> enrollmentOpt = deckId != null
                ? deckEnrollmentRepository.findByUserIdAndDeckId(user.getId(), deckId)
                : Optional.empty();

        boolean hasPassedBeforeToday = false;
        if (enrollmentOpt.isPresent()) {
            DeckEnrollment en = enrollmentOpt.get();
            if (Boolean.TRUE.equals(en.getTopicTestPassed())
                    && en.getTopicTestLastAttemptAt() != null
                    && en.getTopicTestLastAttemptAt().toLocalDate().isBefore(today)) {
                hasPassedBeforeToday = true;
            }
        }

        // rawXp từ nghĩa và ghép cặp
        int rawXp = Math.min(properties.getMaxXpPerAttempt(),
                (meaningCorrect * properties.getXpPerMeaning()) + (pairsCorrect * properties.getXpPerPair()));

        int computedXp = 0;
        boolean participated = timedQuizEngine.participated(attemptId);
        if (participated && rawXp > 0) {
            if (prevSubmissionsToday > 0) {
                // Lần sau trong cùng ngày: 0 XP (giữ streak)
                computedXp = 0;
            } else if (hasPassedBeforeToday) {
                // Ngày khác, bộ đã đạt trước đó: nhận 50%
                computedXp = (int) Math.round(rawXp * properties.getRepeatAttemptXpDiscount());
            } else {
                // Lần đầu trong ngày: 100%
                computedXp = rawXp;
            }
        }

        int remainingCap = dailyXpBudget.remaining(user.getId(), today, voiceConfig.getDailyXpCap());
        int awardedXp = Math.min(computedXp, remainingCap);

        // Ghi nhận hoạt động học (DailyLearningActivity) và cập nhật streak
        var actReq = new DailyLearningActivityRequest();
        actReq.setActivityDate(today);
        actReq.setXpEarned(awardedXp);
        actReq.setQuizCount(1);
        actReq.setMinutesSpent(Math.max(1, (attempt.getTimeSpentSeconds() == null ? 0 : attempt.getTimeSpentSeconds()) / 60));
        var activity = activityService.logActivity(actReq);

        int streak = Math.max(1, activity.getCurrentStreak() == null ? 0 : activity.getCurrentStreak());
        int previous = user.getStreakCurrent() == null ? 0 : user.getStreakCurrent();
        if (today.equals(user.getLastActivityDate())) {
            streak = Math.max(streak, previous);
        } else if (today.minusDays(1).equals(user.getLastActivityDate())) {
            streak = Math.max(streak, previous + 1);
        }
        // Cập nhật streak và lastActivityDate cho user (users.xp_total đã được activityService.logActivity cộng)
        Users refreshedUser = usersRepository.findById(user.getId()).orElse(user);
        refreshedUser.setStreakCurrent(streak);
        refreshedUser.setStreakLongest(Math.max(streak, refreshedUser.getStreakLongest() == null ? 0 : refreshedUser.getStreakLongest()));
        refreshedUser.setLastActivityDate(today);
        usersRepository.save(refreshedUser);

        attempt.setXpAwarded(awardedXp);
        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        // Cập nhật trạng thái hoàn thành và điểm cao nhất cho DeckEnrollment
        if (enrollmentOpt.isPresent()) {
            DeckEnrollment en = enrollmentOpt.get();
            en.setTopicTestLastAttemptAt(LocalDateTime.now());
            if (en.getTopicTestBestScore() == null || percent.compareTo(en.getTopicTestBestScore()) > 0) {
                en.setTopicTestBestScore(percent);
            }
            if (passed) {
                en.setTopicTestPassed(true);
            }
            deckEnrollmentRepository.save(en);
        }

        try {
            achievementService.evaluateAchievements(user.getId());
        } catch (Exception e) {
            log.warn("Non-blocking achievement evaluation error: {}", e.getMessage());
        }

        return buildDetailResponse(savedAttempt);
    }

    private QuizAttemptDetailResponse buildDetailResponse(QuizAttempt attempt) {
        QuizAttemptDetailResponse res = mapper.map(attempt, QuizAttemptDetailResponse.class);
        res.setTimedScreen(timedQuizEngine.snapshot(attempt));
        res.setTimedReview(timedQuizEngine.review(attempt));
        if (attempt.getQuiz() != null) {
            res.setQuizCategory(attempt.getQuiz().getQuizCategory());
            res.setMaxScore(attempt.getPreciseMaxScore() != null ? attempt.getPreciseMaxScore() : BigDecimal.valueOf(attempt.getTotalQuestions()));
        }

        List<QuizAttemptQuestion> questions = quizAttemptQuestionRepository.findByAttemptId(attempt.getId());
        List<Long> questionIds = questions.stream().map(QuizAttemptQuestion::getId).toList();
        Map<Long, List<QuizAttemptOption>> optionsByQuestionId = quizAttemptOptionRepository
                .findByAttemptQuestionIdIn(questionIds)
                .stream()
                .collect(Collectors.groupingBy(o -> o.getAttemptQuestion().getId()));

        res.setQuestions(questions.stream().map(q -> {
            QuizAttemptQuestionResponse qr = mapper.map(q, QuizAttemptQuestionResponse.class);
            if (qr == null) qr = new QuizAttemptQuestionResponse();
            List<QuizAttemptOption> options = optionsByQuestionId.getOrDefault(q.getId(), List.of());
            qr.setOptions(options.stream().map(o -> {
                QuizAttemptOptionResponse or = mapper.map(o, QuizAttemptOptionResponse.class);
                if (or == null) or = new QuizAttemptOptionResponse();
                if (attempt.getStatus() != QuizAttemptStatus.SUBMITTED) {
                    or.setIsCorrect(null); // Không leak đáp án đúng khi đang làm bài
                }
                return or;
            }).toList());
            return qr;
        }).toList());

        if (attempt.getStatus() == QuizAttemptStatus.SUBMITTED) {
            List<QuizAnswer> answers = quizAnswerRepository.findByAttemptId(attempt.getId());
            res.setAnswers(answers.stream().map(a -> {
                QuizAnswerResponse ar = mapper.map(a, QuizAnswerResponse.class);
                if (a.getAttemptQuestion() != null) ar.setAttemptQuestionId(a.getAttemptQuestion().getId());
                if (a.getSelectedAttemptOption() != null) ar.setSelectedAttemptOptionId(a.getSelectedAttemptOption().getId());
                return ar;
            }).toList());
        }

        return res;
    }
}
