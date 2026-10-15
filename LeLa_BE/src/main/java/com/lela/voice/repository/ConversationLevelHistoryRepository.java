package com.lela.voice.repository;

import com.lela.voice.domain.ConversationLevelHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationLevelHistoryRepository extends JpaRepository<ConversationLevelHistory, Long> {
    List<ConversationLevelHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
