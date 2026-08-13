package com.lela.QuizAttempt.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizAnswerSubmitRequest {
    @NotNull(message = "Attempt question ID is required")
    private Long attemptQuestionId;

    private Long selectedAttemptOptionId;

    private String answerText;
}
