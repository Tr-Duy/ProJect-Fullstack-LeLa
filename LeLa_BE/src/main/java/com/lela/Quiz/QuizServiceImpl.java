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

    private QuizResponse mapToResponse(Quiz q) {
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

        if (q.getQuizCategory() == QuizCategory.FINAL || q.getQuizCategory() == QuizCategory.LEVEL_UP) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                Users user = usersRepository.findByUsername(auth.getName()).orElse(null);
                if (user != null) {
                    List<com.lela.QuizAttempt.domain.QuizAttempt> attempts = quizAttemptRepository
                            .findByUserIdAndQuizIdOrderByStartedAtDesc(user.getId(), q.getId());
                    if (!attempts.isEmpty()) {
                        com.lela.QuizAttempt.domain.QuizAttempt latest = attempts.get(0);
                        if (Boolean.FALSE.equals(latest.getPassed())) {
                            java.time.LocalDateTime subTime = latest.getSubmittedAt() != null ? latest.getSubmittedAt()
                                    : latest.getStartedAt();
                            if (subTime != null) {
                                java.time.LocalDateTime cooldownEnd = subTime.plusHours(24);
                                if (java.time.LocalDateTime.now().isBefore(cooldownEnd)) {
                                    res.setIsLocked(true);
                                    res.setLockedUntil(cooldownEnd.toString());
                                    res.setLockReason("Bạn chưa đạt 80% ở lần thi trước. Có thể làm lại sau 24 giờ.");
                                } else {
                                    res.setIsLocked(false);
                                }
                            }
                        } else {
                            res.setIsLocked(false);
                        }
                    } else {
                        res.setIsLocked(false);
                    }
                }
            }
        }

        return res;
    }

    @Override
    public Page<QuizResponse> findAll(Pageable pageable, QuizCategory category, Long examTypeId, Long levelId) {
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
                    return quizRepository.findByLevelIdAndCategoriesForLearner(
                                    currentLevelId,
                                    List.of(category),
                                    pageable)
                            .map(this::mapToResponse);
                }
                if (category == QuizCategory.LEVEL_UP) {
                    ProficiencyLevel nextLevel = resolveNextLearnerLevel(user);
                    if (nextLevel == null || (levelId != null && !nextLevel.getId().equals(levelId))) {
                        return Page.empty(pageable);
                    }
                    return quizRepository.findByLevelIdAndCategoriesForLearner(
                                    nextLevel.getId(),
                                    List.of(QuizCategory.LEVEL_UP),
                                    pageable)
                            .map(this::mapToResponse);
                }

                return quizRepository.findAllForLearnerLevel(currentLevelId, pageable)
                        .map(this::mapToResponse);
            }
        }

        if (category != null && levelId != null) {
            return quizRepository.findByQuizCategoryAndLevelId(category, levelId, pageable)
                    .map(this::mapToResponse);
        }
        if (category != null && examTypeId != null) {
            return quizRepository.findByQuizCategoryAndExamTypeId(category, examTypeId, pageable)
                    .map(this::mapToResponse);
        }
        if (category != null) {
            return quizRepository.findByQuizCategory(category, pageable).map(this::mapToResponse);
        }

        return quizRepository.findAll(pageable).map(this::mapToResponse);
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
                } else if (category == QuizCategory.LEVEL_UP) {
                    ProficiencyLevel userLevel = user.getCurrentLevel();
                    ProficiencyLevel targetLevel = quiz.getLevel();
                    if (userLevel != null && targetLevel != null) {
                        List<ProficiencyLevel> allLevels = proficiencyLevelRepository
                                .findByExamTypeIdOrderByDisplayOrderAsc(userLevel.getExamType().getId());
                        int currentRank = getLevelRank(userLevel, allLevels);
                        int targetRank = getLevelRank(targetLevel, allLevels);
                        if (targetRank != currentRank + 1) {
                            throw new AccessDeniedException("Ban khong co quyen lam bai kiem tra thang cap nay.");
                        }
                    }
                }
            }
        }

        return mapToResponse(quiz);
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

        return mapToResponse(quizRepository.save(quiz));
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
                ProficiencyLevel nextLevel = resolveNextLearnerLevel(user);
                if (nextLevel == null || (levelId != null && !nextLevel.getId().equals(levelId))) {
                    return List.of();
                }
                return quizRepository.findByQuizCategoryAndLevelIdAndIsActiveTrue(QuizCategory.LEVEL_UP, nextLevel.getId())
                        .stream().map(this::mapToResponse).toList();
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
