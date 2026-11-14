package com.lela.Quiz.timed;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Data
@Component
@ConfigurationProperties(prefix = "app.quiz.vocabulary")
public class TimedQuizProperties {
    private boolean multipleChoiceEnabled = true;
    private boolean matchingEnabled = true;
    private int questionSeconds = 20;
    private int screenSeconds = 60;
    private int questionCount = 20;
    private int screenCount = 5;
    private int toleranceSeconds = 2;
    private BigDecimal pairPoints = BigDecimal.ONE;
    private BigDecimal errorPenalty = new BigDecimal("0.25");
    private int xpPerMeaning = 1;
    private int xpPerPair = 2;
    private int maxXpPerAttempt = 40;
    // Explicit system seed owner, never the current learner's decks/progress.
    private String systemOwner = "admin";
}
