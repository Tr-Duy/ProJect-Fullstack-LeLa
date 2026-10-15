package com.lela.typinggame;

import com.lela.typinggame.domain.TypingGameRunWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TypingGameRunWordRepository extends JpaRepository<TypingGameRunWord, Long> {

    @Query("SELECT rw FROM TypingGameRunWord rw JOIN FETCH rw.flashcard WHERE rw.run.id = :runId AND rw.stageNo = :stageNo ORDER BY rw.positionNo ASC")
    List<TypingGameRunWord> findByRunIdAndStageNoWithFlashcard(@Param("runId") Long runId, @Param("stageNo") Integer stageNo);

    @Query("SELECT rw FROM TypingGameRunWord rw JOIN FETCH rw.flashcard WHERE rw.run.id = :runId ORDER BY rw.stageNo ASC, rw.positionNo ASC")
    List<TypingGameRunWord> findAllByRunIdWithFlashcard(@Param("runId") Long runId);

    @Query("SELECT rw FROM TypingGameRunWord rw WHERE rw.run.id = :runId AND rw.flashcard.id = :cardId")
    Optional<TypingGameRunWord> findByRunIdAndFlashcardId(@Param("runId") Long runId, @Param("cardId") Long cardId);
}
