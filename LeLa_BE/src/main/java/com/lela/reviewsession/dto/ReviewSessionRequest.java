package com.lela.reviewsession.dto;

import com.lela.reviewsession.domain.ReviewSessionStatus;
import com.lela.reviewsession.domain.ReviewSessionType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class ReviewSessionRequest {
    private String publicId;
    private Long userId;
    private Long deckId;
    private ReviewSessionType sessionType;
    private ReviewSessionStatus status;
    private String deviceId;
    private Boolean offlineMode;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime abandonedAt;
}
