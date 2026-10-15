package com.lela.voice.repository;

import com.lela.voice.domain.ConversationTurn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationTurnRepository extends JpaRepository<ConversationTurn, Long> {
    List<ConversationTurn> findBySessionIdOrderByTurnNumberAsc(Long sessionId);
    long countBySessionIdAndIsValidTrue(Long sessionId);
}
