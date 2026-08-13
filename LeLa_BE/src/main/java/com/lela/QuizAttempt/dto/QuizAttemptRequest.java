package com.lela.QuizAttempt.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class QuizAttemptRequest {

    @NotNull(message = "Quiz ID is required")
    private Long quizId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Attempt number is required")
    @Min(value = 1, message = "Attempt number must be >= 1")
    private Integer attemptNumber;

    @Size(max = 100, message = "Start idempotency key must not exceed 100 characters")
    private String startIdempotencyKey;
}
