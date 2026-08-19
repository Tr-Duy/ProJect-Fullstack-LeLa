package com.lela.finallevelassessment.dto;

import com.lela.Quiz.dto.QuizResponse;
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
public class FinalLevelAssessmentResponse {
    private boolean isEligible;
    private Long currentLevelId;
    private String currentLevelName;
    private Integer totalDecks;
    private Integer completedDecks;
    private Integer cycleNumber;
    private String cycleStatus; // IN_PROGRESS, PASSED, REQUIRES_REVIEW
    private LocalDateTime cooldownUntil;
    private Long cooldownRemainingSeconds;
    private String lockMessage;
    private List<QuizResponse> quizzes;
    private List<DeckEligibilityItem> decks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeckEligibilityItem {
        private Long id;
        private String deckCode;
        private String title;
        private Integer totalCards;
        private Integer masteredCards;
        private boolean isCompleted;
    }
}
