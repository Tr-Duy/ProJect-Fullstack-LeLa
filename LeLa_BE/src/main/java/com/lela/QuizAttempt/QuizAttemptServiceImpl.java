package com.lela.QuizAttempt;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizAttemptReponse;
import com.lela.QuizAttempt.dto.QuizAttemptRequest;
import com.lela.QuizAttempt.dto.QuizAttemptDetailResponse;
import com.lela.QuizAttempt.dto.QuizSubmitRequest;
import com.lela.QuizAttempt.dto.QuizAnswerSubmitRequest;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizAnswer.QuizAnswerRepository;
import com.lela.QuizAnswer.domain.QuizAnswer;
import com.lela.QuizQuestionOption.QuizQuestionOptionRepository;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizAttempt.dto.QuizAnswerResponse;
import org.springframework.security.access.AccessDeniedException;
import com.lela.common.exception.NotFoundExeception;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Objects;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizAttemptServiceImpl implements QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final UsersRepository usersRepository;
    private final com.lela.common.ProficiencyLevelRepository levelRepository;
    private final QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    private final QuizAttemptOptionRepository quizAttemptOptionRepository;
    private final QuizQuestionOptionRepository quizQuestionOptionRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final com.lela.deck.DeckRepository deckRepository;
    private final com.lela.deckenrollment.DeckEnrollmentRepository deckEnrollmentRepository;
    private final ModelMapper mapper;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new org.springframework.security.access.AccessDeniedException("User is not authenticated");
        }
        String username = auth.getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundExeception("User not found: " + username))
                .getId();
    }

    @Override
    public Page<QuizAttemptReponse> findAll(Pageable pageable) {
        return quizAttemptRepository.findAll(pageable)
                .map(q -> {
                    QuizAttemptReponse res = mapper.map(q, QuizAttemptReponse.class);
                    if (q.getQuiz() != null) {
                        res.setMaxScore(determineAttemptMaxScore(q));
                        if (q.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL
                                || q.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT
                                || q.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP) {
                            res.setEstimatedToeicScore(calculateEstimatedToeicScoreForAttempt(q));
                        }
                    }
                    return res;
                });
    }

    @Override
    public Page<QuizAttemptReponse> findMyAttempts(Pageable pageable) {
        Long userId = getCurrentUserId();
        return quizAttemptRepository.findByUserId(userId, pageable)
                .map(q -> {
                    QuizAttemptReponse res = mapper.map(q, QuizAttemptReponse.class);
                    if (q.getQuiz() != null) {
                        res.setQuizId(q.getQuiz().getId());
                        res.setQuizTitle(q.getQuiz().getTitle());
                        res.setQuizCategory(q.getQuiz().getQuizCategory());
                        res.setUserId(q.getUser().getId());
                        res.setMaxScore(determineAttemptMaxScore(q));
                        if (q.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL
                                || q.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT
                                || q.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP) {
                            res.setEstimatedToeicScore(calculateEstimatedToeicScoreForAttempt(q));
                        }
                    }
                    return res;
                });
    }

    @Override
    public QuizAttemptReponse findById(Long id) {
        return quizAttemptRepository.findById(id)
                .map(c -> {
                    QuizAttemptReponse res = mapper.map(c, QuizAttemptReponse.class);
                    if (c.getQuiz() != null) {
                        res.setMaxScore(determineAttemptMaxScore(c));
                        if (c.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL
                                || c.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT
                                || c.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP) {
                            res.setEstimatedToeicScore(calculateEstimatedToeicScoreForAttempt(c));
                        }
                    }
                    return res;
                })
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + id));
    }

    @Transactional
    @Override
    public QuizAttemptReponse create(QuizAttemptRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + request.getQuizId()));
        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundExeception("User not found: " + request.getUserId()));

        QuizAttempt attempt = mapper.map(request, QuizAttempt.class);
        attempt.setPublicId(UUID.randomUUID().toString());
        attempt.setQuiz(quiz);
        attempt.setUser(user);
        attempt.setStartedAt(LocalDateTime.now());
        return mapper.map(quizAttemptRepository.save(attempt), QuizAttemptReponse.class);
    }

    @Transactional
    @Override
    public QuizAttemptReponse update(Long id, QuizAttemptRequest request) {
        QuizAttempt existing = quizAttemptRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + id));
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + request.getQuizId()));
        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundExeception("User not found: " + request.getUserId()));

        mapper.map(request, existing);
        existing.setQuiz(quiz);
        existing.setUser(user);
        return mapper.map(quizAttemptRepository.save(existing), QuizAttemptReponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!quizAttemptRepository.existsById(id)) {
            throw new NotFoundExeception("QuizAttempt not found: " + id);
        }
        quizAttemptRepository.deleteById(id);
    }

    // Bắt đầu 1 lượt làm quiz mới cho user hiện tại
    @Transactional
    @Override
    public QuizAttemptDetailResponse startAttempt(Long quizId) {
        Long userId = getCurrentUserId();
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + quizId));
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new NotFoundExeception("User not found: " + userId));

        if (quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT) {
            // Placement tests are always unlocked for any learner to attempt level placement
        }

        if (quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL
                || quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP) {
            com.lela.common.domain.ProficiencyLevel userLevel = user.getCurrentLevel();
            if (userLevel == null) {
                throw new IllegalStateException("Bạn chưa hoàn thành thiết lập trình độ trước khi làm bài kiểm tra.");
            }

            if (quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL && quiz.getLevel() != null) {
                if (!quiz.getLevel().getId().equals(userLevel.getId())) {
                    throw new IllegalStateException("Bài kiểm tra FINAL không thuộc trình độ hiện tại của bạn.");
                }
            }

            if (quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP && quiz.getLevel() != null) {
                com.lela.common.domain.ProficiencyLevel targetLevel = quiz.getLevel();
                List<com.lela.common.domain.ProficiencyLevel> allLevels = levelRepository
                        .findByExamTypeIdOrderByDisplayOrderAsc(targetLevel.getExamType().getId());
                int currentRank = getLevelRank(userLevel, allLevels);
                int targetRank = getLevelRank(targetLevel, allLevels);

                // Sequential Chain Check
                List<Quiz> levelUpQuizzes = quizRepository.findByLevelIdAndCategoriesForLearner(
                        targetLevel.getId(),
                        List.of(com.lela.Quiz.domain.QuizCategory.LEVEL_UP),
                        Pageable.unpaged()).getContent();
                List<Quiz> sortedQuizzes = new ArrayList<>(levelUpQuizzes);
                sortedQuizzes.sort((a, b) -> (a.getQuizCode() != null ? a.getQuizCode() : "")
                        .compareTo(b.getQuizCode() != null ? b.getQuizCode() : ""));

                int requestedIdx = -1;
                for (int i = 0; i < sortedQuizzes.size(); i++) {
                    if (sortedQuizzes.get(i).getId().equals(quiz.getId())) {
                        requestedIdx = i;
                        break;
                    }
                }

                int firstUnattemptedIdx = -1;
                LocalDateTime lastFailedSubmitTime = null;
                boolean anyPassed = false;
                for (int i = 0; i < sortedQuizzes.size(); i++) {
                    Quiz q = sortedQuizzes.get(i);
                    List<QuizAttempt> attempts = quizAttemptRepository
                            .findByUserIdAndQuizIdOrderByStartedAtDesc(userId, q.getId());
                    if (!attempts.isEmpty()) {
                        QuizAttempt latest = attempts.get(0);
                        if (Boolean.TRUE.equals(latest.getPassed())) {
                            anyPassed = true;
                        } else if (firstUnattemptedIdx == -1) {
                            lastFailedSubmitTime = latest.getSubmittedAt() != null ? latest.getSubmittedAt() : latest.getStartedAt();
                        }
                    } else if (firstUnattemptedIdx == -1) {
                        firstUnattemptedIdx = i;
                    }
                }

                if (anyPassed) {
                    throw new IllegalStateException("Bạn đã đạt bài kiểm tra nâng cấp trình độ này rồi.");
                }
                if (firstUnattemptedIdx == -1) {
                    throw new IllegalStateException("Bạn đã hoàn thành cả 10 bài kiểm tra trong chu kỳ này.");
                }
                if (requestedIdx != firstUnattemptedIdx) {
                    throw new IllegalStateException("Bạn phải làm bài thi theo đúng thứ tự chuỗi 10 bài. Bài thi mở tiếp theo là Bài #" + (firstUnattemptedIdx + 1) + ".");
                }
                if (firstUnattemptedIdx > 0 && lastFailedSubmitTime != null) {
                    LocalDateTime cooldownEnd = lastFailedSubmitTime.plusHours(24);
                    if (LocalDateTime.now().isBefore(cooldownEnd)) {
                        java.time.Duration remaining = java.time.Duration.between(LocalDateTime.now(), cooldownEnd);
                        long hours = remaining.toHours();
                        long minutes = remaining.toMinutes() % 60;
                        String remainingTime = hours > 0 ? hours + " giờ " + minutes + " phút" : minutes + " phút";
                        throw new IllegalStateException("Chuỗi bài thi đang trong thời gian chờ 24 giờ sau lần làm chưa đạt trước đó. Vui lòng thử lại sau " + remainingTime + ".");
                    }
                }
            } else if (quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL_LEVEL && quiz.getLevel() != null) {
                Long levelId = quiz.getLevel().getId();
                // 1. Deck completion eligibility check
                List<com.lela.deck.domain.Deck> activeDecks = deckRepository.findAll().stream()
                        .filter(d -> d.isActive && d.getLevel() != null && Objects.equals(d.getLevel().getId(), levelId))
                        .toList();

                List<com.lela.deckenrollment.domain.DeckEnrollment> userEnrollments = deckEnrollmentRepository
                        .findByUserId(userId, Pageable.unpaged()).getContent();
                long completedDecks = userEnrollments.stream()
                        .filter(e -> e.getDeck() != null && e.getDeck().getLevel() != null && Objects.equals(e.getDeck().getLevel().getId(), levelId))
                        .filter(e -> e.getCompletedAt() != null || e.getStatus() == com.lela.deckenrollment.domain.DeckEnrollmentStatus.COMPLETED
                                || (e.getDeck().getTotalCards() != null && e.getDeck().getTotalCards() > 0 && e.getMasteredCards() >= e.getDeck().getTotalCards()))
                        .count();

                int requiredDecks = Math.min(10, activeDecks.size());
                if (!activeDecks.isEmpty() && completedDecks < requiredDecks) {
                    throw new IllegalStateException("Bạn cần hoàn thành đủ " + requiredDecks + " bộ thẻ của trình độ hiện tại trước khi thực hiện bài kiểm tra kết thúc mức độ (Hiện tại: " + completedDecks + "/" + requiredDecks + ").");
                }

                // 2. 12-Hour Global Cooldown Check
                List<QuizAttempt> allFinalAttempts = quizAttemptRepository.findByUserId(userId, Pageable.unpaged())
                        .getContent()
                        .stream()
                        .filter(a -> a.getQuiz() != null && a.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL_LEVEL
                                && a.getQuiz().getLevel() != null && Objects.equals(a.getQuiz().getLevel().getId(), levelId))
                        .toList();

                java.util.Optional<QuizAttempt> latestFailed = allFinalAttempts.stream()
                        .filter(a -> Boolean.FALSE.equals(a.getPassed()) && a.getSubmittedAt() != null)
                        .max(java.util.Comparator.comparing(QuizAttempt::getSubmittedAt));

                if (latestFailed.isPresent()) {
                    LocalDateTime cooldownEnd = latestFailed.get().getSubmittedAt().plusHours(12);
                    if (LocalDateTime.now().isBefore(cooldownEnd)) {
                        java.time.Duration remaining = java.time.Duration.between(LocalDateTime.now(), cooldownEnd);
                        long hours = remaining.toHours();
                        long mins = remaining.toMinutes() % 60;
                        String remainingTimeStr = hours > 0 ? hours + " giờ " + mins + " phút" : mins + " phút";
                        throw new IllegalStateException("Hệ thống bài kiểm tra kết thúc mức độ đang trong thời gian tạm khóa 12 giờ sau lần thi chưa đạt. Vui lòng quay lại sau " + remainingTimeStr + ".");
                    }
                }

                // 3. Single attempt per cycle check
                int maxCycle = allFinalAttempts.stream()
                        .map(QuizAttempt::getCycleNumber)
                        .filter(Objects::nonNull)
                        .max(Integer::compareTo)
                        .orElse(1);

                boolean alreadyAttemptedThisCycle = allFinalAttempts.stream()
                        .filter(a -> Objects.equals(a.getCycleNumber(), maxCycle))
                        .anyMatch(a -> a.getQuiz() != null && a.getQuiz().getId().equals(quiz.getId()) && a.getSubmittedAt() != null);

                if (alreadyAttemptedThisCycle) {
                    throw new IllegalStateException("Bài kiểm tra này đã được thực hiện trong chu kỳ hiện tại và không thể làm lại.");
                }
            }
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setPublicId(UUID.randomUUID().toString());
        attempt.setQuiz(quiz);
        attempt.setUser(user);
        attempt.setLevelAtAttempt(user.getCurrentLevel());

        // Find attempt number using a query
        Integer maxAttempt = quizAttemptRepository.findMaxAttemptNumber(userId, quizId);
        attempt.setAttemptNumber(maxAttempt + 1);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setTotalQuestions(quiz.getQuestions().size());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        List<QuizQuestion> activeQuestions = quiz.getQuestions().stream()
                .filter(q -> q.getIsActive() != null && q.getIsActive())
                .collect(Collectors.toList());

        List<Long> sourceQuestionIds = activeQuestions.stream()
                .map(QuizQuestion::getId)
                .collect(Collectors.toList());

        Map<Long, List<QuizQuestionOption>> optionsBySourceQuestionId = quizQuestionOptionRepository
                .findByQuestionIdIn(sourceQuestionIds)
                .stream()
                .collect(Collectors.groupingBy(o -> o.getQuestion().getId()));

        List<QuizAttemptQuestion> allAttemptQuestions = new ArrayList<>();
        List<QuizAttemptOption> allAttemptOptions = new ArrayList<>();

        // Create AttemptQuestions in memory
        for (QuizQuestion q : activeQuestions) {
            QuizAttemptQuestion aq = new QuizAttemptQuestion();
            aq.setAttempt(savedAttempt);
            aq.setSourceQuestion(q);
            aq.setQuestionText(q.getQuestionText());
            aq.setQuestionImageUrl(q.getQuestionImageUrl());
            aq.setQuestionType(q.getQuestionType());
            aq.setExplanation(q.getExplanation());
            aq.setPoints(q.getPoints());
            aq.setQuestionTimeLimitSeconds(q.getQuestionTimeLimitSeconds());
            aq.setDisplayOrder(q.getDisplayOrder());

            allAttemptQuestions.add(aq);
        }

        // Bulk insert questions
        if (!allAttemptQuestions.isEmpty()) {
            allAttemptQuestions = quizAttemptQuestionRepository.saveAll(allAttemptQuestions);
        }

        // Create AttemptOptions using saved AttemptQuestions and fetched SourceOptions
        for (QuizAttemptQuestion aq : allAttemptQuestions) {
            List<QuizQuestionOption> sourceOptions = optionsBySourceQuestionId
                    .getOrDefault(aq.getSourceQuestion().getId(), new ArrayList<>());
            for (QuizQuestionOption o : sourceOptions) {
                QuizAttemptOption ao = new QuizAttemptOption();
                ao.setAttemptQuestion(aq);
                ao.setOptionKey(o.getOptionKey());
                ao.setOptionText(o.getOptionText());
                ao.setNormalizedText(o.getNormalizedText());
                ao.setIsCorrect(o.getIsCorrect());
                ao.setDisplayOrder(o.getDisplayOrder());
                allAttemptOptions.add(ao);
            }
        }

        if (!allAttemptOptions.isEmpty()) {
            quizAttemptOptionRepository.saveAll(allAttemptOptions);
        }

        return buildDetailResponse(savedAttempt);
    }

    // Check quyền: chỉ chủ sở hữu attempt hoặc ADMIN mới được xem
    @Override
    public QuizAttemptDetailResponse getAttemptDetailByPublicId(String publicId) {
        QuizAttempt attempt = quizAttemptRepository.findByPublicId(publicId)
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + publicId));

        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication();
        String currentUser = auth != null ? auth.getName() : null;
        boolean isAdmin = auth != null
                && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !attempt.getUser().getUsername().equals(currentUser)) {
            throw new AccessDeniedException("You are not authorized to view this attempt.");
        }

        return buildDetailResponse(attempt);
    }

    // Nộp bài và chấm điểm 1 attempt
    @Transactional
    @Override
    public QuizAttemptDetailResponse submit(Long id, QuizSubmitRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + id));

        List<QuizAttemptQuestion> questions = quizAttemptQuestionRepository.findByAttemptId(id);

        // Save answers
        quizAnswerRepository.deleteAll(quizAnswerRepository.findByAttemptId(id));

        int totalScore = 0;
        int maxScore = 0;
        int correctCount = 0;

        List<Long> questionIds = questions.stream().map(QuizAttemptQuestion::getId).collect(Collectors.toList());
        Map<Long, List<QuizAttemptOption>> optionsByQuestionId = quizAttemptOptionRepository
                .findByAttemptQuestionIdIn(questionIds)
                .stream()
                .collect(Collectors.groupingBy(o -> o.getAttemptQuestion().getId()));

        List<QuizAnswer> allAnswersToSave = new ArrayList<>();

        for (QuizAttemptQuestion question : questions) {
            maxScore += question.getPoints();

            // Find student answer for this question
            QuizAnswerSubmitRequest studentAnswerReq = request.getAnswers().stream()
                    .filter(a -> a.getAttemptQuestionId().equals(question.getId()))
                    .findFirst().orElse(null);

            if (studentAnswerReq != null) {
                QuizAnswer answer = new QuizAnswer();
                answer.setAttempt(attempt);
                answer.setAttemptQuestion(question);

                List<QuizAttemptOption> options = optionsByQuestionId.getOrDefault(question.getId(), new ArrayList<>());

                QuizAttemptOption selectedOption = null;
                if (studentAnswerReq.getSelectedAttemptOptionId() != null) {
                    selectedOption = options.stream()
                            .filter(o -> o.getId().equals(studentAnswerReq.getSelectedAttemptOptionId()))
                            .findFirst().orElse(null);
                    answer.setSelectedAttemptOption(selectedOption);
                }
                answer.setAnswerText(studentAnswerReq.getAnswerText());
                answer.setAnsweredAt(LocalDateTime.now());

                // Evaluate
                boolean isCorrect = false;

                if (question.getQuestionType() == com.lela.QuizQuestion.domain.QuestionType.FILL_BLANK) {
                    // For Fill in the blank, check text matching
                    String stuText = studentAnswerReq.getAnswerText() != null
                            ? studentAnswerReq.getAnswerText().trim().toLowerCase(java.util.Locale.ROOT)
                            : "";
                    isCorrect = options.stream()
                            .anyMatch(o -> o.getIsCorrect() && stuText.equals(
                                    o.getOptionText() != null
                                            ? o.getOptionText().trim().toLowerCase(java.util.Locale.ROOT)
                                            : ""));
                } else {
                    // Multiple choice or true/false
                    Set<Long> correctOptionIds = options.stream()
                            .filter(QuizAttemptOption::getIsCorrect)
                            .map(QuizAttemptOption::getId)
                            .collect(Collectors.toSet());

                    if (selectedOption != null && correctOptionIds.contains(selectedOption.getId())) {
                        isCorrect = true;
                    }
                }

                if (isCorrect) {
                    totalScore += question.getPoints();
                    correctCount++;
                    answer.setPointsAwarded(question.getPoints());
                } else {
                    answer.setPointsAwarded(0);
                }

                answer.setIsCorrect(isCorrect);
                allAnswersToSave.add(answer);
            }
        }

        if (!allAnswersToSave.isEmpty()) {
            quizAnswerRepository.saveAll(allAnswersToSave);
        }

        attempt.setSubmittedAt(LocalDateTime.now());
        if (attempt.getStartedAt() != null) {
            long seconds = java.time.Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds();
            attempt.setTimeSpentSeconds((int) seconds);
        }
        attempt.setScorePoints(totalScore);

        BigDecimal percent = maxScore > 0 ? BigDecimal.valueOf((double) totalScore / maxScore * 100) : BigDecimal.ZERO;
        attempt.setScorePercent(percent);
        attempt.setStatus(com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus.SUBMITTED);
        attempt.setCorrectAnswers(correctCount);
        Quiz quiz = attempt.getQuiz();
        if (quiz != null && quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL_LEVEL) {
            attempt.setPassed(percent.compareTo(BigDecimal.valueOf(70)) >= 0);
        } else {
            attempt.setPassed(percent.compareTo(BigDecimal.valueOf(80)) >= 0);
        }

        attempt.setXpAwarded(correctCount * 10); // Example: 10 XP per correct answer

        Users user = attempt.getUser();

        if (quiz != null && quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL) {
            if (user.getCurrentLevel() != null && quiz.getLevel() != null
                    && !quiz.getLevel().getId().equals(user.getCurrentLevel().getId())) {
                throw new IllegalStateException("Bài kiểm tra FINAL không thuộc trình độ hiện tại của bạn.");
            }
        }

        if (quiz != null && quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT) {
            if (Boolean.TRUE.equals(attempt.getPassed())) {
                if (quiz.getLevel() != null) {
                    com.lela.common.domain.ProficiencyLevel currentLevel = user.getCurrentLevel();
                    if (currentLevel == null || (quiz.getLevel().getDisplayOrder() != null && currentLevel.getDisplayOrder() != null && quiz.getLevel().getDisplayOrder() > currentLevel.getDisplayOrder())) {
                        user.setCurrentLevel(quiz.getLevel());
                    }
                }
                if (quiz.getExamType() != null) {
                    user.setCurrentExamType(quiz.getExamType());
                }
                usersRepository.save(user);
            } else {
                if (user.getCurrentLevel() == null && quiz.getLevel() != null && "PLACEMENT-TOEIC-U500".equalsIgnoreCase(quiz.getQuizCode())) {
                    user.setCurrentLevel(quiz.getLevel());
                    if (quiz.getExamType() != null) {
                        user.setCurrentExamType(quiz.getExamType());
                    }
                    usersRepository.save(user);
                }
            }
        }

        if (quiz != null && quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL_LEVEL && Boolean.TRUE.equals(attempt.getPassed())) {
            com.lela.common.domain.ProficiencyLevel currentLevel = user.getCurrentLevel();
            if (currentLevel != null && currentLevel.getExamType() != null) {
                List<com.lela.common.domain.ProficiencyLevel> allLevels = levelRepository
                        .findByExamTypeIdOrderByDisplayOrderAsc(currentLevel.getExamType().getId());
                int currentRank = getLevelRank(currentLevel, allLevels);
                if (currentRank > 0 && currentRank < allLevels.size()) {
                    com.lela.common.domain.ProficiencyLevel nextLevel = allLevels.get(currentRank);
                    user.setCurrentLevel(nextLevel);
                    usersRepository.save(user);
                }
            }
        } else if (quiz != null && quiz.getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP && Boolean.TRUE.equals(attempt.getPassed())) {
            if (quiz.getLevel() != null) {
                user.setCurrentLevel(quiz.getLevel());
                usersRepository.save(user);
            }
        }

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        return buildDetailResponse(savedAttempt);
    }

    private boolean hasUserPassedPlacementQuiz(Long userId, String quizCode) {
        return quizRepository.findByQuizCode(quizCode)
                .map(q -> quizAttemptRepository.findByUserIdAndQuizIdOrderByStartedAtDesc(userId, q.getId()))
                .map(attempts -> attempts.stream().anyMatch(a -> Boolean.TRUE.equals(a.getPassed())))
                .orElse(false);
    }

    // build response chi tiết đầy đủ cho 1 attempt
    private QuizAttemptDetailResponse buildDetailResponse(QuizAttempt attempt) {
        QuizAttemptDetailResponse res = mapper.map(attempt, QuizAttemptDetailResponse.class);
        if (attempt.getQuiz() != null) {
            res.setQuizCategory(attempt.getQuiz().getQuizCategory());
            res.setMaxScore(determineAttemptMaxScore(attempt));
        }
        List<QuizAttemptQuestion> questions = quizAttemptQuestionRepository.findByAttemptId(attempt.getId());

        List<Long> questionIds = questions.stream().map(QuizAttemptQuestion::getId).collect(Collectors.toList());

        Map<Long, List<QuizAttemptOption>> optionsByQuestionId = quizAttemptOptionRepository
                .findByAttemptQuestionIdIn(questionIds)
                .stream()
                .collect(Collectors.groupingBy(o -> o.getAttemptQuestion().getId()));

        res.setQuestions(questions.stream().map(q -> {
            QuizAttemptQuestionResponse qr = mapper.map(q, QuizAttemptQuestionResponse.class);
            List<QuizAttemptOption> options = optionsByQuestionId.getOrDefault(q.getId(), new ArrayList<>());
            qr.setOptions(options.stream().map(o -> {
                QuizAttemptOptionResponse or = mapper.map(o, QuizAttemptOptionResponse.class);
                if (attempt.getStatus() != com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus.SUBMITTED) {
                    or.setIsCorrect(null); // Never leak the correct answer to the frontend during the quiz!
                }
                return or;
            }).collect(Collectors.toList()));
            return qr;
        }).collect(Collectors.toList()));

        if (attempt.getStatus() == com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus.SUBMITTED) {
            List<QuizAnswer> answers = quizAnswerRepository.findByAttemptId(attempt.getId());
            res.setAnswers(answers.stream().map(a -> {
                QuizAnswerResponse ar = mapper.map(a, QuizAnswerResponse.class);
                if (a.getAttemptQuestion() != null)
                    ar.setAttemptQuestionId(a.getAttemptQuestion().getId());
                if (a.getSelectedAttemptOption() != null)
                    ar.setSelectedAttemptOptionId(a.getSelectedAttemptOption().getId());
                return ar;
            }).collect(Collectors.toList()));

            res.setMaxScore(determineAttemptMaxScore(attempt));

            // Calculate TOEIC scores for FINAL and PLACEMENT using unified integer
            // conversion
            if (attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL
                    || attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT) {
                BigDecimal est = calculateEstimatedToeicScoreForAttempt(attempt);
                res.setEstimatedToeicScore(est);
            }

            // Best Final Score
            if (attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL) {
                List<QuizAttempt> finals = quizAttemptRepository.findFinalAttemptsByUserId(attempt.getUser().getId());
                int bestToeic = 0;
                for (QuizAttempt fa : finals) {
                    BigDecimal faEst = calculateEstimatedToeicScoreForAttempt(fa);
                    if (faEst != null) {
                        int val = faEst.intValue();
                        if (val > bestToeic) {
                            bestToeic = val;
                        }
                    }
                }
                res.setBestEstimatedToeicScore(BigDecimal.valueOf(bestToeic));
            }

            // Level Up logic mapping
            if (attempt.getQuiz() != null
                    && attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP) {
                res.setLevelUpPassed(attempt.getPassed());
                if (attempt.getLevelAtAttempt() != null) {
                    res.setLevelUpPreviousLevel(
                            mapper.map(attempt.getLevelAtAttempt(), com.lela.common.dto.ProficiencyLevelDTO.class));
                }
                if (attempt.getQuiz().getLevel() != null) {
                    res.setLevelUpTargetLevel(
                            mapper.map(attempt.getQuiz().getLevel(), com.lela.common.dto.ProficiencyLevelDTO.class));
                    if (Boolean.TRUE.equals(attempt.getPassed())) {
                        res.setLevelUpNewLevel(mapper.map(attempt.getQuiz().getLevel(),
                                com.lela.common.dto.ProficiencyLevelDTO.class));
                        res.setLevelUpMessage("Chúc mừng! Bạn đã mở khóa trình độ mới.");
                    } else {
                        res.setLevelUpNewLevel(null);
                        res.setLevelUpMessage("Bạn chưa đạt yêu cầu để mở khóa trình độ này.");
                    }
                }
            }
        }

        return res;
    }

    private BigDecimal calculateEstimatedToeicScoreForAttempt(QuizAttempt attempt) {
        Integer correctAnswers = attempt.getCorrectAnswers();
        if (correctAnswers == null)
            correctAnswers = 0;
        Integer totalQuestions = attempt.getTotalQuestions();
        if (totalQuestions == null || totalQuestions == 0) {
            return BigDecimal.valueOf(0);
        }

        BigDecimal maxScoreBd = determineAttemptMaxScore(attempt);
        if (maxScoreBd == null) {
            return BigDecimal.valueOf(0);
        }
        int maxScore = maxScoreBd.intValue();

        double ratio = (double) correctAnswers / (double) totalQuestions;
        int estimated = (int) Math.round(ratio * maxScore);
        if (estimated < 0)
            estimated = 0;
        if (estimated > maxScore)
            estimated = maxScore;
        return BigDecimal.valueOf(estimated);
    }

    private BigDecimal determineAttemptMaxScore(QuizAttempt attempt) {
        if (attempt.getQuiz() == null || attempt.getQuiz().getQuizCategory() == null) {
            return null;
        }
        if (attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.NORMAL) {
            return BigDecimal.valueOf(100);
        }
        if (attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.FINAL
                || attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.LEVEL_UP) {
            // Prefer stored maxScore if it matches known integer ceilings; otherwise derive
            // from level code/displayOrder
            com.lela.common.domain.ProficiencyLevel level = attempt.getQuiz().getLevel();
            if (level != null) {
                BigDecimal dbMax = level.getMaxScore();
                if (dbMax != null) {
                    // If dbMax is already an integer-like value matching expected ceilings, use it
                    int rounded = dbMax.setScale(0, java.math.RoundingMode.HALF_UP).intValue();
                    if (rounded == 500 || rounded == 700 || rounded == 850 || rounded == 990) {
                        return BigDecimal.valueOf(rounded);
                    }
                }
                // Fallback mapping based on displayOrder or code
                Integer order = level.getDisplayOrder();
                if (order != null) {
                    switch (order) {
                        case 1:
                            return BigDecimal.valueOf(500);
                        case 2:
                            return BigDecimal.valueOf(700);
                        case 3:
                            return BigDecimal.valueOf(850);
                        case 4:
                            return BigDecimal.valueOf(990);
                        default:
                            break;
                    }
                }
                String code = level.getCode() != null ? level.getCode().toUpperCase() : null;
                if (code != null) {
                    if (code.contains("BASIC") || code.contains("TOEIC_BASIC"))
                        return BigDecimal.valueOf(500);
                    if (code.contains("INTERMEDIATE") || code.contains("TOEIC_INTERMEDIATE"))
                        return BigDecimal.valueOf(700);
                    if (code.contains("ADVANCED") || code.contains("TOEIC_ADVANCED"))
                        return BigDecimal.valueOf(850);
                    if (code.contains("EXCELLENT") || code.contains("TOEIC_EXCELLENT"))
                        return BigDecimal.valueOf(990);
                }
            }
            return null;
        }
        if (attempt.getQuiz().getQuizCategory() == com.lela.Quiz.domain.QuizCategory.PLACEMENT) {
            return BigDecimal.valueOf(990);
        }
        return null;
    }

    private double calculateEstimatedToeicScore(double eq) {
        if (eq >= 28.0) {
            if (eq > 30.0)
                eq = 30.0;
            return 850.0 + ((eq - 28.0) / 2.0) * 140.0;
        } else if (eq >= 24.0) {
            return 700.0 + ((eq - 24.0) / 4.0) * 150.0;
        } else if (eq >= 19.0) {
            return 550.0 + ((eq - 19.0) / 5.0) * 150.0;
        } else if (eq >= 14.0) {
            return 350.0 + ((eq - 14.0) / 5.0) * 200.0;
        } else if (eq >= 9.0) {
            return 200.0 + ((eq - 9.0) / 5.0) * 150.0;
        } else {
            if (eq < 0.0)
                eq = 0.0;
            return (eq / 9.0) * 199.0;
        }
    }

    private int getLevelRank(com.lela.common.domain.ProficiencyLevel level,
            List<com.lela.common.domain.ProficiencyLevel> allLevels) {
        if (level == null || allLevels == null)
            return 0;
        for (int i = 0; i < allLevels.size(); i++) {
            if (allLevels.get(i).getId().equals(level.getId())) {
                return i + 1;
            }
        }
        return 0;
    }
}
