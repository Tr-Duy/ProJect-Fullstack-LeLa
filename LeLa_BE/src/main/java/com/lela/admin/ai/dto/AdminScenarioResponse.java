package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminScenarioResponse {
    private Long id;
    private Long topicId;
    private String topicName;
    private String title;
    private String slug;
    private Integer levelMin;
    private Integer levelMax;
    private String aiRole;
    private String userRole;
    private String description;
    private String systemPromptTemplate;
    private String fallbackLinesJson;
    private List<String> fallbackLines;
    private String openingLine;
    private Boolean isActive;
    private String status; // 'PUBLISHED', 'DRAFT'
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long sessionCount;
}
