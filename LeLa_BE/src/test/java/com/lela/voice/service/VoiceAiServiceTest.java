package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.dto.GeminiResponse;
import com.lela.ai.service.GeminiClient;
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
import static org.mockito.ArgumentMatchers.eq;
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
    void usageComesFromGeminiAndFeedbackHasExactlyThreeSuggestions() throws Exception {
        when(geminiClient.getPrimaryModel()).thenReturn("primary");
        when(geminiClient.getFallbackModel()).thenReturn("fallback");
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("""
                {"usageMetadata":{"totalTokenCount":1234},"candidates":[{"content":{"parts":[{"text":"{\\"aiReply\\":\\"Hot or iced?\\",\\"feedbackLine\\":\\"Câu rõ ràng.\\",\\"suggestions\\":[{\\"difficulty\\":\\"EASY\\",\\"text\\":\\"Hot, please.\\"},{\\"difficulty\\":\\"MEDIUM\\",\\"text\\":\\"I would like it hot.\\"},{\\"difficulty\\":\\"CHALLENGE\\",\\"text\\":\\"Could you make it hot with milk?\\"}]}"}]}}]}
                """);
        when(geminiClient.generateContent(eq("primary"), any())).thenReturn(CompletableFuture.completedFuture(response));
        var output = aiService.generateTurnResponse(scenario, 200, "Coffee please", List.of(), Set.of(), List.of());
        assertEquals(1234, output.getTokensUsed());
        assertEquals(3, output.getSuggestions().size());
        assertEquals("Hot, please.", output.getSuggestions().get(0).text());
        var request = org.mockito.ArgumentCaptor.forClass(GeminiRequest.class);
        verify(geminiClient).generateContent(eq("primary"), request.capture());
        assertNull(request.getValue().getGenerationConfig().getThinkingConfig());
        assertTrue(request.getValue().getContents().get(0).getParts().get(0).getText().contains("200"));
    }

    @Test
    void slowPrimaryIsCancelledAndFallbackReceivesAFullCallBudget() {
        props.setGeminiCallTimeoutSeconds(1);
        props.setTotalTurnTimeoutSeconds(3);
        when(geminiClient.getPrimaryModel()).thenReturn("primary");
        when(geminiClient.getFallbackModel()).thenReturn("fallback");
        var timedOut = new CompletableFuture<HttpResponse<String>>() {
            @Override public HttpResponse<String> get(long timeout, TimeUnit unit) throws TimeoutException {
                assertEquals(1000, unit.toMillis(timeout));
                try { Thread.sleep(1100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                throw new TimeoutException();
            }
        };
        when(geminiClient.generateContent(eq("primary"), any())).thenReturn(timedOut);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"aiReply\":\"Fallback works\",\"usageMetadata\":{\"totalTokenCount\":17}}");
        when(geminiClient.generateContent(eq("fallback"), any())).thenReturn(CompletableFuture.completedFuture(response));
        var result = aiService.generateTurnResponse(scenario, 200, "Coffee", List.of(), Set.of(), List.of());
        assertFalse(result.getDegraded());
        assertTrue(timedOut.isCancelled());
        verify(geminiClient, times(1)).generateContent(eq("primary"), any());
        verify(geminiClient, times(1)).generateContent(eq("fallback"), any());
        assertEquals(17, result.getTokensUsed());
    }

    @Test
    @DisplayName("Unit Test extractJson & parse: Trường hợp 1 - JSON sạch không có suggestedImprovement (EXCELLENT >= 85)")
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
                    "suggestedImprovement": ""
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
    @DisplayName("Unit Test scoring rule: Nếu hasError == true thì score tối đa 84 và status GOOD")
    void testScoreCappedAt84WhenHasErrorTrue() {
        String json = """
                {
                  "intendedUtterance": "I likes hot coffee",
                  "evaluation": {
                    "isGood": false,
                    "hasError": true,
                    "score": 92,
                    "status": "EXCELLENT",
                    "grammarCheck": "Lỗi chia động từ likes với chủ ngữ I",
                    "phoneticTip": "",
                    "suggestedImprovement": "I like hot coffee."
                  },
                  "aiReply": "Sure thing!",
                  "isCompleted": false
                }
                """;
        VoiceAiService.TurnAiOutput output = aiService.parseAiOutput(json, "I likes hot coffee");
        assertNotNull(output);
        assertNotNull(output.getEvaluation());
        assertEquals(84, output.getEvaluation().getScore(), "Score phải bị giới hạn tối đa 84 khi hasError == true");
        assertEquals("GOOD", output.getEvaluation().getStatus(), "Status phải là GOOD khi score = 84");
    }

    @Test
    @DisplayName("Unit Test scoring rule: Nếu hasError == false nhưng có suggestedImprovement (cách nói tự nhiên hơn) thì giữ điểm EXCELLENT >= 85")
    void testScoreRemainsExcellentWhenHasErrorFalse() {
        String json = """
                {
                  "intendedUtterance": "I want hot coffee",
                  "evaluation": {
                    "isGood": true,
                    "hasError": false,
                    "score": 92,
                    "status": "EXCELLENT",
                    "grammarCheck": "Câu đúng ngữ pháp",
                    "phoneticTip": "",
                    "suggestedImprovement": "I'd like a hot coffee, please."
                  },
                  "aiReply": "Sure thing!",
                  "isCompleted": false
                }
                """;
        VoiceAiService.TurnAiOutput output = aiService.parseAiOutput(json, "I want hot coffee");
        assertNotNull(output);
        assertNotNull(output.getEvaluation());
        assertEquals(92, output.getEvaluation().getScore(), "Score phải được giữ 92 khi hasError == false");
        assertEquals("EXCELLENT", output.getEvaluation().getStatus(), "Status phải là EXCELLENT khi score >= 85 và hasError == false");
    }

    @Test
    @DisplayName("STT context test (a): transcript 'I like horse coffee', alternatives ['I like hot coffee'], question 'Would you like hot or iced?' -> intendedUtterance chứa 'hot', prompt chứa context")
    void testSttMisheardHorseToHot() {
        when(geminiClient.getPrimaryModel()).thenReturn("gemini-3.5-flash");

        String mockAiBody = """
                {
                  "intendedUtterance": "I like hot coffee",
                  "evaluation": {
                    "isGood": true,
                    "score": 82,
                    "status": "GOOD",
                    "grammarCheck": "Nên dùng cấu trúc lịch sự hơn",
                    "phoneticTip": "STT đã nghe nhầm hot thành horse",
                    "suggestedImprovement": "I'd like a hot coffee, please."
                  },
                  "aiReply": "Sure! Hot coffee coming right up.",
                  "isCompleted": false
                }
                """;

        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(mockAiBody);

        when(geminiClient.generateContent(eq("gemini-3.5-flash"), any()))
                .thenAnswer(invocation -> {
                    GeminiRequest req = invocation.getArgument(1);
                    String promptText = req.getContents().get(0).getParts().get(0).getText();
                    assertTrue(promptText.contains("Would you like hot or iced?"), "Prompt phải chứa previousAiQuestion");
                    assertTrue(promptText.contains("I like hot coffee"), "Prompt phải chứa STT alternatives");
                    assertTrue(promptText.contains("I like horse coffee"), "Prompt phải chứa transcript");
                    return CompletableFuture.completedFuture(mockResponse);
                });

        VoiceAiService.TurnAiOutput output = aiService.generateTurnResponse(
                scenario,
                200,
                "I like horse coffee",
                Collections.emptyList(),
                Collections.emptySet(),
                Collections.emptyList(),
                List.of("I like hot coffee"),
                "Would you like hot or iced?"
        );

        assertNotNull(output);
        assertNotNull(output.getIntendedUtterance());
        assertTrue(output.getIntendedUtterance().contains("hot"), "intendedUtterance phải chứa 'hot'");
        assertEquals("I like hot coffee", output.getIntendedUtterance());
        assertNotNull(output.getEvaluation());
        assertTrue(output.getEvaluation().getScore() <= 84);
        assertEquals("GOOD", output.getEvaluation().getStatus());
    }

    @Test
    @DisplayName("STT context test (b): transcript 'I like eyes coffee', alternatives ['I like iced coffee', 'I like ice coffee'], question 'Would you like hot or iced?' -> intendedUtterance chứa 'iced', prompt chứa context")
    void testSttMisheardEyesToIced() {
        when(geminiClient.getPrimaryModel()).thenReturn("gemini-3.5-flash");

        String mockAiBody = """
                {
                  "intendedUtterance": "I like iced coffee",
                  "evaluation": {
                    "isGood": true,
                    "score": 80,
                    "status": "GOOD",
                    "grammarCheck": "Nên dùng I would like",
                    "phoneticTip": "STT nghe nhầm iced thành eyes",
                    "suggestedImprovement": "I would like an iced coffee, please."
                  },
                  "aiReply": "Got it, one iced coffee for you!",
                  "isCompleted": false
                }
                """;

        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(mockAiBody);

        when(geminiClient.generateContent(eq("gemini-3.5-flash"), any()))
                .thenAnswer(invocation -> {
                    GeminiRequest req = invocation.getArgument(1);
                    String promptText = req.getContents().get(0).getParts().get(0).getText();
                    assertTrue(promptText.contains("Would you like hot or iced?"), "Prompt phải chứa previousAiQuestion");
                    assertTrue(promptText.contains("I like iced coffee"), "Prompt phải chứa STT alternatives");
                    assertTrue(promptText.contains("I like eyes coffee"), "Prompt phải chứa transcript");
                    return CompletableFuture.completedFuture(mockResponse);
                });

        VoiceAiService.TurnAiOutput output = aiService.generateTurnResponse(
                scenario,
                200,
                "I like eyes coffee",
                Collections.emptyList(),
                Collections.emptySet(),
                Collections.emptyList(),
                List.of("I like iced coffee", "I like ice coffee"),
                "Would you like hot or iced?"
        );

        assertNotNull(output);
        assertNotNull(output.getIntendedUtterance());
        assertTrue(output.getIntendedUtterance().contains("iced"), "intendedUtterance phải chứa 'iced'");
        assertEquals("I like iced coffee", output.getIntendedUtterance());
        assertNotNull(output.getEvaluation());
        assertTrue(output.getEvaluation().getScore() <= 84);
        assertEquals("GOOD", output.getEvaluation().getStatus());
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
