package com.lela.Quiz.timed;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class VocabularyGeneratorTest {
    private final VocabularyGenerator generator = new VocabularyGenerator();
    private List<VocabularyGenerator.Word> words(int count) {
        List<VocabularyGenerator.Word> words = new ArrayList<>();
        for (int i = 0; i < count; i++) words.add(new VocabularyGenerator.Word(i, "word" + i, "nghĩa " + i, "n", 1, Set.of()));
        return words;
    }
    @Test void meaningHasExactlyOneCorrectAndFourUniqueOptionsFromSameLevel() {
        for (var item : generator.generate("MULTIPLE_CHOICE_MEANING", words(30), 20)) {
            assertEquals(4, item.choices().size());
            assertEquals(4, item.choices().stream().map(VocabularyGenerator.Word::english).distinct().count());
            assertEquals(1, item.choices().stream().filter(w -> w.id() == item.words().getFirst().id()).count());
            assertTrue(item.choices().stream().allMatch(w -> w.level() == item.words().getFirst().level()));
        }
    }
    @Test void matchingUsesTwentyDistinctWordsAndDistinctMeanings() {
        var items = generator.generate("MATCHING_PAIRS", words(25), 5);
        assertEquals(5, items.size());
        assertEquals(20, items.stream().flatMap(i -> i.words().stream()).map(VocabularyGenerator.Word::english).distinct().count());
        items.forEach(i -> { assertEquals(4, i.words().size()); assertEquals(4, i.words().stream().map(VocabularyGenerator.Word::meaning).distinct().count()); });
    }
    @Test void scarcePoolReportsExplicitErrorWithoutInventing() {
        assertEquals(2, generator.generate("MULTIPLE_CHOICE_MEANING", words(2), 2).getFirst().choices().size());
        assertEquals(1, generator.generate("MATCHING_PAIRS", words(7), 1).size());
        assertTrue(assertThrows(IllegalStateException.class, () -> generator.generate("MATCHING_PAIRS", words(7), 5)).getMessage().contains("20"));
        assertThrows(IllegalStateException.class, () -> generator.generate("MULTIPLE_CHOICE_MEANING", words(7), 20));
        assertThrows(IllegalStateException.class, () -> generator.generate("MULTIPLE_CHOICE_MEANING", words(1), 20));
        assertThrows(IllegalStateException.class, () -> generator.generate("MATCHING_PAIRS", words(3), 5));
    }
    @Test void excludesSynonymsAndDuplicateVietnameseSenses() {
        var a = new VocabularyGenerator.Word(1, "enjoy", "tận hưởng / thích", "v", 1, Set.of("like"));
        var b = new VocabularyGenerator.Word(2, "like", "thích", "v", 1, Set.of());
        var c = new VocabularyGenerator.Word(3, "appreciate", "tận hưởng / thích", "v", 1, Set.of());
        assertTrue(VocabularyGenerator.conflicts(a, b)); assertTrue(VocabularyGenerator.conflicts(a, c));
        var pool = words(15); pool.addAll(List.of(a, b, c));
        for (var item : generator.generate("MULTIPLE_CHOICE_MEANING", pool, 12))
            for (var distractor : item.choices()) if (distractor.id() != item.words().getFirst().id())
                assertFalse(VocabularyGenerator.conflicts(item.words().getFirst(), distractor));
    }
    @Test void matchingFormulaUsesConfigurationAndFloorsAtZero() {
        assertEquals(new BigDecimal("3.50"), TimedQuizEngine.matchingScore(4, 2, BigDecimal.ONE, new BigDecimal("0.25")));
        assertEquals(BigDecimal.ZERO, TimedQuizEngine.matchingScore(1, 10, BigDecimal.ONE, new BigDecimal("0.25")));
        assertEquals(new BigDecimal("5.5"), TimedQuizEngine.matchingScore(3, 1, new BigDecimal("2"), new BigDecimal("0.5")));
    }
    @Test void prefersSamePartOfSpeechWhenEnoughOptionsExist() {
        var pool = words(20);
        for (int i = 30; i < 50; i++) pool.add(new VocabularyGenerator.Word(i, "verb" + i, "động từ " + i, "v", 1, Set.of()));
        for (var item : generator.generate("MULTIPLE_CHOICE_MEANING", pool, 15))
            assertTrue(item.choices().stream().allMatch(w -> w.pos().equals(item.words().getFirst().pos())));
    }
    @Test void meaningNeverRepeatsFourOptionsOrDistractorTrioWithinAttempt() {
        for (int run = 0; run < 30; run++) {
            Set<Set<String>> groups = new HashSet<>(), distractors = new HashSet<>();
            var items = generator.generate("MULTIPLE_CHOICE_MEANING", words(40), 20);
            assertEquals(20, items.size());
            for (var item : items) {
                assertTrue(groups.add(item.choices().stream().map(VocabularyGenerator.Word::english).collect(java.util.stream.Collectors.toSet())));
                assertTrue(distractors.add(item.choices().stream().filter(w -> w.id() != item.words().getFirst().id()).map(VocabularyGenerator.Word::english).collect(java.util.stream.Collectors.toSet())));
            }
        }
    }
    @Test void matchingReshufflesFullyAlignedColumnsAndKeepsEveryPair() {
        for (int run = 0; run < 30; run++) {
            var screen = new TimedQuizEngine.Screen();
            for (int i = 0; i < 4; i++) {
                screen.getLeft().add(new TimedQuizEngine.Cell("l"+i,"word"+i));
                screen.getRight().add(new TimedQuizEngine.Cell("r"+i,"nghĩa"+i)); screen.getSolution().put("l"+i,"r"+i);
            }
            assertTrue(TimedQuizEngine.fullyAligned(screen));
            TimedQuizEngine.avoidAlignedColumns(screen);
            assertFalse(TimedQuizEngine.fullyAligned(screen));
            assertEquals(Set.of("r0","r1","r2","r3"), screen.getRight().stream().map(TimedQuizEngine.Cell::getId).collect(java.util.stream.Collectors.toSet()));
        }
    }
    @Test void filtersBrokenSourceTextAndDoesNotCreateReplacementVocabulary() {
        var level = new com.lela.common.domain.ProficiencyLevel(); level.setId(1L);
        var deck = new com.lela.deck.domain.Deck(); deck.setLevel(level);
        List<com.lela.flashcard.domain.Flashcard> cards = new ArrayList<>();
        String[][] data = {{"apple","quả táo"},{"broken (n.)","nghĩa có chú thích lỗi"},{"contract","hợp đồng"},{"abide by","tuân theo contract"},{"placeholder","từ vựng thuộc nhóm placeholder (danh từ)"}};
        for (int i = 0; i < data.length; i++) {
            var card = new com.lela.flashcard.domain.Flashcard(); card.setId((long)i); card.setDeck(deck);
            card.setFrontText(data[i][0]); card.setBackText(data[i][1]); card.setPartOfSpeech("n"); cards.add(card);
        }
        var cleaned = generator.clean(cards);
        assertEquals(Set.of("apple","contract"), cleaned.stream().map(VocabularyGenerator.Word::english).collect(java.util.stream.Collectors.toSet()));
    }
    @Test void rejectsGarbageAndKnownPosMeaningMismatchesWithoutRejectingCorrectNounVariant() {
        var level = new com.lela.common.domain.ProficiencyLevel(); level.setId(1L);
        var deck = new com.lela.deck.domain.Deck(); deck.setLevel(level);
        String[][] data = {{"Appeal","Hấp dẫn","adj"},{"Target","Mục tiêu","v"},{"File","Hồ sơ, tài liệu","v"},
                {"Inventory","Kiểm kê hàng hoá","n"},{"Regardless ad","Bất chấp","v"},{"Regularly ad","Thường xuyên","v"},
                {"Relatively ad","Tương đối","v"},{"Target","mục tiêu","n"},{"Fill out","Đầy đủ, hoàn tất","v"},
                {"adequate","đầy đủ, thỏa đáng","n"},{"Investigative","Điều tra","adj"}};
        List<com.lela.flashcard.domain.Flashcard> cards = new ArrayList<>();
        for (int i = 0; i < data.length; i++) {
            var card = new com.lela.flashcard.domain.Flashcard(); card.setId((long)i); card.setDeck(deck);
            card.setFrontText(data[i][0]); card.setBackText(data[i][1]); card.setPartOfSpeech(data[i][2]); cards.add(card);
        }
        var inspected = generator.inspect(cards);
        assertEquals(1, inspected.accepted().size()); assertEquals("Target", inspected.accepted().getFirst().english());
        assertEquals("n", inspected.accepted().getFirst().pos()); assertEquals(10, inspected.rejected().size());
        assertTrue(inspected.rejected().stream().filter(r -> r.english().endsWith(" ad")).allMatch(r -> r.reasons().contains("GARBAGE_POS_SUFFIX")));
    }
    @Test void deadlineUsesServerTimeToleranceAndPause() {
        var screen = new TimedQuizEngine.Screen(); screen.setDeadline(20_000);
        assertFalse(TimedQuizEngine.late(screen, 22_000, 2));
        assertTrue(TimedQuizEngine.late(screen, 22_001, 2));
        screen.setPausedAt(18_000L); assertFalse(TimedQuizEngine.late(screen, 200_000, 2));
        screen.setDeadline(0); screen.setPausedAt(null); assertFalse(TimedQuizEngine.late(screen, 200_000, 2));
    }
    @Test void comparesExplicitSourcePosAndDetectsNounMeaningWithAdjectiveTag() {
        var level = new com.lela.common.domain.ProficiencyLevel(); level.setId(1L);
        var deck = new com.lela.deck.domain.Deck(); deck.setLevel(level);
        var adverb = new com.lela.flashcard.domain.Flashcard(); adverb.setId(1L); adverb.setDeck(deck);
        adverb.setFrontText("accurately"); adverb.setBackText("chính xác"); adverb.setPartOfSpeech("n"); adverb.setHint("adv. | Office");
        var mixed = new com.lela.flashcard.domain.Flashcard(); mixed.setId(2L); mixed.setDeck(deck);
        mixed.setFrontText("test"); mixed.setBackText("bài kiểm tra"); mixed.setPartOfSpeech("n"); mixed.setNote("Source: dictionary | POS: v., n.");
        var adjective = new com.lela.flashcard.domain.Flashcard(); adjective.setId(3L); adjective.setDeck(deck);
        adjective.setFrontText("confident"); adjective.setBackText("Sự tự tin"); adjective.setPartOfSpeech("adj");
        var inspection = generator.inspect(List.of(adverb, mixed, adjective));
        assertEquals(1, inspection.accepted().size()); assertEquals("test", inspection.accepted().getFirst().english());
        assertTrue(inspection.rejected().getFirst().reasons().contains("SOURCE_POS_METADATA_CONFLICT"));
        assertEquals("adv", inspection.rejected().getFirst().declaredPos());
        assertTrue(inspection.rejected().get(1).reasons().contains("NOUN_MEANING_WITH_NON_NOUN_POS"));
    }
}
