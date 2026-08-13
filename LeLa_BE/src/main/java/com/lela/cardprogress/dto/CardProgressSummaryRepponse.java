package com.lela.cardprogress.dto;

import com.lela.cardprogress.domain.CardProgressState;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CardProgressSummaryRepponse {
    private Long id;
    private Long cardId;
    private CardProgressState state;
    private LocalDateTime dueAt;
    private LocalDateTime updatedAt;
}