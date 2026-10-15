package com.lela.typinggame.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingWordDto {
    private Long flashcardId;
    private String word;
    private String meaning;
    private String phonetic;
    private String audioUrl;
    private Integer wordLength;
    private Boolean isHeartWord;
}
