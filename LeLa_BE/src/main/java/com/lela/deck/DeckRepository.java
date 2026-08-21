package com.lela.deck;

import com.lela.deck.domain.Deck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface DeckRepository extends JpaRepository<Deck, Long>, JpaSpecificationExecutor<Deck> {
    
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

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT DISTINCT d FROM Deck d " +
                "LEFT JOIN d.tags t " +
                "WHERE d.isActive = true AND " +
                "(:search IS NULL OR :search = '' OR LOWER(d.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(d.deckCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(d.slug) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR (d.description IS NOT NULL AND LOWER(d.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) AND " +
                "(:levelId IS NULL OR (d.level IS NOT NULL AND d.level.id = :levelId)) AND " +
                "(:topicId IS NULL OR (d.topic IS NOT NULL AND d.topic.id = :topicId)) AND " +
                "(:tagId IS NULL OR (t IS NOT NULL AND t.id = :tagId)) AND " +
                "(:difficulty IS NULL OR d.difficulty = :difficulty) AND " +
                "(:status IS NULL OR d.status = :status) AND " +
                "(:visibility IS NULL OR d.visibility = :visibility)"
    )
    Page<Deck> findWithFilters(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("levelId") Long levelId,
            @org.springframework.data.repository.query.Param("topicId") Long topicId,
            @org.springframework.data.repository.query.Param("tagId") Long tagId,
            @org.springframework.data.repository.query.Param("difficulty") com.lela.deck.domain.DeckDifficulty difficulty,
            @org.springframework.data.repository.query.Param("status") com.lela.deck.domain.DeckStatus status,
            @org.springframework.data.repository.query.Param("visibility") com.lela.deck.domain.DeckVisibility visibility,
            Pageable pageable
    );
}
