package com.lela.typinggame.dto;

import com.lela.typinggame.domain.TypingGameMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingRunResponse {
    private String publicId;
    private Long deckId;
    private String deckTitle;
    private TypingGameMode mode;
    private Integer totalStages;
    private Integer livesLeft;
    private Integer currentStage;
    private Integer currentCombo;
    private Integer score;
    private Long spawnIntervalMs;
    private Double baseSpeed;
    private List<TypingWordDto> words;
}
