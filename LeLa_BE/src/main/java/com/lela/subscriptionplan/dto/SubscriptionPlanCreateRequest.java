package com.lela.subscriptionplan.dto;

import java.math.BigDecimal;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
public class SubscriptionPlanCreateRequest {
    @NotBlank
    private String planCode;
    @NotBlank
    private String name;
    @NotBlank
    private String description;
    @NotNull
    private BigDecimal price;
    private String currencyCode;
    @NotBlank
    private String billingCycle;
    @NotNull
    private Integer billingIntervalCount;
    @NotNull
    private Integer maxOwnedDecks;
    @NotNull
    private Integer maxCardsPerDeck;
    @NotNull
    private Integer maxDailyReviews;
    @NotNull
    private Boolean quizEnabled;
    @NotNull
    private Boolean leaderboardEnabled;
    @NotNull
    private Boolean offlineEnabled;
    private String featuresJson;
    @NotNull
    private Boolean isActive;
    private Integer displayOrder;
}