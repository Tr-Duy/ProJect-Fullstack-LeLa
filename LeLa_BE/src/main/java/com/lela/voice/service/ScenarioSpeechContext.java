package com.lela.voice.service;

import com.lela.voice.domain.ConversationScenario;
import java.util.*;
import java.util.regex.Pattern;

/** Vocabulary hints come from trusted scenario data, never the learner's raw STT. */
final class ScenarioSpeechContext {
    private ScenarioSpeechContext() {}
    private static final Pattern WORD = Pattern.compile("[a-z]+(?:-[a-z]+)*");
    private static final Set<String> STOP = new HashSet<>(Arrays.asList(("a an the i you your yours their them they "
            + "we us our to of and or in on at for with by from as is are am be been it that this there "
            + "what how why who when where would could can will do does did have has had any some all "
            + "not just then than so but if about into also each such up out me my he she his her "
            + "are ask speak speaking english clear clearly natural friendly polite empathetic warm experienced "
            + "appropriate beginner learners learner maintain tone keep advice systematic international local "
            + "hello welcome good morning afternoon day today thanks thank much very may get take tell "
            + "let make sure thing ready couple few little bit sounds here end see want like going been "
            + "playing role scenario template json true false").split("\\s+")));

    static List<String> vocabulary(ConversationScenario scenario) {
        if (scenario == null) return List.of("help", "please", "repeat", "question", "answer", "again", "explain", "understand");
        Set<String> words = new LinkedHashSet<>();
        // Fallback lines contain the actual situation vocabulary, not teaching instructions.
        String source = String.join(" ", Objects.toString(scenario.getTitle(), ""),
                Objects.toString(scenario.getFallbackLinesJson(), ""),
                Objects.toString(scenario.getSystemPromptTemplate(), ""),
                Objects.toString(scenario.getAiRole(), ""), Objects.toString(scenario.getUserRole(), ""),
                Objects.toString(scenario.getOpeningLine(), ""));
        var matcher = WORD.matcher(source.toLowerCase(Locale.ROOT));
        while (matcher.find()) {
            String word = matcher.group();
            if (word.length() > 2 && !STOP.contains(word)) words.add(word);
        }
        for (String word : List.of("please", "help", "repeat", "question", "answer", "again", "explain", "understand")) {
            if (words.size() >= 8) break;
            words.add(word);
        }
        return words.stream().limit(12).toList();
    }
}
