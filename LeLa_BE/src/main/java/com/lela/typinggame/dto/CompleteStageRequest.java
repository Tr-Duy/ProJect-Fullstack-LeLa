package com.lela.typinggame.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteStageRequest {

    @NotEmpty(message = "Danh sách events không được rỗng")
    @Valid
    private List<TypingWordEventDto> events;
}
