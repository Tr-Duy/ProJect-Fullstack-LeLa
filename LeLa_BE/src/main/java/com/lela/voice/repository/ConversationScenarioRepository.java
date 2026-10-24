package com.lela.voice.repository;

import com.lela.voice.domain.ConversationScenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationScenarioRepository extends JpaRepository<ConversationScenario, Long> {
    Optional<ConversationScenario> findBySlug(String slug);

    List<ConversationScenario> findByIsActiveTrue();

    @Query("SELECT s FROM ConversationScenario s WHERE s.isActive = true AND s.levelMin <= :level AND s.levelMax >= :level")
    List<ConversationScenario> findActiveForLevel(@Param("level") Integer level);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"topic"})
    @Query("""
        SELECT s FROM ConversationScenario s
        WHERE (:topicId IS NULL OR (s.topic IS NOT NULL AND s.topic.id = :topicId))
          AND (:isActive IS NULL OR s.isActive = :isActive)
          AND (:search IS NULL OR :search = '' OR 
               LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(s.slug) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(s.aiRole) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(s.userRole) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    org.springframework.data.domain.Page<ConversationScenario> findWithFilters(
            @Param("topicId") Long topicId,
            @Param("isActive") Boolean isActive,
            @Param("search") String search,
            org.springframework.data.domain.Pageable pageable
    );
}
