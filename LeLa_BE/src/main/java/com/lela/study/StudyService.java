package com.lela.study;

import com.lela.flashcard.dto.FlashcardResponse;
import java.util.List;

public interface StudyService {
    List<FlashcardResponse> getStudyCards(Long deckId, String mode);
}
