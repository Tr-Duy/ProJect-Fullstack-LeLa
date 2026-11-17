package com.lela.Quiz.decktest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckTestStatusResponse {
    private Long deckId;
    private String deckCode;
    private String deckTitle;
    private String deckLevelName;
    private boolean enrolled;
    private boolean hasEnoughCards;
    private int totalValidCards;
    private int learnedCards;
    private int requiredLearnedCards;
    private int minValidCardsRequired;
    private boolean eligible;
    private String lockReason;
    private boolean hasPassed;
    private BigDecimal bestScore;
    private LocalDateTime lastAttemptAt;
}
