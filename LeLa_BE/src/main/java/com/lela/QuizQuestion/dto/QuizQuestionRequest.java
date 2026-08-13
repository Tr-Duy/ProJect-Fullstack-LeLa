package com.lela.QuizQuestion.dto;

import com.lela.QuizQuestion.domain.QuestionType;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import jakarta.validation.constraints.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuizQuestionRequest {
    private Long id;
    @NotNull(message = "Quiz ID is required")
    private Long quizId;

    private Long sourceCardId;
    @NotBlank(message = "Question text is required")
    @Size(max = 2000, message = "Question text must not exceed 2000 characters")
    private String questionText;

    @Size(max = 500, message = "Question image URL must not exceed 500 characters")
    private String questionImageUrl;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @Size(max = 2000, message = "Explanation must not exceed 2000 characters")
    private String explanation;

    @NotNull(message = "Points is required")
    @Min(value = 1, message = "Points must be >= 1")
    private Integer points;

    @Min(value = 1, message = "Question time limit must be >= 1 second")
    private Integer questionTimeLimitSeconds;

    @NotNull(message = "Display order is required")
    @Min(value = 0, message = "Display order must be >= 0")
    private Integer displayOrder;

    @NotNull(message = "isActive is required")
    private Boolean isActive;

    private Long version;
    
    private List<QuizQuestionOptionRequest> options;
}