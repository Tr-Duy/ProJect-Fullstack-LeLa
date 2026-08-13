package com.lela.deck;

import com.lela.deck.dto.DeckRequest;
import com.lela.deck.dto.DeckResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

public interface DeckService {
    @Transactional
    DeckResponse createDeck(DeckRequest request);

    @Transactional
    DeckResponse updateDeck(Long id, DeckRequest request);

    @Transactional(readOnly = true)
    DeckResponse getDeckById(Long id);

    @Transactional(readOnly = true)
    Page<DeckResponse> getAllDecks(Long examTypeId, Long levelId, Pageable pageable);

    @Transactional(readOnly = true)
    Page<DeckResponse> getDecksByOwner(Long ownerId, Long examTypeId, Long levelId, Pageable pageable);

    @Transactional
    void deleteDeck(Long id);
}
