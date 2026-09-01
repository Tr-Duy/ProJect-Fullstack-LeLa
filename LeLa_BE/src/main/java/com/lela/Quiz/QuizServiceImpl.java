package com.lela.Quiz;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.domain.QuizCategory;
import com.lela.Quiz.dto.QuizRequest;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.common.ExamTypeRepository;
import com.lela.common.ProficiencyLevelRepository;
import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
import com.lela.common.exception.NotFoundExeception;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizServiceImpl implements QuizService {
    private final QuizRepository quizRepository;
    private final DeckRepository deckRepository;
    private final UsersRepository usersRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ProficiencyLevelRepository proficiencyLevelRepository;
    private final com.lela.QuizAttempt.QuizAttemptRepository quizAttemptRepository;
    private final ModelMapper mapper;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated");
        }
        String username = auth.getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundExeception("User not found: " + username))
                .getId();
    }

    private QuizResponse mapToSummaryResponse(Quiz q) {
        QuizResponse res = QuizResponse.builder()
                .id(q.getId())
                .quizCode(q.getQuizCode())
                .title(q.getTitle())
                .description(q.getDescription())
                .quizType(q.getQuizType())
                .quizCategory(q.getQuizCategory())
                .difficulty(q.getDifficulty())
                .passScore(q.getPassScore())
                .timeLimitSeconds(q.getTimeLimitSeconds())
                .maxAttempts(q.getMaxAttempts())
                .shuffleQuestions(q.getShuffleQuestions())
                .shuffleOptions(q.getShuffleOptions())
                .totalQuestions(q.getTotalQuestions() != null ? q.getTotalQuestions() : 0)
                .isActive(q.getIsActive())
                .version(q.getVersion())
                .createdAt(q.getCreatedAt() != null ? q.getCreatedAt().toString() : null)
                .updatedAt(q.getUpdatedAt() != null ? q.getUpdatedAt().toString() : null)
                .build();
        if (q.getDeck() != null) {
            res.setDeckId(q.getDeck().getId());
        }
        if (q.getExamType() != null) {
            res.setExamTypeId(q.getExamType().getId());
        }
        if (q.getLevel() != null) {
            res.setLevelId(q.getLevel().getId());
        }
        return res;
    }

    private QuizResponse mapToResponse(Quiz q) {
        QuizResponse res = mapToSummaryResponse(q);

        if (q.getQuizCategory() == QuizCategory.FINAL || q.getQuizCategory() == QuizCategory.LEVEL_UP) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                Users user = usersRepository.findByUsername(auth.getName()).orElse(null);
                if (user != null) {
                    List<com.lela.QuizAttempt.domain.QuizAttempt> attempts = quizAttemptRepository
                            .findByUserIdAndQuizIdOrderByStartedAtDesc(user.getId(), q.getId());
                    if (!attempts.isEmpty()) {
                        com.lela.QuizAttempt.domain.QuizAttempt latest = attempts.get(0);
                        if (Boolean.TRUE.equals(latest.getPassed())) {
                            res.setIsLocked(false);
                            res.setAttemptStatus("PASSED");
                        } else if (Boolean.FALSE.equals(latest.getPassed())) {
                            java.time.LocalDateTime subTime = latest.getSubmittedAt() != null ? latest.getSubmittedAt()
                                    : latest.getStartedAt();
                            if (subTime != null) {
                                java.time.LocalDateTime cooldownEnd = subTime.plusHours(24);
                                if (java.time.LocalDateTime.now().isBefore(cooldownEnd)) {
                                    res.setIsLocked(true);
                                    res.setLockedUntil(cooldownEnd.toString());
                                    long remSec = java.time.Duration.between(java.time.LocalDateTime.now(), cooldownEnd).getSeconds();
                                    res.setRemainingLockSeconds(remSec > 0 ? remSec : 0);
                                    long hours = remSec / 3600;
                                    long mins = (remSec % 3600) / 60;
                                    String remainingTimeStr = hours > 0 ? hours + " giờ " + mins + " phút" : mins + " phút";
                                    res.setLockReason("Lần làm trước chưa đạt 80%. Có thể thử lại sau " + remainingTimeStr + ".");
                                    res.setAttemptStatus("LOCKED");
                                } else {
                                    res.setIsLocked(false);
                                    res.setAttemptStatus("AVAILABLE");
                                }
                            }
                        }
                    } else {
                        res.setIsLocked(false);
                        res.setAttemptStatus("AVAILABLE");
                    }
                }
            }
        }

        return res;
    }

    @Override
    public Page<QuizResponse> findAll(Pageable pageable, QuizCategory category, Long examTypeId, Long levelId, com.lela.Quiz.domain.QuizDifficulty difficulty, Long deckId, String search) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            Users user = usersRepository.findByUsername(auth.getName()).orElse(null);
            boolean isAdmin = isAdmin(user);

            if (!isAdmin && user != null && user.getCurrentLevel() != null) {
                Long currentLevelId = user.getCurrentLevel().getId();

                if (category == QuizCategory.PLACEMENT) {
                    return quizRepository.findByQuizCategoryAndIsActiveTrue(QuizCategory.PLACEMENT, pageable)
                            .map(this::mapToResponse);
                }
                if (category == QuizCategory.NORMAL || category == QuizCategory.FINAL) {
                    return quizRepository.findWithFilters(category, currentLevelId, difficulty, deckId, search, pageable)
                            .map(this::mapToResponse);
                }
                if (category == QuizCategory.LEVEL_UP) {
                    Long targetLvlId = levelId;
                    if (targetLvlId == null) {
                        ProficiencyLevel nextLevel = resolveNextLearnerLevel(user);
                        if (nextLevel != null) {
                            targetLvlId = nextLevel.getId();
                        }
                    }
                    if (targetLvlId != null) {
                        List<Quiz> levelUpQuizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.LEVEL_UP, targetLvlId);
                        List<Quiz> sortedQuizzes = new ArrayList<>(levelUpQuizzes);
                        sortedQuizzes.sort((a, b) -> (a.getQuizCode() != null ? a.getQuizCode() : "")
                                .compareTo(b.getQuizCode() != null ? b.getQuizCode() : ""));
                        return computeSequentialChainForLevelUp(user, sortedQuizzes, pageable);
                    }
                }

                return quizRepository.findAllForLearnerLevel(currentLevelId, pageable)
                        .map(this::mapToResponse);
            }
        }

        if (category == QuizCategory.LEVEL_UP && levelId != null) {
            List<Quiz> levelUpQuizzes = quizRepository.findByQuizCategoryAndLevelId(QuizCategory.LEVEL_UP, levelId, Pageable.unpaged()).getContent();
            List<Quiz> sortedQuizzes = new ArrayList<>(levelUpQuizzes);
            sortedQuizzes.sort((a, b) -> (a.getQuizCode() != null ? a.getQuizCode() : "")
                    .compareTo(b.getQuizCode() != null ? b.getQuizCode() : ""));
            Users user = getCurrentUserOrNull();
            if (user != null) {
                return computeSequentialChainForLevelUp(user, sortedQuizzes, pageable);
            }
            return new org.springframework.data.domain.PageImpl<>(
                    sortedQuizzes.stream().map(this::mapToResponse).collect(Collectors.toList()),
                    pageable,
                    sortedQuizzes.size()
            );
        }

        return quizRepository.findWithFilters(category, levelId, difficulty, deckId, search, pageable)
                .map(this::mapToResponse);
    }

    private Users getCurrentUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return usersRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    private Page<QuizResponse> computeSequentialChainForLevelUp(Users user, List<Quiz> quizzes, Pageable pageable) {
        if (quizzes.isEmpty()) {
            return Page.empty(pageable);
        }

        boolean anyPassed = false;
        int firstUnattemptedIdx = -1;
        java.time.LocalDateTime lastFailedSubmitTime = null;
        java.util.Map<Long, com.lela.QuizAttempt.domain.QuizAttempt> latestAttemptByQuizId = new java.util.HashMap<>();

        List<Long> quizIds = quizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        List<com.lela.QuizAttempt.domain.QuizAttempt> allAttempts = quizAttemptRepository
                .findByUserIdAndQuizIdInOrderByStartedAtDesc(user.getId(), quizIds);
        for (com.lela.QuizAttempt.domain.QuizAttempt a : allAttempts) {
            if (a.getQuiz() != null && !latestAttemptByQuizId.containsKey(a.getQuiz().getId())) {
                latestAttemptByQuizId.put(a.getQuiz().getId(), a);
            }
        }

        for (int i = 0; i < quizzes.size(); i++) {
            Quiz q = quizzes.get(i);
            com.lela.QuizAttempt.domain.QuizAttempt latest = latestAttemptByQuizId.get(q.getId());
            if (latest != null) {
                if (Boolean.TRUE.equals(latest.getPassed())) {
                    anyPassed = true;
                } else if (firstUnattemptedIdx == -1) {
                    lastFailedSubmitTime = latest.getSubmittedAt() != null ? latest.getSubmittedAt() : latest.getStartedAt();
                }
            } else if (firstUnattemptedIdx == -1) {
                firstUnattemptedIdx = i;
            }
        }

        if (firstUnattemptedIdx == -1 && !anyPassed) {
            firstUnattemptedIdx = quizzes.size();
        }

        final int activeIdx = (firstUnattemptedIdx == -1) ? 0 : firstUnattemptedIdx;
        final boolean passedMode = anyPassed;
        final java.time.LocalDateTime lastSubTime = lastFailedSubmitTime;

        List<QuizResponse> responses = new ArrayList<>();
        for (int i = 0; i < quizzes.size(); i++) {
            Quiz q = quizzes.get(i);
            QuizResponse res = mapToSummaryResponse(q);

            com.lela.QuizAttempt.domain.QuizAttempt latest = latestAttemptByQuizId.get(q.getId());

            if (passedMode) {
                if (latest != null && Boolean.TRUE.equals(latest.getPassed())) {
                    res.setIsLocked(false);
                    res.setAttemptStatus("COMPLETED_PASSED");
                } else {
                    res.setIsLocked(true);
                    res.setAttemptStatus("NOT_REQUIRED");
                    res.setLockReason("Bạn đã đạt bài kiểm tra nâng cấp trình độ.");
                }
            } else {
                if (i < activeIdx) {
                    res.setIsLocked(true);
                    res.setAttemptStatus("COMPLETED_FAILED");
                    res.setLockReason("Đã làm - Chưa đạt (Dưới 80%). Không thể làm lại trong chu kỳ này.");
                } else if (i == activeIdx) {
                    if (activeIdx >= quizzes.size()) {
                        res.setIsLocked(true);
                        res.setAttemptStatus("COMPLETED_FAILED");
                        res.setLockReason("Bạn đã thử cả 10 bài kiểm tra nhưng chưa đạt 80%. Vui lòng ôn tập lại.");
                    } else if (activeIdx > 0 && lastSubTime != null) {
                        java.time.LocalDateTime cooldownEnd = lastSubTime.plusHours(24);
                        if (java.time.LocalDateTime.now().isBefore(cooldownEnd)) {
                            res.setIsLocked(true);
                            res.setLockedUntil(cooldownEnd.toString());
                            long remSec = java.time.Duration.between(java.time.LocalDateTime.now(), cooldownEnd).getSeconds();
                            res.setRemainingLockSeconds(remSec > 0 ? remSec : 0);
                            long hours = remSec / 3600;
                            long mins = (remSec % 3600) / 60;
                            String remainingTimeStr = hours > 0 ? hours + " giờ " + mins + " phút" : mins + " phút";
                            res.setLockReason("Bài tiếp theo (#" + (i + 1) + ") sẽ mở sau " + remainingTimeStr + ".");
                            res.setAttemptStatus("WAITING_24H");
                        } else {
                            res.setIsLocked(false);
                            res.setAttemptStatus("AVAILABLE");
                        }
                    } else {
                        res.setIsLocked(false);
                        res.setAttemptStatus("AVAILABLE");
                    }
                } else {
                    res.setIsLocked(true);
                    res.setAttemptStatus("LOCKED");
                    res.setLockReason("Vui lòng hoàn thành bài thi trước đó theo đúng thứ tự chuỗi 10 bài.");
                }
            }
            responses.add(res);
        }

        return new org.springframework.data.domain.PageImpl<>(responses, pageable, responses.size());
    }

    private QuizResponse mapToFullResponse(Quiz q) {
        QuizResponse res = mapper.map(q, QuizResponse.class);
        if (q.getDeck() != null) {
            res.setDeckId(q.getDeck().getId());
        }
        if (q.getExamType() != null) {
            res.setExamTypeId(q.getExamType().getId());
        }
        if (q.getLevel() != null) {
            res.setLevelId(q.getLevel().getId());
        }
        res.setDifficulty(q.getDifficulty());
        res.setPassScore(q.getPassScore());
        return res;
    }

    @Override
    public QuizResponse findById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            Users user = usersRepository.findByUsername(auth.getName()).orElse(null);
            boolean isAdmin = isAdmin(user);

            if (!isAdmin && user != null && user.getCurrentLevel() != null) {
                QuizCategory category = quiz.getQuizCategory();
                if (category == QuizCategory.NORMAL || category == QuizCategory.FINAL) {
                    if (quiz.getLevel() != null && !quiz.getLevel().getId().equals(user.getCurrentLevel().getId())) {
                        throw new AccessDeniedException("Ban khong co quyen truy cap bai kiem tra o trinh do nay.");
                    }
                }
            }
        }

        return mapToFullResponse(quiz);
    }

    @Transactional
    @Override
    public QuizResponse create(QuizRequest req) {
        Quiz quiz = mapper.map(req, Quiz.class);
        validateAndSetQuizCategory(quiz, req);

        Long currentUserId = getCurrentUserId();
        Users createdBy = usersRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundExeception("User not found: " + currentUserId));
        quiz.setCreatedBy(createdBy);

        if (quiz.getQuestions() != null) {
            quiz.getQuestions().forEach(q -> {
                q.setQuiz(quiz);
                if (q.getOptions() != null) {
                    q.getOptions().forEach(opt -> opt.setQuestion(q));
                }
            });
        }

        return mapToFullResponse(quizRepository.save(quiz));
    }

    @Transactional
    @Override
    public QuizResponse update(Long id, QuizRequest req) {
        Quiz existing = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + id));

        mergeQuestions(existing, req.getQuestions());

        existing.setQuizCode(req.getQuizCode());
        existing.setTitle(req.getTitle());
        existing.setDescription(req.getDescription());
        existing.setQuizType(req.getQuizType());
        existing.setQuizCategory(req.getQuizCategory() != null ? req.getQuizCategory() : QuizCategory.NORMAL);
        existing.setDifficulty(req.getDifficulty());
        existing.setTimeLimitSeconds(req.getTimeLimitSeconds());
        existing.setPassScore(req.getPassScore());
        existing.setMaxAttempts(req.getMaxAttempts());
        existing.setShuffleQuestions(req.getShuffleQuestions());
        existing.setShuffleOptions(req.getShuffleOptions());
        existing.setIsActive(req.getIsActive());

        validateAndSetQuizCategory(existing, req);

        Long currentUserId = getCurrentUserId();
        Users updatedBy = usersRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundExeception("User not found: " + currentUserId));
        existing.setUpdatedBy(updatedBy);
        existing.setTotalQuestions(existing.getQuestions() != null ? existing.getQuestions().size() : 0);

        return mapToResponse(quizRepository.saveAndFlush(existing));
    }

    private void validateAndSetQuizCategory(Quiz quiz, QuizRequest req) {
        QuizCategory category = quiz.getQuizCategory() != null ? quiz.getQuizCategory() : QuizCategory.NORMAL;
        quiz.setDeck(null);
        quiz.setExamType(null);
        quiz.setLevel(null);

        ExamType defaultToeic = examTypeRepository.findByCode("TOEIC").orElse(null);
        if (req.getExamTypeId() != null) {
            quiz.setExamType(examTypeRepository.findById(req.getExamTypeId()).orElse(defaultToeic));
        } else if (defaultToeic != null) {
            quiz.setExamType(defaultToeic);
        }

        if (category == QuizCategory.NORMAL) {
            if (req.getDeckId() != null) {
                Deck deck = deckRepository.findById(req.getDeckId())
                        .orElseThrow(() -> new NotFoundExeception("Deck not found: " + req.getDeckId()));
                quiz.setDeck(deck);
            }
            if (req.getLevelId() != null) {
                quiz.setLevel(resolveLevelForQuiz(req.getLevelId(), quiz.getExamType()));
            }
        } else if (category == QuizCategory.FINAL) {
            if (req.getLevelId() == null) {
                throw new IllegalArgumentException("Bai kiem tra ket thuc phai duoc gan trinh do TOEIC.");
            }
            quiz.setLevel(resolveLevelForQuiz(req.getLevelId(), quiz.getExamType()));
        } else if (category == QuizCategory.LEVEL_UP) {
            if (req.getLevelId() == null) {
                throw new IllegalArgumentException("Bai kiem tra nang cap phai duoc gan trinh do muc tieu.");
            }
            quiz.setLevel(resolveLevelForQuiz(req.getLevelId(), quiz.getExamType()));
        } else if (category == QuizCategory.PLACEMENT && req.getLevelId() != null) {
            quiz.setLevel(resolveLevelForQuiz(req.getLevelId(), quiz.getExamType()));
        }
    }

    private void mergeQuestions(Quiz existing, List<QuizQuestionRequest> incomingQuestions) {
        if (incomingQuestions == null) {
            return;
        }

        List<QuizQuestion> existingQuestions = existing.getQuestions() != null ? existing.getQuestions() : new ArrayList<>();
        Map<Long, QuizQuestion> existingById = new LinkedHashMap<>();
        for (QuizQuestion question : existingQuestions) {
            if (question.getId() != null) {
                existingById.put(question.getId(), question);
            }
        }

        existingQuestions.removeIf(question -> question.getId() != null && incomingQuestions.stream()
                .filter(inc -> inc.getId() != null)
                .noneMatch(inc -> inc.getId().equals(question.getId())));

        for (QuizQuestionRequest incQ : incomingQuestions) {
            QuizQuestion matchQ = incQ.getId() != null ? existingById.get(incQ.getId()) : null;

            if (matchQ != null) {
                applyQuestionUpdates(matchQ, incQ);
                matchQ.setQuiz(existing);
                mergeOptions(matchQ, incQ.getOptions());
            } else {
                QuizQuestion newQ = new QuizQuestion();
                applyQuestionUpdates(newQ, incQ);
                newQ.setQuiz(existing);
                newQ.getOptions().clear();
                mergeOptions(newQ, incQ.getOptions());
                if (incQ.getId() != null) {
                    throw new NotFoundExeception("QuizQuestion not found in quiz: " + incQ.getId());
                }
                existingQuestions.add(newQ);
            }
        }
    }

    private void mergeOptions(QuizQuestion matchQ, List<QuizQuestionOptionRequest> incomingOptions) {
        if (incomingOptions == null) {
            return;
        }

        List<QuizQuestionOption> existingOptions = matchQ.getOptions() != null ? matchQ.getOptions() : new ArrayList<>();
        Map<Long, QuizQuestionOption> existingById = new LinkedHashMap<>();
        for (QuizQuestionOption option : existingOptions) {
            if (option.getId() != null) {
                existingById.put(option.getId(), option);
            }
        }

        existingOptions.removeIf(option -> option.getId() != null && incomingOptions.stream()
                .filter(incOpt -> incOpt.getId() != null)
                .noneMatch(incOpt -> incOpt.getId().equals(option.getId())));

        for (QuizQuestionOptionRequest incOpt : incomingOptions) {
            QuizQuestionOption matchOpt = incOpt.getId() != null ? existingById.get(incOpt.getId()) : null;

            if (matchOpt != null) {
                applyOptionUpdates(matchOpt, incOpt);
                matchOpt.setQuestion(matchQ);
            } else {
                if (incOpt.getId() != null) {
                    throw new NotFoundExeception("QuizQuestionOption not found in question: " + incOpt.getId());
                }
                QuizQuestionOption newOpt = new QuizQuestionOption();
                applyOptionUpdates(newOpt, incOpt);
                newOpt.setQuestion(matchQ);
                existingOptions.add(newOpt);
            }
        }
    }

    private void applyQuestionUpdates(QuizQuestion target, QuizQuestionRequest source) {
        target.setQuestionText(source.getQuestionText());
        target.setQuestionImageUrl(source.getQuestionImageUrl());
        target.setQuestionType(source.getQuestionType());
        target.setExplanation(source.getExplanation());
        target.setPoints(source.getPoints());
        target.setQuestionTimeLimitSeconds(source.getQuestionTimeLimitSeconds());
        target.setDisplayOrder(source.getDisplayOrder());
        target.setIsActive(source.getIsActive());
        if (source.getVersion() != null) {
            target.setVersion(source.getVersion());
        }
    }

    private void applyOptionUpdates(QuizQuestionOption target, QuizQuestionOptionRequest source) {
        target.setOptionKey(source.getOptionKey());
        target.setOptionText(source.getOptionText());
        target.setNormalizedText(source.getNormalizedText());
        target.setIsCorrect(source.getIsCorrect());
        target.setDisplayOrder(source.getDisplayOrder());
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!quizRepository.existsById(id)) {
            throw new NotFoundExeception("Quiz not found: " + id);
        }
        quizRepository.deleteById(id);
    }

    @Override
    public List<QuizResponse> findByDeckId(Long deckId) {
        return quizRepository.findByDeckIdAndIsActiveTrue(deckId).stream()
                .sorted((a, b) -> {
                    int rankA = a.getDifficulty() == com.lela.Quiz.domain.QuizDifficulty.EASY ? 1 : (a.getDifficulty() == com.lela.Quiz.domain.QuizDifficulty.MEDIUM ? 2 : (a.getDifficulty() == com.lela.Quiz.domain.QuizDifficulty.HARD ? 3 : 4));
                    int rankB = b.getDifficulty() == com.lela.Quiz.domain.QuizDifficulty.EASY ? 1 : (b.getDifficulty() == com.lela.Quiz.domain.QuizDifficulty.MEDIUM ? 2 : (b.getDifficulty() == com.lela.Quiz.domain.QuizDifficulty.HARD ? 3 : 4));
                    if (rankA != rankB) return Integer.compare(rankA, rankB);
                    return Long.compare(a.getId(), b.getId());
                })
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<QuizResponse> searchQuizzes(QuizCategory category, Long examTypeId, Long levelId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Users user = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            user = usersRepository.findByUsername(auth.getName()).orElse(null);
        }
        boolean isAdmin = isAdmin(user);

        if (!isAdmin && user != null && user.getCurrentLevel() != null) {
            Long currentLevelId = user.getCurrentLevel().getId();

            if (category == QuizCategory.NORMAL || category == QuizCategory.FINAL) {
                return quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(category, currentLevelId)
                        .stream().map(this::mapToResponse).toList();
            }
            if (category == QuizCategory.LEVEL_UP) {
                Long targetLvlId = levelId;
                if (targetLvlId == null) {
                    ProficiencyLevel nextLevel = resolveNextLearnerLevel(user);
                    if (nextLevel != null) {
                        targetLvlId = nextLevel.getId();
                    }
                }
                if (targetLvlId != null) {
                    List<Quiz> levelUpQuizzes = quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.LEVEL_UP, targetLvlId);
                    List<Quiz> sortedQuizzes = new ArrayList<>(levelUpQuizzes);
                    sortedQuizzes.sort((a, b) -> (a.getQuizCode() != null ? a.getQuizCode() : "")
                            .compareTo(b.getQuizCode() != null ? b.getQuizCode() : ""));

                    return computeSequentialChainForLevelUp(user, sortedQuizzes, Pageable.unpaged()).getContent();
                }
            }
            if (category == QuizCategory.PLACEMENT) {
                return quizRepository.findByQuizCategoryAndIsActiveTrue(QuizCategory.PLACEMENT)
                        .stream().map(this::mapToResponse).toList();
            }
        }

        if (category != null && levelId != null) {
            return quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(category, levelId)
                    .stream().map(this::mapToResponse).toList();
        }
        if (category != null && examTypeId != null) {
            return quizRepository.findByQuizCategoryAndExamTypeIdAndIsActiveTrue(category, examTypeId)
                    .stream().map(this::mapToResponse).toList();
        }
        if (category != null) {
            return quizRepository.findByQuizCategoryAndIsActiveTrue(category)
                    .stream().map(this::mapToResponse).toList();
        }

        return quizRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    private int getLevelRank(ProficiencyLevel level, List<ProficiencyLevel> allLevels) {
        if (level == null || allLevels == null) {
            return 0;
        }
        for (int i = 0; i < allLevels.size(); i++) {
            if (allLevels.get(i).getId().equals(level.getId())) {
                return i + 1;
            }
        }
        return 0;
    }

    private boolean isAdmin(Users user) {
        return user != null && user.getRoleCodes().stream()
                .anyMatch(code -> "ADMIN".equals(code) || "ROLE_ADMIN".equals(code));
    }

    private ProficiencyLevel resolveLevelForQuiz(Long levelId, ExamType examType) {
        ProficiencyLevel level = proficiencyLevelRepository.findById(levelId)
                .orElseThrow(() -> new NotFoundExeception("Level khong ton tai: " + levelId));
        if (examType != null && level.getExamType() != null && !level.getExamType().getId().equals(examType.getId())) {
            throw new IllegalArgumentException("Trinh do khong thuoc exam type duoc chon.");
        }
        return level;
    }

    private ProficiencyLevel resolveNextLearnerLevel(Users user) {
        ProficiencyLevel currentLevel = user.getCurrentLevel();
        if (currentLevel == null || currentLevel.getExamType() == null) {
            return null;
        }
        List<ProficiencyLevel> allLevels = proficiencyLevelRepository
                .findByExamTypeIdOrderByDisplayOrderAsc(currentLevel.getExamType().getId());
        int currentRank = getLevelRank(currentLevel, allLevels);
        if (currentRank <= 0 || currentRank >= allLevels.size()) {
            return null;
        }
        return allLevels.get(currentRank);
    }
}
