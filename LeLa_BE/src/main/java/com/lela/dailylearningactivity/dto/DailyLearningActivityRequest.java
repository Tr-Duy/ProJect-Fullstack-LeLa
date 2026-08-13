package com.lela.dailylearningactivity.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class DailyLearningActivityRequest {
    private Long userId;
    private LocalDate activityDate;
    private String timezone;
    private Integer reviewCount;
    private Integer cardsLearned;
    private Integer quizCount;
    private Integer minutesSpent;
    private Integer xpEarned;
    private Boolean goalMet;
}
