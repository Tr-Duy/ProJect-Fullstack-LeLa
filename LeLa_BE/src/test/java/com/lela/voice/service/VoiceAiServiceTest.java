package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.service.GeminiClient;
import com.lela.ai.dto.GeminiResponse;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoiceAiServiceTest {

    @Mock
    private GeminiClient geminiClient;
    @Mock
    private VocabularyWhitelistService whitelistService;

    private VoiceConfigurationProperties props;
    private ObjectMapper objectMapper;
    private VoiceAiService aiService;

    private ConversationScenario scenario;

    @BeforeEach
    void setUp() {
        props = new VoiceConfigurationProperties();
        props.setGeminiCallTimeoutSeconds(1); // 1s for fast test
        props.setTotalTurnTimeoutSeconds(5);
        props.setMaxRetriesGemini(1);
        props.setMaxOffWhitelistRatio(0.20);

        objectMapper = new ObjectMapper();
        aiService = new VoiceAiService(geminiClient, objectMapper, props, whitelistService);

        scenario = ConversationScenario.builder()
                .id(1L)
                .slug("order-coffee")
                .openingLine("Hello, what would you like?")
                .fallbackLinesJson("[\"Welcome to our coffee shop! What can I get for you?\"]")
                .build();
    }

    @Test
    @DisplayName("Gemini timeout: Tự động bắt TimeoutException và trả về fallback lines từ scenario")
    void testGeminiTimeoutFallback() {
        CompletableFuture<HttpResponse<String>> timeoutFuture = new CompletableFuture<>() {
            @Override
            public HttpResponse<String> get(long timeout, TimeUnit unit) throws TimeoutException {
                throw new TimeoutException("Gemini timed out!");
            }
        };

        when(geminiClient.generateContent(any())).thenReturn(timeoutFuture);

        VoiceAiService.TurnAiOutput output = aiService.generateTurnResponse(
                scenario,
                300,
                "I would like a latte please",
                List.of("coffee", "latte"),
                Set.of("coffee", "latte", "water", "tea"),
                Collections.emptyList()
        );

        assertNotNull(output);
        assertNotNull(output.getAiReply());
        assertTrue(output.getAiReply().contains("coffee") || output.getAiReply().contains("What can I get"));
    }

    @Test
    @DisplayName("Gemini trả về HTTP lỗi: Tự động fallback an toàn không làm gián đoạn cuộc gọi")
    void testGeminiErrorFallback() {
        CompletableFuture<HttpResponse<String>> failedFuture = CompletableFuture.failedFuture(new RuntimeException("503 Service Unavailable"));
        when(geminiClient.generateContent(any())).thenReturn(failedFuture);

        VoiceAiService.TurnAiOutput output = aiService.generateTurnResponse(
                scenario,
                300,
                "Hi there",
                List.of("coffee"),
                Set.of("coffee"),
                Collections.emptyList()
        );

        assertNotNull(output);
        assertNotNull(output.getAiReply());
    }
}
