package com.lela.voice.repository;

import com.lela.voice.domain.ConversationTargetWord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationTargetWordRepository extends JpaRepository<ConversationTargetWord, Long> {

    @EntityGraph(attributePaths = {"flashcard"})
    List<ConversationTargetWord> findBySessionId(Long sessionId);

    @Query("SELECT tw FROM ConversationTargetWord tw JOIN FETCH tw.flashcard WHERE tw.session.id = :sessionId")
    List<ConversationTargetWord> findBySessionIdWithFlashcard(@Param("sessionId") Long sessionId);

    @EntityGraph(attributePaths = {"flashcard"})
    Optional<ConversationTargetWord> findBySessionIdAndFlashcardId(Long sessionId, Long flashcardId);
}
