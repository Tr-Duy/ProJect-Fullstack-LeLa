package com.lela.QuizAttempt.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class QuizSubmitRequest {
    @NotNull(message = "Answers list cannot be null")
    @Valid
    private List<QuizAnswerSubmitRequest> answers;
}
