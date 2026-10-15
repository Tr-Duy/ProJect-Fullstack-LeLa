package com.lela.voice.dto;

public record ConversationScenarioDto(
        Long id,
        String title,
        String slug,
        Integer levelMin,
        Integer levelMax,
        String aiRole,
        String userRole,
        String description,
        String openingLine,
        Boolean isActive
) {}
