package com.lela.deck;

import com.lela.deck.domain.Deck;
import com.lela.flashcard.domain.Flashcard;
import com.lela.flashcard.FlashcardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class ToeicDataIntegrationTest {

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("1. Verify 50 TOEIC Decks created and old DECK-TOEIC-600 removed")
    void test1_VerifyToeicDecksCount() {
        // Old deck should be removed
        Optional<Deck> oldDeck = deckRepository.findByDeckCode("DECK-TOEIC-600");
        assertFalse(oldDeck.isPresent(), "Old DECK-TOEIC-600 should be removed");

        // Verify 50 new TOEIC Decks
        List<Map<String, Object>> toeicDecks = jdbcTemplate.queryForList(
                "SELECT id, deck_code, title, difficulty, total_cards FROM decks WHERE deck_code LIKE 'DECK-TOEIC-%' ORDER BY id"
        );
        assertEquals(50, toeicDecks.size(), "Must contain exactly 50 TOEIC decks corresponding to 50 Lessons");

        // Check specific sample decks
        Optional<Deck> deckL1 = deckRepository.findByDeckCode("DECK-TOEIC-U500-L01");
        assertTrue(deckL1.isPresent(), "DECK-TOEIC-U500-L01 must exist");
        assertEquals("TOEIC Dưới 500 - Contracts", deckL1.get().getTitle());
        assertEquals("BEGINNER", deckL1.get().getDifficulty().name());
        assertEquals("PUBLIC", deckL1.get().getVisibility().name());
        assertEquals("PUBLISHED", deckL1.get().getStatus().name());
        assertEquals("admin", deckL1.get().getOwner().getUsername());

        Optional<Deck> deckL50 = deckRepository.findByDeckCode("DECK-TOEIC-800P-L50");
        assertTrue(deckL50.isPresent(), "DECK-TOEIC-800P-L50 must exist");
        assertEquals("TOEIC 800+ - Pharmacy", deckL50.get().getTitle());
        assertEquals("ADVANCED", deckL50.get().getDifficulty().name());
    }

    @Test
    @DisplayName("2. Verify total TOEIC Flashcards count = 785 and no duplicates")
    void test2_VerifyToeicFlashcardsCount() {
        Integer totalToeicCards = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flashcards f JOIN decks d ON f.deck_id = d.id WHERE d.deck_code LIKE 'DECK-TOEIC-%'",
                Integer.class
        );
        assertNotNull(totalToeicCards);
        assertEquals(785, totalToeicCards, "Total TOEIC flashcards must be exactly 785");

        // Check cards per deck are between 9 and 16
        List<Map<String, Object>> cardCountsPerDeck = jdbcTemplate.queryForList(
                "SELECT d.deck_code, COUNT(f.id) as card_count FROM decks d JOIN flashcards f ON f.deck_id = d.id WHERE d.deck_code LIKE 'DECK-TOEIC-%' GROUP BY d.deck_code"
        );
        for (Map<String, Object> row : cardCountsPerDeck) {
            long count = ((Number) row.get("card_count")).longValue();
            assertTrue(count >= 9 && count <= 16, "Each TOEIC deck must contain 9 to 16 cards (Deck " + row.get("deck_code") + " has " + count + ")");
        }
    }

    @Test
    @DisplayName("3. Verify TOEIC Decks count per target score level")
    void test3_VerifyDecksPerLevel() {
        Integer u500Count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM decks WHERE deck_code LIKE 'DECK-TOEIC-U500-%'", Integer.class
        );
        Integer count500_650 = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM decks WHERE deck_code LIKE 'DECK-TOEIC-500-650-%'", Integer.class
        );
        Integer count650_800 = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM decks WHERE deck_code LIKE 'DECK-TOEIC-650-800-%'", Integer.class
        );
        Integer count800P = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM decks WHERE deck_code LIKE 'DECK-TOEIC-800P-%'", Integer.class
        );

        assertEquals(15, u500Count, "Dưới 500 level must have 15 decks");
        assertEquals(15, count500_650, "500-650 level must have 15 decks");
        assertEquals(12, count650_800, "650-800 level must have 12 decks");
        assertEquals(8, count800P, "800+ level must have 8 decks");
    }

    @Test
    @DisplayName("4. Verify sample flashcard content in specific deck")
    void test4_VerifySampleFlashcardContent() {
        Optional<Deck> deckL1 = deckRepository.findByDeckCode("DECK-TOEIC-U500-L01");
        assertTrue(deckL1.isPresent());

        List<Map<String, Object>> cards = jdbcTemplate.queryForList(
                "SELECT front_text, back_text, note, hint, card_order FROM flashcards WHERE deck_id = ? AND front_text = 'Abide by (v.)'",
                deckL1.get().getId()
        );
        assertFalse(cards.isEmpty(), "Flashcard 'Abide by (v.)' must exist in DECK-TOEIC-U500-L01");
        Map<String, Object> card = cards.get(0);
        assertEquals("Tuân theo, chịu theo", card.get("back_text"));
        assertEquals("to comply with, to conform", card.get("note"));
        assertEquals("L1 Contracts", card.get("hint"));
        assertEquals(1, ((Number) card.get("card_order")).intValue());
    }
}
