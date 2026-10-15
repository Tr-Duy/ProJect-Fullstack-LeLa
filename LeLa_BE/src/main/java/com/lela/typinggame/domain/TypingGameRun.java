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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "typing_game_runs")
public class TypingGameRun extends AuditableEntity {

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 10)
    private TypingGameMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TypingGameRunStatus status = TypingGameRunStatus.IN_PROGRESS;

    @Column(name = "score", nullable = false)
    @Builder.Default
    private Integer score = 0;

    @Column(name = "stage_reached", nullable = false)
    @Builder.Default
    private Integer stageReached = 1;

    @Column(name = "total_stages", nullable = false)
    @Builder.Default
    private Integer totalStages = 1;

    @Column(name = "lives_left", nullable = false)
    @Builder.Default
    private Integer livesLeft = 3;

    @Column(name = "current_combo", nullable = false)
    @Builder.Default
    private Integer currentCombo = 0;

    @Column(name = "max_combo", nullable = false)
    @Builder.Default
    private Integer maxCombo = 0;

    @Column(name = "words_cleared", nullable = false)
    @Builder.Default
    private Integer wordsCleared = 0;

    @Column(name = "words_missed", nullable = false)
    @Builder.Default
    private Integer wordsMissed = 0;

    @Column(name = "total_keystrokes", nullable = false)
    @Builder.Default
    private Integer totalKeystrokes = 0;

    @Column(name = "wrong_keystrokes", nullable = false)
    @Builder.Default
    private Integer wrongKeystrokes = 0;

    @Column(name = "accuracy", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal accuracy = BigDecimal.ZERO;

    @Column(name = "wpm", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal wpm = BigDecimal.ZERO;

    @Column(name = "xp_earned", nullable = false)
    @Builder.Default
    private Integer xpEarned = 0;

    @Column(name = "current_stage_served_at")
    private LocalDateTime currentStageServedAt;

    @Column(name = "flagged_cheat", nullable = false)
    @Builder.Default
    private Boolean flaggedCheat = false;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
}
