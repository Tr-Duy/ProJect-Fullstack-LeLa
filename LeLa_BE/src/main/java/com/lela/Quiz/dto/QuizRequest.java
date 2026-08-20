package com.lela.Quiz.dto;

import com.lela.Quiz.domain.QuizType;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizRequest {

    private Long deckId;

    @NotNull(message = "createdById không được để trống")
    private Long createdById;

    private Long updatedById;

    @NotBlank(message = "Quiz code không được để trống")
    @Size(max = 50, message = "Quiz code tối đa 50 ký tự")
    private String quizCode;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    private String description;

    @Builder.Default
    private QuizType quizType = QuizType.MULTIPLE_CHOICE;

    @Builder.Default
    private com.lela.Quiz.domain.QuizCategory quizCategory = com.lela.Quiz.domain.QuizCategory.NORMAL;

    private com.lela.Quiz.domain.QuizDifficulty difficulty;

    private Long examTypeId;
    
    private Long levelId;

    @Min(value = 1, message = "Thời gian tối thiểu 1 giây")
    private Integer timeLimitSeconds;

    @Min(value = 0, message = "Điểm tối thiểu 0")
    @Max(value = 100, message = "Điểm tối đa 100")
    @Builder.Default
    private java.math.BigDecimal passScore = new java.math.BigDecimal("80.00");

    @Min(value = 1, message = "Số lần làm bài tối thiểu 1")
    @Builder.Default
    private Integer maxAttempts = 3;

    @Builder.Default
    private Boolean shuffleQuestions = true;

    @Builder.Default
    private Boolean shuffleOptions = true;

    @Builder.Default
    private Boolean isActive = true;

    private List<QuizQuestionRequest> questions;
}