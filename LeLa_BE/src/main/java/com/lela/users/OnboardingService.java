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

        List<ProficiencyLevel> levels = levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(examType.getId());
        ProficiencyLevel matchedLevel = null;
        
        for (ProficiencyLevel level : levels) {
            if (estimatedToeicScore.compareTo(level.getMinScore()) >= 0 && estimatedToeicScore.compareTo(level.getMaxScore()) <= 0) {
                matchedLevel = level;
                break;
            }
        }

        if (matchedLevel == null && !levels.isEmpty()) {
            if (estimatedToeicScore.compareTo(levels.get(0).getMinScore()) < 0) {
                matchedLevel = levels.get(0);
            } else {
                matchedLevel = levels.get(levels.size() - 1);
            }
        }

        if (matchedLevel != null) {
            currentUser.setCurrentExamType(examType);
            currentUser.setCurrentLevel(matchedLevel);
            usersRepository.save(currentUser);

            attempt.setLevelAtAttempt(matchedLevel);
            quizAttemptRepository.save(attempt);
        }

        PlacementTestResult result = new PlacementTestResult();
        result.setScorePercent(attempt.getScorePercent() != null ? attempt.getScorePercent() : BigDecimal.ZERO);
        result.setCorrectAnswers(correctAnswers);
        result.setTotalQuestions(totalQuestions);
        result.setCorrectRate(BigDecimal.valueOf(correctRate).setScale(4, RoundingMode.HALF_UP));
        result.setEquivalentCorrect30(BigDecimal.valueOf(equivalentCorrect30).setScale(4, RoundingMode.HALF_UP));
        result.setEstimatedToeicScore(estimatedToeicScore);
        
        result.setExamType(mapper.map(examType, ExamTypeDTO.class));
        if (matchedLevel != null) {
            result.setSuggestedLevel(mapper.map(matchedLevel, ProficiencyLevelDTO.class));
            result.setMessage("Chúc mừng! Trình độ của bạn là " + matchedLevel.getName());
        } else {
            result.setMessage("Không xác định được trình độ.");
        }

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
