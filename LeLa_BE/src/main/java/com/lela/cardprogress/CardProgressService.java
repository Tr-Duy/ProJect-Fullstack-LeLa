package com.lela.cardprogress;

import com.lela.cardprogress.dto.CardProgressResponse;
import com.lela.cardprogress.dto.CardProgressSummaryRepponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CardProgressService {
    Page<CardProgressSummaryRepponse> getProgressByDeck(Long deckId, Pageable pageable);

    Page<CardProgressSummaryRepponse> getReviewCards(Long deckId, Pageable pageable);
    CardProgressResponse getProgressDetail(Long cardId);
    Page<CardProgressSummaryRepponse> getNewCards(Long deckId, Pageable pageable);

    void suspendCard(Long cardId);

    void resetProgress(Long cardId);
}