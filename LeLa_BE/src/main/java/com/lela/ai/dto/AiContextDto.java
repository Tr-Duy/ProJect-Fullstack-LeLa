package com.lela.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiContextDto {
    private UserInfo user;
    private LevelInfo level;
    private TodayStats today;
    private LearningProgress learning;
    private ExamStatus exam;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String username;
        private String fullName;
        private Integer totalXp;
        private Integer streakDays;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LevelInfo {
        private String name;
        private String scoreRange;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TodayStats {
        private Integer xpEarned;
        private Integer cardsLearned;
        private Integer quizCount;
        private Integer minutesSpent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningProgress {
        private Integer completedDecks;
        private Integer totalDecksInLevel;
        private Integer masteredCards;
        private String currentActiveDeck;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamStatus {
        private Boolean isEligibleForExam;
        private Integer requiredDecks;
        private Integer recentScorePercent;
        private String recentExamResult; // "PASSED" | "FAILED" | "NOT_TAKEN"
    }
}
