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

    // Filter public non-level-gated decks only (for Guests and Learners without level)
    Page<Deck> findByIsActiveTrueAndExamTypeIsNullAndLevelIsNull(Pageable pageable);

    // Filter public non-level-gated decks OR level-gated decks matching user's level (for Learners with level)
    @org.springframework.data.jpa.repository.Query("SELECT d FROM Deck d WHERE d.isActive = true AND ((d.examType IS NULL AND d.level IS NULL) OR d.level.id = :levelId)")
    Page<Deck> findByIsActiveTrueAndNonGatedOrLevelId(@org.springframework.data.repository.query.Param("levelId") Long levelId, Pageable pageable);

    // Filter public non-level-gated decks OR level-gated decks up to user's level display order
    @org.springframework.data.jpa.repository.Query("SELECT d FROM Deck d LEFT JOIN d.level l WHERE d.isActive = true AND ((d.examType IS NULL AND d.level IS NULL) OR l.displayOrder <= :maxDisplayOrder)")
    Page<Deck> findAccessibleDecksUpToDisplayOrder(@org.springframework.data.repository.query.Param("maxDisplayOrder") Integer maxDisplayOrder, Pageable pageable);
}
