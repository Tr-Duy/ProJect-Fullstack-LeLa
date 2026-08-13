package com.lela.QuizAttemptQuestion.dto;

import com.lela.QuizQuestion.domain.QuestionType;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class QuizAttemptQuestionRequest {

    @NotNull(message = "Attempt ID is required")
    private Long attemptId;

    private Long sourceQuestionId;

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
}
