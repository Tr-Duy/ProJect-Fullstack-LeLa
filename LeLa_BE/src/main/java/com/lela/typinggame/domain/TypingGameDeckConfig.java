package com.lela.typinggame.domain;

import com.lela.deck.domain.Deck;
import com.lela.domain.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "typing_game_deck_configs")
public class TypingGameDeckConfig extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false, unique = true)
    private Deck deck;

    @Column(name = "requires_pro", nullable = false)
    @Builder.Default
    private Boolean requiresPro = false;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;
}
