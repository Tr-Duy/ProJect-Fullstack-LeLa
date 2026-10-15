package com.lela.typinggame.dto;

import com.lela.typinggame.domain.TypingWordResult;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingWordEventDto {

    @NotNull(message = "flashcardId không được để trống")
    private Long flashcardId;

    @NotNull(message = "result không được để trống")
    private TypingWordResult result;

    private Integer wrongKeystrokes;

    private List<Integer> wrongAtIndexes;

    private Integer clientDurationMs;
}
