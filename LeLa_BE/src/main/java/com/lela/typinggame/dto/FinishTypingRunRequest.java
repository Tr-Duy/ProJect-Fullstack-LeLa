package com.lela.typinggame.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinishTypingRunRequest {

    @Valid
    private List<TypingWordEventDto> events;

    private String reason; // "LIVES_DEPLETED", "VICTORY", "USER_QUIT"
}
