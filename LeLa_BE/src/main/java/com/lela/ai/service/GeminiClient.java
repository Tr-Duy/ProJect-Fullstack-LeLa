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
        return streamGenerateContent(config.getPrimaryModel(),request);
    }

    public CompletableFuture<HttpResponse<java.io.InputStream>> streamGenerateContent(String model, GeminiRequest request) {
        try {
            String requestBody = objectMapper.writeValueAsString(request);
            String url = config.getGenerateContentUrl(model).replace(":generateContent", ":streamGenerateContent") + "?alt=sse";
            
            log.info("====== GEMINI API REQUEST ======");
            log.info("URL: {}", url);
            log.debug("Gemini request body bytes: {}", requestBody.length());

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", config.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            return httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.ofInputStream());
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

            long started=System.nanoTime();
            return httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.ofInputStream()).thenApply(response -> {
                try (var body=response.body();var bytes=new java.io.ByteArrayOutputStream()) {
                    byte[] buffer=new byte[8192];int read;long first=0;
                    while ((read=body.read(buffer))!=-1) {
                        if (first==0) first=System.nanoTime();bytes.write(buffer,0,read);
                    }
                    return new MeasuredResponse(response,bytes.toString(java.nio.charset.StandardCharsets.UTF_8),
                            first==0?0:(first-started)/1_000_000.0,(System.nanoTime()-started)/1_000_000.0);
                } catch (java.io.IOException failure) {throw new java.util.concurrent.CompletionException(failure);}
            });
        } catch (Exception e) {
            log.error("Failed to prepare Gemini non-streaming request for model {}", model, e);
            throw new AiException("Failed to prepare AI non-streaming request", e);
        }
    }

    public String getPrimaryModel() {
        return config.getPrimaryModel();
    }

    public record MeasuredResponse(HttpResponse<java.io.InputStream> original,String body,
            double firstByteMs,double totalMs) implements HttpResponse<String> {
        public int statusCode(){return original.statusCode();}
        public HttpRequest request(){return original.request();}
        public java.util.Optional<HttpResponse<String>> previousResponse(){return java.util.Optional.empty();}
        public java.net.http.HttpHeaders headers(){return original.headers();}
        public java.util.Optional<javax.net.ssl.SSLSession> sslSession(){return original.sslSession();}
        public URI uri(){return original.uri();}
        public HttpClient.Version version(){return original.version();}
    }

    public String getFallbackModel() {
        return config.getFallbackModel();
    }

    public String getModelNameSafe() {
        return config.getPrimaryModel();
    }
}
