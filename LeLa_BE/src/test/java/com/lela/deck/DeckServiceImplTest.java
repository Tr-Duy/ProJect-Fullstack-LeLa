package com.lela.deck;

import com.lela.deck.domain.Deck;
import com.lela.deck.domain.DeckStatus;
import com.lela.deck.dto.DeckRequest;
import com.lela.deck.dto.DeckResponse;
import com.lela.language.domain.Language;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DeckServiceImplTest {

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private DeckServiceImpl deckService;

    private Deck deckEntity;

    @BeforeEach
    void setUp() {
        deckEntity = new Deck();
        deckEntity.setId(1L);
        deckEntity.setTitle("Test Deck");
        deckEntity.setSlug("test-deck");
        deckEntity.setDeckCode("ABCD1234");
        deckEntity.setStatus(DeckStatus.PUBLISHED);
        deckEntity.setOwner(new Users());
        deckEntity.setLanguage(new Language());
    }

    @Test
    void createDeck_Success() {
        DeckRequest request = new DeckRequest();
        request.setTitle("New Deck");
        request.setOwnerId(10L);
        request.setLanguageId(5L);

        Users owner = new Users();
        owner.setId(10L);

        Language lang = new Language();
        lang.setId(5L);

        when(entityManager.getReference(Users.class, 10L)).thenReturn(owner);
        when(entityManager.getReference(Language.class, 5L)).thenReturn(lang);
        
        Deck savedDeck = new Deck();
        savedDeck.setId(2L);
        savedDeck.setTitle("New Deck");
        savedDeck.setOwner(owner);
        savedDeck.setLanguage(lang);
        when(deckRepository.save(any(Deck.class))).thenReturn(savedDeck);

        DeckResponse result = deckService.createDeck(request);

        assertNotNull(result);
        assertEquals("New Deck", result.getTitle());
        verify(deckRepository).save(any(Deck.class));
    }

    @Test
    void updateDeck_Success() {
        DeckRequest request = new DeckRequest();
        request.setTitle("Updated Title");

        when(deckRepository.findById(1L)).thenReturn(Optional.of(deckEntity));
        when(deckRepository.save(deckEntity)).thenReturn(deckEntity);

        DeckResponse result = deckService.updateDeck(1L, request);

        assertNotNull(result);
        assertEquals("Updated Title", deckEntity.getTitle()); // Ensure entity is updated
        verify(deckRepository).save(deckEntity);
    }

    @Test
    void updateDeck_NotFound_ThrowsException() {
        DeckRequest request = new DeckRequest();
        when(deckRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            deckService.updateDeck(99L, request);
        });

        assertEquals("Deck not found", exception.getMessage());
        verify(deckRepository, Mockito.never()).save(any());
    }

    @Test
    void getDeckById_Success() {
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deckEntity));

        DeckResponse result = deckService.getDeckById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(deckRepository).findById(1L);
    }

    @Test
    void getAllDecks_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Deck> page = new PageImpl<>(Arrays.asList(deckEntity));
        
        when(deckRepository.findByIsActiveTrue(pageable)).thenReturn(page);

        Page<DeckResponse> result = deckService.getAllDecks(null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(deckRepository).findByIsActiveTrue(pageable);
    }

    @Test
    void deleteDeck_Success() {
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deckEntity));

        deckService.deleteDeck(1L);

        assertFalse(deckEntity.isActive()); // Verify soft delete
        verify(deckRepository).save(deckEntity);
    }
}
