package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import java.nio.file.*;
import java.util.*;

/** Opt-in export of the exact production request for the live paired experiment. No API calls. */
@EnabledIfEnvironmentVariable(named = "VOICE_EXPORT_EXPERIMENT", matches = "1")
class VoicePhase1RequestExportTest {
    @Test void exportProductionRequests() throws Exception {
        var mapper = new ObjectMapper();
        var service = new VoiceAiService(null, mapper, new VoiceConfigurationProperties(), null);
        var scenario = ConversationScenario.builder().title("Coffee Shop").aiRole("Barista")
                .openingLine("What would you like to drink?").build();
        var cases = List.of("I would like a hot coffee please", "I wants a coffee", "Can I have an iced latte please",
                "I would like two cup of tea", "No sugar please", "She want a hot chocolate",
                "Could I have some milk please", "Yesterday I buy coffee here", "That is all thank you", "How much do it cost");
        var requests = new ArrayList<Map<String, Object>>();
        for (int i = 0; i < cases.size(); i++) requests.add(Map.of("case", i + 1, "text", cases.get(i),
                "expectedHasError", i % 2 == 1, "payload", service.buildTurnRequest(scenario, 200, cases.get(i),
                        List.of(), List.of(), scenario.getOpeningLine())));
        Path output = Path.of("../tests/experiments/private-results/phase1a-request-templates.json");
        Files.createDirectories(output.getParent());
        Files.writeString(output, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(requests));
    }
}
