package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.service.GeminiClient;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import com.lela.voice.dto.SttAlternativeDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoiceIntentFlowTest {
    @Mock GeminiClient client;
    @Mock VocabularyWhitelistService whitelist;
    VoiceAiService service;
    final ObjectMapper mapper = new ObjectMapper();
    final ConversationScenario coffee = ConversationScenario.builder().title("Order at a Coffee Shop")
            .description("Gọi đồ uống và bánh ngọt tại quán cà phê.")
            .systemPromptTemplate("You are a barista. Take the customer drink order.")
            .aiRole("Barista").userRole("Customer").openingLine("What would you like to drink?")
            .fallbackLinesJson("[\"Would you like hot or iced coffee?\",\"Would you like milk, sugar, tea or cake?\"]").build();

    @BeforeEach void setup() {
        var props = new VoiceConfigurationProperties();
        props.setMaxRetriesGemini(0);
        service = new VoiceAiService(client, mapper, props, whitelist);
    }

    private VoiceAiService.TurnAiOutput turn(String raw, String intended, String confidence,
            boolean offTopic, String previous) throws Exception {
        when(client.getPrimaryModel()).thenReturn("mock");
        when(client.getFallbackModel()).thenReturn("fallback");
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        // Intentionally return an irrelevant aiReply, to exercise the server guard.
        when(response.body()).thenReturn(mapper.writeValueAsString(Map.of(
                "intendedUtterance", intended, "intentConfidence", confidence,
                "offTopic", offTopic, "scenarioReply", "What drink would you like?",
                "aiReply", "Horses live on farms.", "isCompleted", true)));
        when(client.generateContent(eq("mock"), any())).thenReturn(CompletableFuture.completedFuture(response));
        return service.generateTurnResponse(coffee, 200, raw, List.of(), Set.of(), List.of(),
                List.of(intended), previous, .3, List.of(new SttAlternativeDto(intended, .25)));
    }

    @Test void horseCoffeeAsksOneShortConfirmation() throws Exception {
        var output = turn("I like horse coffee", "I like hot coffee", "LOW", false, coffee.getOpeningLine());
        assertEquals("I like hot coffee", output.getIntendedUtterance());
        assertEquals("LOW", output.getIntentConfidence());
        assertEquals("Did you say \"I like hot coffee\"?", output.getAiReply());
        assertFalse(output.getIsCompleted());
        assertFalse(output.getAiReply().contains("farms"));
    }

    @Test void eyesLatteKeepsOriginalGrammarAndConfirmsGuess() throws Exception {
        var output = turn("I likes eyes latte", "I likes iced latte", "LOW", false, "What coffee would you like?");
        assertEquals("I likes iced latte", output.getIntendedUtterance());
        assertEquals("Did you say \"I likes iced latte\"?", output.getAiReply());
    }

    @Test void consecutiveLowContinuesScenarioRatherThanConfirmingAgain() throws Exception {
        var output = turn("eyes latte", "iced latte", "LOW", false, "Did you say a hot coffee?");
        assertEquals("What drink would you like?", output.getAiReply());
        assertFalse(output.getIsCompleted());
    }

    @Test void nonsenseDoesNotGetInventedCoffeeMeaningOrAnUnrelatedAnswer() throws Exception {
        var output = turn("purple satellites blarg", "a hot coffee", "LOW", true, coffee.getOpeningLine());
        assertEquals("purple satellites blarg", output.getIntendedUtterance());
        assertEquals("Sorry, I didn't catch that. What drink would you like?", output.getAiReply());
        assertFalse(output.getIsCompleted());
    }

    @Test void promptContainsObjectiveVocabularyConfidenceAndOnlyThreeRecentExchanges() {
        List<String> history = List.of("OLD exchange", "recent one", "recent two", "recent three");
        GeminiRequest request = service.buildTurnRequest(coffee, 200, "horse coffee", history,
                List.of("hot coffee"), "Hot or iced?", .35, List.of(new SttAlternativeDto("hot coffee", .28)));
        String prompt = request.getContents().get(0).getParts().get(0).getText();
        for (String value : List.of("Order at a Coffee Shop", coffee.getDescription(), "coffee", "iced",
                "Hot or iced?", "recent one", "recent two", "recent three", "horse coffee", "hot coffee", "0.35", "0.28")) {
            assertTrue(prompt.contains(value), value);
        }
        assertFalse(prompt.contains("OLD exchange"));
        var words = ScenarioSpeechContext.vocabulary(coffee);
        assertTrue(words.size() >= 8 && words.size() <= 12);
        assertTrue(words.contains("hot") && words.contains("iced"));
        var schema = request.getGenerationConfig().getResponseSchema().toString();
        assertTrue(schema.contains("intentConfidence") && schema.contains("LOW"));
    }

    @Test void debugDiagnosticsAreStructuredAndSilentAtInfo() throws Exception {
        var logger = (ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger(VoiceAiService.class);
        var previous = logger.getLevel();
        var appender = new ch.qos.logback.core.read.ListAppender<ch.qos.logback.classic.spi.ILoggingEvent>();
        appender.start(); logger.addAppender(appender);
        try {
            logger.setLevel(ch.qos.logback.classic.Level.INFO);
            turn("horse coffee", "hot coffee", "LOW", false, coffee.getOpeningLine());
            assertTrue(appender.list.stream().noneMatch(e -> e.getFormattedMessage().startsWith("VOICE_STT ")));
            logger.setLevel(ch.qos.logback.classic.Level.DEBUG);
            turn("horse coffee\nraw", "hot coffee", "LOW", false, coffee.getOpeningLine());
            var diagnostics = appender.list.stream().filter(e -> e.getFormattedMessage().startsWith("VOICE_STT ")).toList();
            assertEquals(1, diagnostics.size());
            String line = diagnostics.get(0).getFormattedMessage();
            assertFalse(line.contains("\n"));
            var json = mapper.readTree(line.substring("VOICE_STT ".length()));
            assertEquals("horse coffee\nraw", json.path("raw").asText());
            assertEquals("hot coffee", json.path("intendedUtterance").asText());
            assertEquals("LOW", json.path("intentConfidence").asText());
        } finally { logger.detachAppender(appender); logger.setLevel(previous); appender.stop(); }
    }
}
