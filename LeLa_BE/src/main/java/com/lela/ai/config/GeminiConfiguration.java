package com.lela.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiConfiguration {
    private String apiKey;
    private String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent";
}
