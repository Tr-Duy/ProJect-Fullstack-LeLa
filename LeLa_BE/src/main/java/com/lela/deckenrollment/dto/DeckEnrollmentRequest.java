package com.lela.deckenrollment.dto;

import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DeckEnrollmentRequest {
    private Long userId;
    private Long deckId;
    private DeckEnrollmentStatus status;
    private LocalDateTime enrolledAt;
    private LocalDateTime pausedAt;
    private LocalDateTime completedAt;
    private LocalDateTime droppedAt;
    private LocalDateTime lastStudiedAt;
    private LocalDateTime nextReviewAt;
    private Integer masteredCards;
    private String note;
}
