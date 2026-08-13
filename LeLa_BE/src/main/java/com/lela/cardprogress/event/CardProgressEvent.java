package com.lela.cardprogress.event;

import org.springframework.context.ApplicationEvent;
import lombok.Getter;

@Getter
public class CardProgressEvent extends ApplicationEvent {
    private final Long userId;
    private final Long deckId;
    private final boolean wasMastered;
    private final boolean isMastered;

    public CardProgressEvent(Object source, Long userId, Long deckId, boolean wasMastered, boolean isMastered) {
        super(source);
        this.userId = userId;
        this.deckId = deckId;
        this.wasMastered = wasMastered;
        this.isMastered = isMastered;
    }
}
