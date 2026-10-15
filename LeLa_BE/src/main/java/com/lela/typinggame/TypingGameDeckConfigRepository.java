package com.lela.typinggame;

import com.lela.typinggame.domain.TypingGameDeckConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TypingGameDeckConfigRepository extends JpaRepository<TypingGameDeckConfig, Long> {
    Optional<TypingGameDeckConfig> findByDeckId(Long deckId);
}
