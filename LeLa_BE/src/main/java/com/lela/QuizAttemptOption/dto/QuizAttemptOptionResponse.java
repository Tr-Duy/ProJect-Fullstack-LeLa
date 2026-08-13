package com.lela.QuizAttemptOption.dto;

import lombok.Data;
import java.time.LocalDateTime;


@Data
public class QuizAttemptOptionResponse {
    private Long id;
    private String optionKey;
    private String optionText;
    private String normalizedText;
    private Boolean isCorrect;
    private Integer displayOrder;
    private LocalDateTime createdAt;

}
