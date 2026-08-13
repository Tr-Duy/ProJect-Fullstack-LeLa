package com.lela.QuizAttemptOption.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class QuizAttemptOptionRequest {

    @NotNull(message = "Attempt question ID is required")
    private Long attemptQuestionId;

    private Long sourceOptionId;

    @NotBlank(message = "Option key is required")
    @Size(max = 10, message = "Option key must not exceed 10 characters")
    private String optionKey;

    @NotBlank(message = "Option text is required")
    @Size(max = 1000, message = "Option text must not exceed 1000 characters")
    private String optionText;

    @Size(max = 1000, message = "Normalized text must not exceed 1000 characters")
    private String normalizedText;

    @NotNull(message = "isCorrect is required")
    private Boolean isCorrect;

    @NotNull(message = "Display order is required")
    @Min(value = 0, message = "Display order must be >= 0")
    private Integer displayOrder;
}
