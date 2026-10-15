package com.lela.typinggame;

import com.lela.typinggame.domain.TypingGameHighScore;
import com.lela.typinggame.domain.TypingGameMode;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TypingGameHighScoreRepository extends JpaRepository<TypingGameHighScore, Long> {

    @Query("SELECT hs FROM TypingGameHighScore hs WHERE hs.user.id = :userId AND hs.deck.id = :deckId AND hs.mode = :mode")
    Optional<TypingGameHighScore> findByUserIdAndDeckIdAndMode(@Param("userId") Long userId, @Param("deckId") Long deckId, @Param("mode") TypingGameMode mode);

    @Query("SELECT hs FROM TypingGameHighScore hs JOIN FETCH hs.user WHERE hs.deck.id = :deckId AND hs.mode = :mode ORDER BY hs.bestScore DESC, hs.bestWpm DESC, hs.bestAccuracy DESC")
    List<TypingGameHighScore> findTopByDeckIdAndMode(@Param("deckId") Long deckId, @Param("mode") TypingGameMode mode, Pageable pageable);

    @Query("SELECT hs FROM TypingGameHighScore hs WHERE hs.user.id = :userId AND hs.deck.id = :deckId")
    List<TypingGameHighScore> findAllByUserIdAndDeckId(@Param("userId") Long userId, @Param("deckId") Long deckId);
}
