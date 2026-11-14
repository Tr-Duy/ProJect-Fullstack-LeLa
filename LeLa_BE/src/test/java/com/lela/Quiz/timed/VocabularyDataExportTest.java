package com.lela.Quiz.timed;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Explicit read-only export, using exactly the same inspection as production generation. */
@SpringBootTest @ActiveProfiles("dev") @Transactional(readOnly = true)
@EnabledIfSystemProperty(named = "vocabulary.audit.dir", matches = ".+")
class VocabularyDataExportTest {
    @Autowired VocabularyRepository repository;
    @Autowired VocabularyGenerator generator;
    @Autowired TimedQuizProperties config;
    private static String csv(Object value) { return "\"" + (value == null ? "" : value.toString()).replace("\"", "\"\"") + "\""; }
    @Test void exportRejectedCardsAndKnownPosReviewList() throws Exception {
        Path directory = Paths.get(System.getProperty("vocabulary.audit.dir")).toAbsolutePath();
        Files.createDirectories(directory);
        var cards = repository.findSystemWords(config.getSystemOwner(), null);
        var inspection = generator.inspect(cards);
        Map<Long,List<String>> reasons = new HashMap<>();
        var rejected = new ArrayList<>(List.of("card_id,english,meaning,part_of_speech,level_id,declared_source_pos,reasons"));
        for (var card : inspection.rejected()) {
            reasons.put(card.cardId(), card.reasons());
            rejected.add(String.join(",", csv(card.cardId()), csv(card.english()), csv(card.meaning()), csv(card.pos()), csv(card.level()), csv(card.declaredPos()), csv(String.join(";",card.reasons()))));
        }
        var known = new ArrayList<>(List.of("card_id,english,meaning,part_of_speech,level_id,declared_source_pos,review_reasons"));
        for (var card : cards) if (VocabularyGenerator.KNOWN_POS_REVIEW.contains(VocabularyGenerator.reviewHead(card.getFrontText()))) {
            Long level = card.getDeck().getLevel() == null ? null : card.getDeck().getLevel().getId();
            known.add(String.join(",", csv(card.getId()), csv(card.getFrontText()), csv(card.getBackText()), csv(card.getPartOfSpeech()), csv(level), csv(String.join("/",VocabularyGenerator.sourcePosLabels(card))),
                    csv(String.join(";", reasons.getOrDefault(card.getId(), List.of("KNOWN_WORD_MANUAL_REVIEW_ACCEPTED_VARIANT"))))));
        }
        Files.writeString(directory.resolve("rejected-vocabulary.csv"), "\uFEFF" + String.join("\n", rejected) + "\n", StandardCharsets.UTF_8);
        Files.writeString(directory.resolve("known-pos-review.csv"), "\uFEFF" + String.join("\n", known) + "\n", StandardCharsets.UTF_8);
        var counts = new TreeMap<String,Integer>();
        inspection.rejected().forEach(c -> c.reasons().forEach(reason -> counts.merge(reason, 1, Integer::sum)));
        Files.writeString(directory.resolve("filter-summary.json"), new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(
                Map.of("sourceCards", cards.size(), "acceptedWords", inspection.accepted().size(), "rejectedCards", inspection.rejected().size(), "reasons", counts,
                        "acceptedByLevel", inspection.accepted().stream().collect(java.util.stream.Collectors.groupingBy(VocabularyGenerator.Word::level, java.util.stream.Collectors.counting())))), StandardCharsets.UTF_8);
    }
}
