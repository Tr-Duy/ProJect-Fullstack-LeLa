package com.lela.QuizQuestion.dto;

import com.lela.QuizQuestion.domain.QuestionType;
import lombok.Data;
import java.util.List;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionResponse;


@Data
public class QuizQuestionResponse {
    private Long id;
    private String questionText;
    private String questionImageUrl;
    private QuestionType questionType;
    private String explanation;
    private Integer points;
    private Integer questionTimeLimitSeconds;
    private Integer displayOrder;
    private Boolean isActive;
    private Long version;
    private List<QuizQuestionOptionResponse> options;

}
