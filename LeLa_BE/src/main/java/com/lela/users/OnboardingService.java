package com.lela.users;

import com.lela.Quiz.domain.QuizCategory;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptStatus;
import com.lela.common.ProficiencyLevelRepository;
import com.lela.common.ExamTypeRepository;
import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import com.lela.common.exception.NotFoundExeception;
import com.lela.users.domain.Users;
import com.lela.users.dto.PlacementTestResult;
import com.lela.users.dto.UsersResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OnboardingService {

    private final UsersRepository usersRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ProficiencyLevelRepository levelRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ModelMapper mapper;

    private Users getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return usersRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new NotFoundExeception("User not found"));
    }

    public PlacementTestResult processPlacementResult(String attemptPublicId) {
        Users currentUser = getCurrentUser();

        QuizAttempt attempt = quizAttemptRepository.findByPublicId(attemptPublicId)
                .orElseThrow(() -> new NotFoundExeception("Quiz attempt not found"));

        if (!attempt.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You cannot submit another user's attempt");
        }

        if (attempt.getStatus() != QuizAttemptStatus.SUBMITTED) {
            throw new IllegalArgumentException("Attempt has not been submitted yet");
        }

        if (attempt.getQuiz() == null || attempt.getQuiz().getQuizCategory() != QuizCategory.PLACEMENT) {
            throw new IllegalArgumentException("Attempt is not a PLACEMENT test");
        }

        ExamType examType = attempt.getQuiz().getExamType();
        ProficiencyLevel quizLevel = attempt.getQuiz().getLevel();
        if (examType == null && quizLevel != null) {
            examType = quizLevel.getExamType();
        }
        if (examType == null) {
            throw new IllegalStateException("Placement quiz does not have an exam type");
        }

        Integer correctAnswers = attempt.getCorrectAnswers();
        if (correctAnswers == null) correctAnswers = 0;
        
        Integer totalQuestions = attempt.getTotalQuestions();
        if (totalQuestions == null || totalQuestions == 0) {
            throw new IllegalArgumentException("Total questions cannot be zero");
        }

        if (correctAnswers > totalQuestions) {
            correctAnswers = totalQuestions;
        }

        double correctRate = (double) correctAnswers / totalQuestions;
        double equivalentCorrect30 = correctRate * 30.0;
        double estimatedScoreValue = calculateEstimatedToeicScore(equivalentCorrect30);
        BigDecimal estimatedToeicScore = BigDecimal.valueOf(estimatedScoreValue).setScale(2, RoundingMode.HALF_UP);

        List<ProficiencyLevel> allLevels = levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(examType.getId());
        ProficiencyLevel lowestLevel = !allLevels.isEmpty() ? allLevels.get(0) : null;
        
        boolean isLowestLevel = false;
        if (quizLevel != null && lowestLevel != null) {
            isLowestLevel = quizLevel.getId().equals(lowestLevel.getId())
                    || (quizLevel.getDisplayOrder() != null && quizLevel.getDisplayOrder().equals(lowestLevel.getDisplayOrder()));
        }

        boolean passed = Boolean.TRUE.equals(attempt.getPassed());
        ProficiencyLevel assignedLevel = null;
        boolean placementCompleted = false;
        String message;
        java.util.List<ProficiencyLevelDTO> lowerLevels = new java.util.ArrayList<>();

        if (passed) {
            assignedLevel = quizLevel != null ? quizLevel : lowestLevel;
            placementCompleted = true;
            if (assignedLevel != null) {
                currentUser.setCurrentExamType(examType);
                currentUser.setCurrentLevel(assignedLevel);
                usersRepository.save(currentUser);

                attempt.setLevelAtAttempt(assignedLevel);
                quizAttemptRepository.save(attempt);
            }
            message = "Chúc mừng! Bạn đã đạt yêu cầu và được xếp vào trình độ " + (assignedLevel != null ? assignedLevel.getName() : "");
        } else {
            if (isLowestLevel) {
                // RULE ABSOLUTE: If selectedLevel == LOWEST_LEVEL AND FAIL -> assign LOWEST_LEVEL & complete placement
                assignedLevel = quizLevel != null ? quizLevel : lowestLevel;
                placementCompleted = true;
                if (assignedLevel != null) {
                    currentUser.setCurrentExamType(examType);
                    currentUser.setCurrentLevel(assignedLevel);
                    usersRepository.save(currentUser);

                    attempt.setLevelAtAttempt(assignedLevel);
                    quizAttemptRepository.save(attempt);
                }
                message = "Bạn được xếp vào trình độ " + (assignedLevel != null ? assignedLevel.getName() : "Cơ bản (Dưới 500)")
                        + ". Đây là trình độ thấp nhất nên bạn có thể bắt đầu học ngay.";
            } else {
                // Higher level failed -> DO NOT assign higher level
                placementCompleted = false;
                int currentRank = getLevelRank(quizLevel, allLevels);
                for (int i = 0; i < currentRank - 1; i++) {
                    lowerLevels.add(mapper.map(allLevels.get(i), ProficiencyLevelDTO.class));
                }
                message = "Bạn chưa đạt yêu cầu cho trình độ " + (quizLevel != null ? quizLevel.getName() : "")
                        + ". Bạn có thể chọn làm bài kiểm tra ở trình độ thấp hơn hoặc ôn tập thêm.";
            }
        }

        PlacementTestResult result = new PlacementTestResult();
        result.setScorePercent(attempt.getScorePercent() != null ? attempt.getScorePercent() : BigDecimal.ZERO);
        result.setCorrectAnswers(correctAnswers);
        result.setTotalQuestions(totalQuestions);
        result.setCorrectRate(BigDecimal.valueOf(correctRate).setScale(4, RoundingMode.HALF_UP));
        result.setEquivalentCorrect30(BigDecimal.valueOf(equivalentCorrect30).setScale(4, RoundingMode.HALF_UP));
        result.setEstimatedToeicScore(estimatedToeicScore);
        result.setPassed(passed);
        result.setIsLowestLevel(isLowestLevel);
        result.setPlacementCompleted(placementCompleted);
        result.setExamType(mapper.map(examType, ExamTypeDTO.class));

        if (assignedLevel != null) {
            result.setAssignedLevel(mapper.map(assignedLevel, ProficiencyLevelDTO.class));
            result.setSuggestedLevel(mapper.map(assignedLevel, ProficiencyLevelDTO.class));
        } else if (quizLevel != null) {
            result.setSuggestedLevel(mapper.map(quizLevel, ProficiencyLevelDTO.class));
        }

        result.setLowerLevels(lowerLevels);
        result.setMessage(message);

        return result;
    }

    private double calculateEstimatedToeicScore(double eq) {
        if (eq >= 28.0) {
            if (eq > 30.0) eq = 30.0;
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
            if (eq < 0.0) eq = 0.0;
            return (eq / 9.0) * 199.0;
        }
    }

    public UsersResponse manualSelectLevel(Long examTypeId, Long levelId) {
        Users currentUser = getCurrentUser();

        ExamType examType = examTypeRepository.findById(examTypeId)
                .orElseThrow(() -> new NotFoundExeception("Exam type not found"));
        
        ProficiencyLevel level = levelRepository.findById(levelId)
                .orElseThrow(() -> new NotFoundExeception("Level not found"));

        if (!level.getExamType().getId().equals(examType.getId())) {
            throw new IllegalArgumentException("Level does not belong to the given exam type");
        }

        ProficiencyLevel currentLevel = currentUser.getCurrentLevel();
        if (currentLevel != null) {
            List<ProficiencyLevel> allLevels = levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(examType.getId());
            int currentRank = getLevelRank(currentLevel, allLevels);
            int targetRank = getLevelRank(level, allLevels);

            if (targetRank == currentRank) {
                return mapper.map(currentUser, UsersResponse.class);
            }
            if (targetRank > currentRank) {
                throw new IllegalArgumentException("Không thể tự chuyển lên trình độ cao hơn. Bạn cần làm bài kiểm tra nâng cấp.");
            }
        }

        currentUser.setCurrentExamType(examType);
        currentUser.setCurrentLevel(level);
        
        Users saved = usersRepository.save(currentUser);
        return mapper.map(saved, UsersResponse.class);
    }

    private int getLevelRank(ProficiencyLevel level, List<ProficiencyLevel> allLevels) {
        if (level == null || allLevels == null) return 0;
        for (int i = 0; i < allLevels.size(); i++) {
            if (allLevels.get(i).getId().equals(level.getId())) {
                return i + 1;
            }
        }
        return 0;
    }
}
