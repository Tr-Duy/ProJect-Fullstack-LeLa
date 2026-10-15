package com.lela.typinggame.domain;

import com.lela.domain.AuditableEntity;
import com.lela.flashcard.domain.Flashcard;
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

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "typing_game_run_words")
public class TypingGameRunWord extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private TypingGameRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(name = "stage_no", nullable = false)
    private Integer stageNo;

    @Column(name = "position_no", nullable = false)
    private Integer positionNo;

    @Column(name = "is_heart_word", nullable = false)
    @Builder.Default
    private Boolean isHeartWord = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    @Builder.Default
    private TypingWordResult result = TypingWordResult.PENDING;

    @Column(name = "wrong_keystrokes", nullable = false)
    @Builder.Default
    private Integer wrongKeystrokes = 0;

    @Column(name = "client_duration_ms", nullable = false)
    @Builder.Default
    private Integer clientDurationMs = 0;

    @Column(name = "cleared_at")
    private LocalDateTime clearedAt;
}
