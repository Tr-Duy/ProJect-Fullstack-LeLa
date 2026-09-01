package com.lela.users.dto;

import lombok.Data;
import java.math.BigDecimal;
import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;

@Data
public class PlacementTestResult {
    private BigDecimal scorePercent;
    private Integer correctAnswers;
    private Integer totalQuestions;
    private BigDecimal correctRate;
    private BigDecimal equivalentCorrect30;
    private BigDecimal estimatedToeicScore;
    
    private ExamTypeDTO examType;
    private ProficiencyLevelDTO suggestedLevel;
    private ProficiencyLevelDTO assignedLevel;
    private Boolean isLowestLevel;
    private Boolean passed;
    private Boolean placementCompleted;
    private java.util.List<ProficiencyLevelDTO> lowerLevels;
    private String message;
}
