package com.lela.Quiz.decktest;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Data
@Component
@ConfigurationProperties(prefix = "app.quiz.deck-test")
public class DeckTestProperties {
    private int minValidCards = 8;
    private double requiredLearnedRatio = 0.50;
    private double passScorePercent = 70.0;
    private int mcQuestionCount = 10;
    private int matchingScreensCount = 2;
    private int mcQuestionSeconds = 20;
    private int matchingScreenSeconds = 60;
    private int toleranceSeconds = 2;
    private BigDecimal pairPoints = BigDecimal.ONE;
    private BigDecimal errorPenalty = new BigDecimal("0.25");
    private int xpPerMeaning = 1;
    private int xpPerPair = 2;
    private int maxXpPerAttempt = 40;
    private double repeatAttemptXpDiscount = 0.50;
    private String systemOwner = "admin";
}
