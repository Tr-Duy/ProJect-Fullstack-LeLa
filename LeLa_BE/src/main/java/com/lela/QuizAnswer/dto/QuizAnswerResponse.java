package com.lela.QuizAnswer.dto;

import lombok.Data;
import java.time.LocalDateTime;


@Data
public class QuizAnswerResponse {
    private Long id;
    private String answerText;
    private String normalizedAnswerText;
    private Boolean isCorrect;
    private Integer pointsAwarded;
    private Integer timeTakenSeconds;
    private LocalDateTime answeredAt;

}
