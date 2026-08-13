package com.lela.srsreview.dto;

import com.lela.cardprogress.domain.ReviewableCardState;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ReviewEventDto {

    @NotNull(message = "Card ID không được để trống")
    private Long cardId;

    @NotBlank(message = "Client Event ID không được để trống")
    private String clientEventId;

    @NotNull(message = "Rating không được để trống")
    private Integer rating;

    private Integer responseMs;

    private ReviewableCardState previousState;
    private ReviewableCardState newState;
    private BigDecimal easeBefore;
    private BigDecimal easeAfter;
    private Integer intervalBefore;
    private Integer intervalAfter;
    private LocalDateTime dueBefore;
    private LocalDateTime dueAfter;
    private String algorithmVersion;
    private Integer xpAwarded;

    @NotNull(message = "Thời điểm ôn tập không được để trống")
    private LocalDateTime clientReviewedAt;
}