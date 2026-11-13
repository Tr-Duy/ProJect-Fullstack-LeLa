package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.dto.GeminiRequest;
import com.lela.ai.service.GeminiClient;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VoiceLiteSafetyTest {
    final ObjectMapper mapper = new ObjectMapper();
    final ConversationScenario coffee = ConversationScenario.builder().title("Coffee Shop")
            .openingLine("What would you like?").fallbackLinesJson("[]").build();

    @Test void lowAndOffTopicSuppressAllCorrectionPathsEvenAfterRepeatedNormalization() {
        var service = new VoiceAiService(null, mapper, new VoiceConfigurationProperties(), null);
        for (String confidence : List.of("HIGH", "LOW")) {
            for (boolean offTopic : List.of(false, true)) {
                var output = VoiceAiService.TurnAiOutput.builder().intendedUtterance("purple satellites")
                        .intentConfidence(confidence).offTopic(offTopic).aiReply("Repeat please")
                        .evaluation(VoiceAiService.EvaluationAiOutput.builder().hasError(true)
                                .grammarCheck("invented error").suggestedImprovement("I would like coffee").build()).build();
                service.validateAndNormalize(output, "purple satellites");
                service.validateAndNormalize(output, "purple satellites");
                if (offTopic || confidence.equals("LOW")) {
                    assertEquals("", output.getEvaluation().getGrammarCheck());
                    assertEquals("", output.getEvaluation().getSuggestedImprovement());
                    assertEquals("", output.getCorrectedSentence());
                    assertEquals(List.of(), output.getGrammarErrors());
                } else {
                    assertEquals("invented error", output.getEvaluation().getGrammarCheck());
                    assertEquals("I would like coffee", output.getCorrectedSentence());
                }
            }
        }
        var legacy = VoiceAiService.TurnAiOutput.builder().intentConfidence("LOW")
                .correctedSentence("invented coffee").grammarErrors(List.of("invented")).build();
        service.validateAndNormalize(legacy, "noise");
        assertEquals("", legacy.getCorrectedSentence()); assertTrue(legacy.getGrammarErrors().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"That is all", "No thanks", "That's it", "Nothing else"})
    void closingContractKeepsFarewellAndCompletionForEachPhrase(String utterance) throws Exception {
        GeminiClient client = mock(GeminiClient.class);
        var props = new VoiceConfigurationProperties(); props.setTurnModel("lite"); props.setFallbackModel("strong");
        var service = new VoiceAiService(client, mapper, props, null);
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn(mapper.writeValueAsString(Map.of("intendedUtterance", utterance,
                "intentConfidence", "HIGH", "aiReply", "Thank you! Have a nice day.", "isCompleted", true)));
        when(client.generateContent(eq("lite"), any())).thenAnswer(invocation -> {
            GeminiRequest request = invocation.getArgument(1);
            String prompt = request.getContents().get(0).getParts().get(0).getText();
            for (String phrase : List.of("That is all", "No thanks", "That's it", "Nothing else", "isCompleted=true", "do NOT offer more items"))
                assertTrue(prompt.contains(phrase), phrase);
            assertTrue(prompt.contains("I like") && prompt.contains("simple correct examples"));
            return CompletableFuture.completedFuture(response);
        });
        var output = service.generateTurnResponse(coffee, 200, utterance, List.of(), Set.of(), List.of());
        assertTrue(output.getIsCompleted()); assertFalse(output.getAiReply().contains("?"));
        assertEquals("Thank you! Have a nice day.", output.getAiReply());
        verify(client, times(1)).generateContent(eq("lite"), any());
        verify(client, never()).generateContent(eq("strong"), any());
    }
}
