package com.lela.dailylearningactivity.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Getter
@Setter
public class DailyLearningActivityResponse {
    private Long userId;
    private LocalDate activityDate;
    private String timezone;
    private Boolean active;
    private Integer currentStreak;
    private Integer reviewCount;
    private Integer cardsLearned;
    private Integer quizCount;
    private Integer minutesSpent;
    private Integer xpEarned;
    private Boolean goalMet;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long id;
}
