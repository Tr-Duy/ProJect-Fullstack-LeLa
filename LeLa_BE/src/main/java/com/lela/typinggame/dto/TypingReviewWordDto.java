package com.lela.typinggame.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingReviewWordDto {
    private Long flashcardId;
    private String word;
    private String meaning;
    private String phonetic;
    private String audioUrl;
    private String exampleText;
    private String exampleMeaning;
    private String result;
    private Integer wrongKeystrokes;
}
