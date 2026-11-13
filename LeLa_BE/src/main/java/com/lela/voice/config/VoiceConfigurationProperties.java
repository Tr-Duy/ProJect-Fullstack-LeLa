package com.lela.voice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.voice")
public class VoiceConfigurationProperties {
    private String timezone = "Asia/Ho_Chi_Minh";
    private int maxSessionsPerDay = 3;
    private int maxDurationSeconds = 300;
    private int maxValidTurns = 10;
    private int idleTimeoutSeconds = 360; // 300 + 60
    private int dailyXpCap = 150;
    private int xpPerCompletedSession = 50;
    private int minValidTurnsForXp = 3;
    private int xpPerValidTurn = 2;
    private int maxXpFromTurns = 20;
    private int xpPerTargetWord = 3;
    private int maxXpFromTargetWords = 15;
    private double minSttConfidence = 0.50;
    private double maxOffWhitelistRatio = 0.15; // Ngưỡng từ ngoài whitelist (15% tối ưu khi kho foundation đạt 2,480+ từ)
    private int maxRetriesGemini = 1;
    private int geminiCallTimeoutSeconds = 4;
    private int totalTurnTimeoutSeconds = 8;
    private int fallbackReservedSeconds = 3;
    private int responseReservedMs = 200;
    private int minPrimaryAttemptMs = 2500;
    private int retryDelayMs = 400;
    private String turnModel;
    private String fallbackModel;
    private String summaryModel;
    private int summaryTimeoutSeconds = 12;
    private int autoCommitSilenceMs = 1200;
    private int incompleteExtraMs = 800;
    private int hintAfterSilenceMs = 8000;
    // Disabled until the paired live experiment demonstrates no feedback regression.
    private Integer thinkingBudget;
}
