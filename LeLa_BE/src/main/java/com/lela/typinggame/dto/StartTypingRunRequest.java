package com.lela.typinggame.dto;

import com.lela.typinggame.domain.TypingGameMode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartTypingRunRequest {

    @NotNull(message = "deckId không được để trống")
    private Long deckId;

    @NotNull(message = "mode không được để trống")
    private TypingGameMode mode;

    @Builder.Default
    private Boolean forceRestart = false;

    @Builder.Default
    private Boolean expandedChallenge = false;
}
