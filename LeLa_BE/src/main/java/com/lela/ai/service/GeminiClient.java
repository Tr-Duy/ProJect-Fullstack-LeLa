package com.lela.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.config.GeminiConfiguration;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.exception.AiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiClient {

    private final GeminiConfiguration config;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().version(HttpClient.Version.HTTP_2).build();

    /**
     * Sends request to Gemini and returns a CompletableFuture of HttpResponse stream.
     */
    public CompletableFuture<HttpResponse<java.io.InputStream>> streamGenerateContent(GeminiRequest request) {
        try {
            String requestBody = objectMapper.writeValueAsString(request);
            String url = config.getApiUrl().replace(":generateContent", ":streamGenerateContent") + "?alt=sse";
            
            log.info("====== GEMINI API REQUEST ======");
            log.info("URL: {}", url);
            log.info("Request Body: {}", requestBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", config.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            return httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.ofInputStream())
                    .thenApply(response -> {
                        log.info("====== GEMINI API RESPONSE ======");
                        log.info("Status Code: {}", response.statusCode());
                        if (response.statusCode() >= 400) {
                            try {
                                String errorBody = new String(response.body().readAllBytes());
                                log.error("Gemini Error Body: {}", errorBody.replace(config.getApiKey(), "[REDACTED]"));
                                throw new AiException("Gemini returned " + response.statusCode());
                            } catch (Exception e) {
                                log.error("Failed to read error body", e);
                            }
                        }
                        return response;
                    });
        } catch (Exception e) {
            log.error("Failed to prepare Gemini request", e);
            throw new AiException("Failed to prepare AI request", e);
        }
    }

    public CompletableFuture<HttpResponse<String>> generateContent(GeminiRequest request) {
        return generateContent(config.getPrimaryModel(), request);
    }

    public CompletableFuture<HttpResponse<String>> generateContent(String model, GeminiRequest request) {
        try {
            String requestBody = objectMapper.writeValueAsString(request);
            String url = config.getGenerateContentUrl(model);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", config.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            return httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.error("Failed to prepare Gemini non-streaming request for model {}", model, e);
            throw new AiException("Failed to prepare AI non-streaming request", e);
        }
    }

    public String getPrimaryModel() {
        return config.getPrimaryModel();
    }

    public String getFallbackModel() {
        return config.getFallbackModel();
    }

    public String getModelNameSafe() {
        return config.getPrimaryModel();
    }
}
