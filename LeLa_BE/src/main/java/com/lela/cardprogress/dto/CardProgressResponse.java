package com.lela.cardprogress.dto;

import com.lela.cardprogress.domain.CardProgressState;
import com.lela.cardprogress.domain.ReviewableCardState;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter
@Setter
public class CardProgressResponse {
    private Long userId;
    private Long cardId;
    private CardProgressState state;
    private ReviewableCardState suspendedFromState;
    private BigDecimal easeFactor;
    private Integer intervalDays;
    private Integer repetitions;
    private Integer lapseCount;
    private Integer learningStep;
    private Integer scheduledDays;
    private Integer elapsedDays;
    private LocalDateTime dueAt;
    private LocalDateTime lastReviewedAt;
    private Integer lastRating;
    private String algorithmVersion;
    private Integer totalReviews;
    private Integer correctCount;
    private Integer againCount;
    private Integer hardCount;
    private Integer goodCount;
    private Integer easyCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long id;
}
