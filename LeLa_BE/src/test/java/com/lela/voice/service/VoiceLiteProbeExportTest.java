package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.voice.dto.SttAlternativeDto;
import com.lela.voice.repository.ConversationScenarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import java.nio.file.*;
import java.util.*;

@SpringBootTest
@ActiveProfiles("dev")
@EnabledIfEnvironmentVariable(named = "VOICE_LITE_EXPERIMENT", matches = "1")
class VoiceLiteProbeExportTest {
    @Autowired VoiceAiService ai;
    @Autowired ConversationScenarioRepository scenarios;
    @Autowired ObjectMapper mapper;
    @Test void exportActualFullPromptAndNormalizeSavedResponsesWithTheProductionGuard() throws Exception {
        var scenario = scenarios.findAll().stream().filter(s -> s.getSlug().contains("coffee")).findFirst().orElseThrow();
        var cases = mapper.readTree(Files.readString(Path.of("../tests/experiments/voice_lite_cases.json")));
        var requests = new ArrayList<Map<String, Object>>();
        for (var sample : cases) {
            String raw = sample.path("text").asText();
            List<String> alternatives = new ArrayList<>(); alternatives.add(raw);
            sample.path("alternatives").forEach(a -> alternatives.add(a.asText()));
            List<SttAlternativeDto> details = new ArrayList<>();
            details.add(new SttAlternativeDto(raw, sample.path("confidence").doubleValue()));
            alternatives.stream().skip(1).forEach(a -> details.add(new SttAlternativeDto(a, .25)));
            requests.add(Map.of("case", sample.path("id").intValue(), "input", sample,
                    "payload", ai.buildTurnRequest(scenario, 200, raw, List.of(), alternatives,
                            scenario.getOpeningLine(), sample.path("confidence").doubleValue(), details)));
        }
        Path directory = Path.of("../tests/experiments/private-results"); Files.createDirectories(directory);
        Files.writeString(directory.resolve("voice-lite-fixed-requests.json"), mapper.writerWithDefaultPrettyPrinter().writeValueAsString(requests));
        Path resultFile = directory.resolve("voice-lite-fixed-raw.json");
        if (Files.exists(resultFile)) {
            var rows = mapper.readTree(Files.readString(resultFile)).path("rows");
            var normalized = new ArrayList<Map<String, Object>>();
            for (var row : rows) {
                String raw = row.path("input").path("text").asText();
                var item = new LinkedHashMap<String, Object>();
                item.put("case", row.path("case").intValue()); item.put("raw", raw);
                item.put("status", row.path("status")); item.put("latencyMs", row.path("latencyMs"));
                item.put("usage", row.path("data").path("usageMetadata"));
                item.put("modelVersion", row.path("data").path("modelVersion"));
                if (row.path("status").asInt() == 200) {
                    var output = ai.parseAiOutput(mapper.writeValueAsString(row.path("data")), raw);
                    if (output != null) {
                        if (Boolean.TRUE.equals(output.getOffTopic())) output.setIntendedUtterance(raw);
                        ai.applyUnderstandingPolicy(output, scenario, scenario.getOpeningLine());
                        item.put("served", output);
                    }
                }
                normalized.add(item);
            }
            Files.writeString(directory.resolve("voice-lite-fixed-served.json"), mapper.writerWithDefaultPrettyPrinter().writeValueAsString(normalized));
        }
    }
}
