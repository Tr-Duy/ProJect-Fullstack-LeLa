package com.lela.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiContextDto {
    private String fullName;
    private String cefrLevel;
    private Long xp;
    private Integer streak;
    private Integer dailyGoalCards;
    
    // Detailed learning stats
    private List<String> weakVocabulary;
    private List<String> weakGrammar;
    private Integer totalVocabLearned;
    private Integer totalQuizzesCompleted;
    private Double averageQuizScore;
    private Map<String, String> recentActivities;
}
