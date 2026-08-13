package com.lela.srsreview.dto;

import com.lela.cardprogress.domain.ReviewableCardState;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter
@Setter
public class SrsReviewRequest {
    private Long reviewSessionId;
    private Long userId;
    private Long cardId;
    private String clientEventId;
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
    private LocalDateTime clientReviewedAt;
    private LocalDateTime serverReceivedAt;
    private LocalDateTime reviewedAt;
}
