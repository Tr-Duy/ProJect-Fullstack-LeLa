package com.lela.flashcard;

import com.lela.flashcard.dto.FlashcardRequest;
import com.lela.flashcard.dto.FlashcardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface FlashcardService {
    
    FlashcardResponse createFlashcard(FlashcardRequest request);
    
    FlashcardResponse updateFlashcard(Long id, FlashcardRequest request);
    
    FlashcardResponse getFlashcardById(Long id);
    
    Page<FlashcardResponse> getFlashcardsByDeck(Long deckId, Pageable pageable);
    
    Page<FlashcardResponse> getFlashcardsByTag(Long tagId, Pageable pageable);
    
    void deleteFlashcard(Long id);
    
    List<FlashcardResponse> bulkCreateFlashcards(List<FlashcardRequest> requests);
    
    void reorderFlashcards(Long deckId, List<Long> flashcardIds);
}
