package com.lela.flashcard;

import com.lela.flashcard.domain.Flashcard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    
    Page<Flashcard> findByDeckId(Long deckId, Pageable pageable);
    
    Page<Flashcard> findByDeckIdAndIsActiveTrue(Long deckId, Pageable pageable);
    
    @org.springframework.data.jpa.repository.Query("SELECT ft.flashcard FROM FlashcardTag ft WHERE ft.tag.id = :tagId AND ft.flashcard.isActive = true")
    Page<Flashcard> findByTagIdAndIsActiveTrue(@org.springframework.data.repository.query.Param("tagId") Long tagId, Pageable pageable);
    
}
