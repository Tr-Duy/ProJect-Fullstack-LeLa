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
}
