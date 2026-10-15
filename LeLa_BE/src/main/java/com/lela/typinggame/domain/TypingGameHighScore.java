package com.lela.typinggame.domain;

import com.lela.deck.domain.Deck;
import com.lela.domain.AuditableEntity;
import com.lela.users.domain.Users;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "typing_game_high_scores")
public class TypingGameHighScore extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 10)
    private TypingGameMode mode;

    @Column(name = "best_score", nullable = false)
    @Builder.Default
    private Integer bestScore = 0;

    @Column(name = "best_stage", nullable = false)
    @Builder.Default
    private Integer bestStage = 1;

    @Column(name = "best_wpm", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal bestWpm = BigDecimal.ZERO;

    @Column(name = "best_accuracy", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal bestAccuracy = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id")
    private TypingGameRun run;
}
