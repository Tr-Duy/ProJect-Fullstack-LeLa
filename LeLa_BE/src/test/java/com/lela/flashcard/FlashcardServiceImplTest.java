package com.lela.flashcard;

import com.lela.deck.domain.Deck;
import com.lela.flashcard.domain.Flashcard;
import com.lela.flashcard.domain.FlashcardTag;
import com.lela.flashcard.dto.FlashcardRequest;
import com.lela.flashcard.dto.FlashcardResponse;
import com.lela.tag.domain.Tag;
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
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Disabled;
@Disabled
@ExtendWith(MockitoExtension.class)
public class FlashcardServiceImplTest {

    @Mock
    private FlashcardRepository flashcardRepository;

    @Mock
    private FlashcardTagRepository flashcardTagRepository;

    @Mock
    private com.lela.deck.DeckRepository deckRepository;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private FlashcardServiceImpl flashcardService;

    private Flashcard flashcardEntity;

    @BeforeEach
    void setUp() {
        flashcardEntity = new Flashcard();
        flashcardEntity.setId(1L);
        flashcardEntity.setFrontText("Hello");
        flashcardEntity.setBackText("Xin chao");
        flashcardEntity.setActive(true);
        
        Deck deck = new Deck();
        deck.setId(10L);
        flashcardEntity.setDeck(deck);
    }

    @Test
    void createFlashcard_Success() {
        FlashcardRequest request = new FlashcardRequest();
        request.setFrontText("New");
        request.setBackText("Moi");
        request.setDeckId(10L);
        request.setCreatedById(5L);
        request.setTagIds(Arrays.asList(100L));

        Deck deck = new Deck();
        deck.setId(10L);
        
        Users creator = new Users();
        creator.setId(5L);

        Tag tag = new Tag();
        tag.setId(100L);

        when(entityManager.getReference(Deck.class, 10L)).thenReturn(deck);
        when(entityManager.getReference(Users.class, 5L)).thenReturn(creator);
        when(entityManager.getReference(Tag.class, 100L)).thenReturn(tag);
        
        Flashcard savedFlashcard = new Flashcard();
        savedFlashcard.setId(2L);
        savedFlashcard.setFrontText("New");
        savedFlashcard.setDeck(deck);
        
        when(flashcardRepository.save(any(Flashcard.class))).thenReturn(savedFlashcard);

        FlashcardResponse result = flashcardService.createFlashcard(request);

        assertNotNull(result);
        verify(flashcardRepository).save(any(Flashcard.class));
        verify(flashcardTagRepository).save(any(FlashcardTag.class));
    }

    @Test
    void updateFlashcard_Success() {
        FlashcardRequest request = new FlashcardRequest();
        request.setFrontText("Updated Front");

        when(flashcardRepository.findById(1L)).thenReturn(Optional.of(flashcardEntity));
        when(flashcardRepository.save(flashcardEntity)).thenReturn(flashcardEntity);
        when(flashcardTagRepository.findByFlashcardId(1L)).thenReturn(Collections.emptyList());

        FlashcardResponse result = flashcardService.updateFlashcard(1L, request);

        assertNotNull(result);
        assertEquals("Updated Front", flashcardEntity.getFrontText());
        verify(flashcardRepository).save(flashcardEntity);
    }

    @Test
    void updateFlashcard_NotFound_ThrowsException() {
        FlashcardRequest request = new FlashcardRequest();
        when(flashcardRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            flashcardService.updateFlashcard(99L, request);
        });

        assertEquals("Flashcard not found", exception.getMessage());
        verify(flashcardRepository, Mockito.never()).save(any());
    }

    @Test
    void getFlashcardById_Success() {
        when(flashcardRepository.findById(1L)).thenReturn(Optional.of(flashcardEntity));
        when(flashcardTagRepository.findByFlashcardId(1L)).thenReturn(Collections.emptyList());

        FlashcardResponse result = flashcardService.getFlashcardById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(flashcardRepository).findById(1L);
    }

    @Test
    void getFlashcardsByDeck_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Flashcard> page = new PageImpl<>(Arrays.asList(flashcardEntity));
        
        when(flashcardRepository.findByDeckIdAndIsActiveTrue(10L, pageable)).thenReturn(page);
        when(flashcardTagRepository.findByFlashcardId(1L)).thenReturn(Collections.emptyList());

        Page<FlashcardResponse> result = flashcardService.getFlashcardsByDeck(10L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(flashcardRepository).findByDeckIdAndIsActiveTrue(10L, pageable);
    }

    @Test
    void deleteFlashcard_Success() {
        when(flashcardRepository.findById(1L)).thenReturn(Optional.of(flashcardEntity));

        flashcardService.deleteFlashcard(1L);

        assertFalse(flashcardEntity.isActive());
        assertNotNull(flashcardEntity.getDeletedAt());
        verify(flashcardRepository).save(flashcardEntity);
    }
}
