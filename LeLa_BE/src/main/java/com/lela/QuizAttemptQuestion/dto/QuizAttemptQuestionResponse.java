package com.lela.QuizAttemptQuestion.dto;

import com.lela.QuizQuestion.domain.QuestionType;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;


@Data
public class QuizAttemptQuestionResponse {
    private Long id;
    private String questionText;
    private String questionImageUrl;
    private QuestionType questionType;
    private String explanation;
    private Integer points;
    private Integer questionTimeLimitSeconds;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private List<QuizAttemptOptionResponse> options;
}
