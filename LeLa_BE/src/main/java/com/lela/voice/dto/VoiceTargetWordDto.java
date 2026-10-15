package com.lela.voice.dto;

public record VoiceTargetWordDto(
        Long flashcardId,
        String word,
        String meaning,
        String phonetic,
        boolean usedCorrectly,
        String status
) {}
