package com.lela.QuizQuestionOption.dto;

import lombok.Data;


@Data
public class QuizQuestionOptionResponse {
    private Long id;
    private String optionKey;
    private String optionText;
    private String normalizedText;
    private Boolean isCorrect;
    private Integer displayOrder;

}
