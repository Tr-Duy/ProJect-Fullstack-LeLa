package com.lela.admin.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminScenarioRequest {
    private Long topicId;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String slug;

    @Min(value = 100, message = "Level tối thiểu phải từ 100")
    @Max(value = 1000, message = "Level tối đa không vượt quá 1000")
    @Builder.Default
    private Integer levelMin = 100;

    @Min(value = 100, message = "Level tối thiểu phải từ 100")
    @Max(value = 1000, message = "Level tối đa không vượt quá 1000")
    @Builder.Default
    private Integer levelMax = 1000;

    private String aiRole;
    private String userRole;
    private String description;

    @NotBlank(message = "System prompt template không được để trống")
    private String systemPromptTemplate;

    private String fallbackLinesJson;
    private List<String> fallbackLines;

    private String openingLine;

    @Builder.Default
    private Boolean isActive = true;

    private String status; // 'PUBLISHED', 'DRAFT'
}
