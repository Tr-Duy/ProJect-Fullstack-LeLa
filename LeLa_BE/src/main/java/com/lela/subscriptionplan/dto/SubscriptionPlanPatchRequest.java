package com.lela.subscriptionplan.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class SubscriptionPlanPatchRequest {
    private String planCode;
    private String name;
    private String description;
    private BigDecimal price;
    private String currencyCode;
    private String billingCycle;
    private Integer billingIntervalCount;
    private Integer maxOwnedDecks;
    private Integer maxCardsPerDeck;
    private Integer maxDailyReviews;
    private Boolean quizEnabled;
    private Boolean leaderboardEnabled;
    private Boolean offlineEnabled;
    private String featuresJson;
    private Boolean isActive;
    private Integer displayOrder;
}
