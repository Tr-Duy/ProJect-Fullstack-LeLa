package com.lela.Quiz.dto;


import com.lela.Quiz.domain.QuizType;
import com.lela.QuizQuestion.dto.QuizQuestionResponse;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {

    private Long id;
    private Long deckId;
    private String quizCode;
    private String title;
    private String description;
    private QuizType quizType;
    private com.lela.Quiz.domain.QuizCategory quizCategory;
    private com.lela.Quiz.domain.QuizDifficulty difficulty;
    private java.math.BigDecimal passScore;
    private Long examTypeId;
    private Long levelId;
    private Integer timeLimitSeconds;
    private Integer maxAttempts;
    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private Integer totalQuestions;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
    private Long version;
    private List<QuizQuestionResponse> questions;
    private Boolean isLocked;
    private String lockedUntil;
    private String lockReason;
    private String attemptStatus;
    private Long remainingLockSeconds;
}
