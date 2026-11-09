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
    @DisplayName("Unit Test extractJson & parse: Trường hợp 1 - JSON sạch")
    void testParseCleanJson() {
        String cleanJson = """
                {
                  "intendedUtterance": "I want a cup of hot coffee",
                  "evaluation": {
                    "isGood": true,
                    "score": 90,
                    "status": "EXCELLENT",
                    "grammarCheck": "Ngữ pháp rất chuẩn xác",
                    "phoneticTip": "",
                    "suggestedImprovement": "I would like a cup of hot coffee, please."
                  },
                  "aiReply": "Sure thing! That will be ready in just a few minutes.",
                  "isCompleted": false
                }
                """;

        String extracted = VoiceAiService.extractJson(cleanJson);
        assertNotNull(extracted);
        assertTrue(extracted.startsWith("{") && extracted.endsWith("}"));

        VoiceAiService.TurnAiOutput output = aiService.parseAiOutput(cleanJson, "I want a cup of hot coffee");
        assertNotNull(output);
        assertEquals("I want a cup of hot coffee", output.getIntendedUtterance());
        assertEquals("Sure thing! That will be ready in just a few minutes.", output.getAiReply());
        assertNotNull(output.getEvaluation());
        assertEquals(90, output.getEvaluation().getScore());
        assertEquals("EXCELLENT", output.getEvaluation().getStatus());
    }

    @Test
    @DisplayName("Unit Test extractJson & parse: Trường hợp 2 - JSON bọc trong code fences ```json")
    void testParseJsonWithCodeFences() {
        String fencedJson = """
                ```json
                {
                  "intendedUtterance": "Can I have iced tea?",
                  "evaluation": {
                    "isGood": true,
                    "score": 80,
                    "status": "GOOD",
                    "grammarCheck": "Ngữ pháp tốt",
                    "phoneticTip": "",
                    "suggestedImprovement": "Could I please have an iced tea?"
                  },
                  "aiReply": "Of course! What size would you like?",
                  "isCompleted": false
                }
                ```
                """;

        String extracted = VoiceAiService.extractJson(fencedJson);
        assertNotNull(extracted);
        assertFalse(extracted.contains("```"));
        assertTrue(extracted.startsWith("{") && extracted.endsWith("}"));

        VoiceAiService.TurnAiOutput output = aiService.parseAiOutput(fencedJson, "Can I have iced tea?");
        assertNotNull(output);
        assertEquals("Of course! What size would you like?", output.getAiReply());
        assertNotNull(output.getEvaluation());
        assertEquals(80, output.getEvaluation().getScore());
    }

    @Test
    @DisplayName("Unit Test extractJson & parse: Trường hợp 3 - JSON thiếu field (thiếu evaluation, intendedUtterance...)")
    void testParseJsonMissingFields() {
        String missingFieldsJson = """
                {
                  "aiReply": "Certainly, let me prepare that for you."
                }
                """;

        String extracted = VoiceAiService.extractJson(missingFieldsJson);
        assertTrue(extracted.contains("\"aiReply\"") && extracted.startsWith("{") && extracted.endsWith("}"));

        // Parse không được ném exception, tự điền default values
        assertDoesNotThrow(() -> {
            VoiceAiService.TurnAiOutput output = aiService.parseAiOutput(missingFieldsJson, "original user words");
            assertNotNull(output);
            assertEquals("Certainly, let me prepare that for you.", output.getAiReply());
            assertEquals("original user words", output.getIntendedUtterance());
            assertNull(output.getEvaluation());
            assertFalse(output.getIsCompleted());
        });
    }

    @Test
    @DisplayName("Unit Test extractJson & parse: Trường hợp 4 - Chuỗi rác (HTML, error string...)")
    void testParseGarbageStringDoesNotThrow() {
        String garbage = "<html><body>503 Service Unavailable: Gateway Timeout</body></html>";

        assertDoesNotThrow(() -> {
            String extracted = VoiceAiService.extractJson(garbage);
            assertNotNull(extracted);

            VoiceAiService.TurnAiOutput output = aiService.parseAiOutput(garbage, "some transcript");
            assertNull(output); // Trả về null an toàn để service kích hoạt fallback, KHÔNG crash
        });
    }

    @Test
    @DisplayName("Gemini timeout: Tự động bắt TimeoutException và trả về fallback lines từ scenario")
    void testGeminiTimeoutFallback() {
        when(geminiClient.getPrimaryModel()).thenReturn("gemini-3.5-flash");
        when(geminiClient.getFallbackModel()).thenReturn("gemini-flash-lite-latest");

        CompletableFuture<HttpResponse<String>> timeoutFuture = new CompletableFuture<>() {
            @Override
            public HttpResponse<String> get(long timeout, TimeUnit unit) throws TimeoutException {
                throw new TimeoutException("Gemini timed out!");
            }
        };

        when(geminiClient.generateContent(anyString(), any())).thenReturn(timeoutFuture);

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
        assertTrue(output.getDegraded());
        assertNull(output.getEvaluation());
    }

    @Test
    @DisplayName("Gemini trả về HTTP lỗi: Tự động fallback an toàn không làm gián đoạn cuộc gọi")
    void testGeminiErrorFallback() {
        when(geminiClient.getPrimaryModel()).thenReturn("gemini-3.5-flash");
        when(geminiClient.getFallbackModel()).thenReturn("gemini-flash-lite-latest");

        CompletableFuture<HttpResponse<String>> failedFuture = CompletableFuture.failedFuture(new RuntimeException("503 Service Unavailable"));
        when(geminiClient.generateContent(anyString(), any())).thenReturn(failedFuture);

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
        assertTrue(output.getDegraded());
    }
}
