package com.lela.QuizAnswer.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuizAnswerRequest {
    @NotNull(message = "Attempt ID is required")
    private Long attemptId;

    @NotNull(message = "Attempt question ID is required")
    private Long attemptQuestionId;

    private Long selectedAttemptOptionId;

    @Size(max = 2000, message = "Answer text must not exceed 2000 characters")
    private String answerText;

    @Size(max = 2000, message = "Normalized answer text must not exceed 2000 characters")
    private String normalizedAnswerText;

    private Boolean isCorrect;

    @Min(value = 0, message = "Points awarded must be >= 0")
    private Integer pointsAwarded;

    @Min(value = 0, message = "Time taken must be >= 0")
    private Integer timeTakenSeconds;

    private LocalDateTime answeredAt;
}