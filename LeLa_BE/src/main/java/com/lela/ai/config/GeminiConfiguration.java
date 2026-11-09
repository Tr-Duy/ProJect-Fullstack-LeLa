package com.lela.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiConfiguration {
    private String apiKey;
    private String primaryModel = "gemini-3.5-flash";
    private String fallbackModel = "gemini-flash-lite-latest";
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

    public GeminiConfiguration() {
    }

    public String getGenerateContentUrl(String model) {
        String effectiveModel = (model != null && !model.isBlank()) ? model : primaryModel;
        return baseUrl + "/" + effectiveModel + ":generateContent?key=" + apiKey;
    }

    public String getApiUrl() {
        return getGenerateContentUrl(primaryModel);
    }
}
