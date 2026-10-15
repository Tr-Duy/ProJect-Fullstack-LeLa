package com.lela.voice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class VocabularyWhitelistServiceTest {

    private VocabularyWhitelistService service;

    @BeforeEach
    void setUp() {
        service = new VocabularyWhitelistService();
    }

    @Test
    @DisplayName("Target word exact matching and regular inflection tests")
    void testTargetWordMatching() {
        // Singular / Plural
        assertTrue(service.matchesTargetWord("apples", "apple"));
        assertTrue(service.matchesTargetWord("apple", "apple"));
        assertTrue(service.matchesTargetWord("Apple", "apple"));

        // Verbs: -ed, -ing, -s
        assertTrue(service.matchesTargetWord("studies", "study"));
        assertTrue(service.matchesTargetWord("studied", "study"));
        assertTrue(service.matchesTargetWord("studying", "study"));

        // Irregular verbs
        assertTrue(service.matchesTargetWord("went", "go"));
        assertTrue(service.matchesTargetWord("gone", "go"));
        assertTrue(service.matchesTargetWord("goes", "go"));
        assertTrue(service.matchesTargetWord("bought", "buy"));
    }

    @Test
    @DisplayName("Ensure no false positives on easily confused pairs (university vs universe, organ vs organize)")
    void testNoFalsePositivesOnConfusedPairs() {
        // university vs universe
        assertFalse(service.matchesTargetWord("university", "universe"));
        assertFalse(service.matchesTargetWord("universe", "university"));

        // organ vs organize
        assertFalse(service.matchesTargetWord("organ", "organize"));
        assertFalse(service.matchesTargetWord("organize", "organ"));
        assertFalse(service.matchesTargetWord("organization", "organ"));

        // station vs state
        assertFalse(service.matchesTargetWord("station", "state"));
    }

    @Test
    @DisplayName("Whitelist ratio calculation")
    void testWhitelistRatio() {
        Set<String> whitelist = Set.of("i", "want", "to", "order", "a", "hot", "coffee");
        String sentence = "I want to order a hot coffee please"; // 'please' is off whitelist
        double ratio = service.calculateOffWhitelistRatio(sentence, whitelist);
        assertTrue(ratio <= 0.20, "Ratio should be around 1/8 (12.5%)");
    }
}
