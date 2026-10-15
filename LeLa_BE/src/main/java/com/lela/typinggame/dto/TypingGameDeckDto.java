package com.lela.typinggame.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingGameDeckDto {
    private Long deckId;
    private String title;
    private String description;
    private String slug;
    private String cardColor;
    private Integer totalCards;
    private Integer totalStages;
    private Boolean requiresPro;
    private Boolean isLocked;
    private Integer bestScoreEasy;
    private Integer bestScoreHard;
}
