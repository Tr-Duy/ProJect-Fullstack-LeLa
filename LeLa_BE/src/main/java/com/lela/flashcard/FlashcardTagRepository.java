package com.lela.flashcard;

import com.lela.flashcard.domain.FlashcardTag;
import com.lela.flashcard.domain.FlashcardTagId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardTagRepository extends JpaRepository<FlashcardTag, FlashcardTagId> {
    
    List<FlashcardTag> findByFlashcardId(Long flashcardId);

    List<FlashcardTag> findByFlashcardIdIn(List<Long> flashcardIds);
    
    void deleteByFlashcardId(Long flashcardId);
}
