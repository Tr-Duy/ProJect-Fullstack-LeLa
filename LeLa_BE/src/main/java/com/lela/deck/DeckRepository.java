package com.lela.deck;

import com.lela.deck.domain.Deck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeckRepository extends JpaRepository<Deck, Long> {
    
    Optional<Deck> findByDeckCode(String deckCode);
    
    Optional<Deck> findBySlug(String slug);
    
    Page<Deck> findByOwnerId(Long ownerId, Pageable pageable);
    
    boolean existsBySlug(String slug);
    
    boolean existsByDeckCode(String deckCode);

    Page<Deck> findByExamTypeIdAndLevelIdAndIsActiveTrue(Long examTypeId, Long levelId, Pageable pageable);

    Page<Deck> findByOwnerIdAndExamTypeIdAndLevelIdAndIsActiveTrue(Long ownerId, Long examTypeId, Long levelId, Pageable pageable);

    Page<Deck> findByIsActiveTrue(Pageable pageable);

    Page<Deck> findByOwnerIdAndIsActiveTrue(Long ownerId, Pageable pageable);
}
