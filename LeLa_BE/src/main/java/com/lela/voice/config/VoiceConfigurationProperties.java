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
    private double minSttConfidence = 0.50;
    private double maxOffWhitelistRatio = 0.15; // Ngưỡng từ ngoài whitelist (15% tối ưu khi kho foundation đạt 2,480+ từ)
    private int maxRetriesGemini = 2;
    private int geminiCallTimeoutSeconds = 5;
    private int totalTurnTimeoutSeconds = 15;
}
