package com.lela.deck;

import com.lela.deck.dto.DeckResponse;
import com.lela.deck.domain.Deck;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class DeckAccessControlIntegrationTest {

    @Autowired
    private DeckService deckService;

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private UsersRepository usersRepository;

    private void authenticateUser(String username, String role) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority(role))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void clearAuthentication() {
        SecurityContextHolder.getContext().setAuthentication(null);
    }

    @Test
    @DisplayName("TEST A: Admin sees ALL decks in system (>= 60 decks)")
    void testAdminSeesAllDecks() {
        authenticateUser("admin", "ROLE_ADMIN");
        Page<DeckResponse> result = deckService.getAllDecks(null, null, PageRequest.of(0, 100));
        
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(60);
    }

    @Test
    @DisplayName("TEST B: Learner1 (Dưới 500) sees normal decks + TOEIC Dưới 500 decks (27 decks)")
    void testLearner1SeesCorrectDecks() {
        authenticateUser("learner1", "ROLE_LEARNER");
        Page<DeckResponse> result = deckService.getAllDecks(null, null, PageRequest.of(0, 100));
        
        assertThat(result.getContent()).isNotEmpty();
        // 12 normal decks + 32 TOEIC U500 decks = 44 decks
        assertThat(result.getTotalElements()).isEqualTo(44);


        // Verify none of the returned decks belong to 500-650, 650-800, or 800+
        boolean hasHigherToeic = result.getContent().stream()
                .anyMatch(d -> d.getTitle() != null && (d.getTitle().contains("500–650") || d.getTitle().contains("650–800") || d.getTitle().contains("800+")));
        assertThat(hasHigherToeic).isFalse();
    }

    @Test
    @DisplayName("TEST C: Guest sees only normal non-gated public decks (12 decks)")
    void testGuestSeesOnlyNormalDecks() {
        clearAuthentication();
        Page<DeckResponse> result = deckService.getAllDecks(null, null, PageRequest.of(0, 100));
        
        assertThat(result.getContent()).isNotEmpty();
        assertThat(result.getTotalElements()).isEqualTo(12);

        // Verify no TOEIC decks returned to Guest
        boolean hasToeic = result.getContent().stream()
                .anyMatch(d -> d.getTitle() != null && d.getTitle().contains("TOEIC"));
        assertThat(hasToeic).isFalse();
    }

    @Test
    @DisplayName("TEST D: Direct URL Access - Learner1 accessing TOEIC 650-800 deck is BLOCKED with 403 Forbidden")
    void testLearnerBlockedFromHigherLevelDeck() {
        authenticateUser("learner1", "ROLE_LEARNER");
        Deck higherDeck = deckRepository.findByDeckCode("DECK-TOEIC-650-800-L31")
                .orElseThrow(() -> new AssertionError("DECK-TOEIC-650-800-L31 not found"));

        assertThatThrownBy(() -> deckService.getDeckById(higherDeck.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("TEST E: Direct URL Access - Admin accessing TOEIC 650-800 deck SUCCEEDS")
    void testAdminCanAccessHigherLevelDeck() {
        authenticateUser("admin", "ROLE_ADMIN");
        Deck higherDeck = deckRepository.findByDeckCode("DECK-TOEIC-650-800-L31")
                .orElseThrow(() -> new AssertionError("DECK-TOEIC-650-800-L31 not found"));

        DeckResponse resp = deckService.getDeckById(higherDeck.getId());
        assertThat(resp).isNotNull();
        assertThat(resp.getId()).isEqualTo(higherDeck.getId());
    }
}
