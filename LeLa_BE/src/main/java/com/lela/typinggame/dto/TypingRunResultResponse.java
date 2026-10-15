package com.lela.typinggame.dto;

import com.lela.typinggame.domain.TypingGameMode;
import com.lela.typinggame.domain.TypingGameRunStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingRunResultResponse {
    private String publicId;
    private Long deckId;
    private String deckTitle;
    private TypingGameMode mode;
    private TypingGameRunStatus status;
    private Integer score;
    private Integer stageReached;
    private Integer totalStages;
    private Integer wordsCleared;
    private Integer wordsMissed;
    private BigDecimal accuracy;
    private BigDecimal wpm;
    private Integer maxCombo;
    private Integer xpEarned;
    private Integer dailyXpRemaining;
    private Boolean isNewHighScore;
    private List<TypingReviewWordDto> reviewWords;
}
