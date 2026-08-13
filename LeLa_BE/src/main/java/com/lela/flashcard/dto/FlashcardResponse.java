package com.lela.flashcard.dto;

import com.lela.flashcard.domain.Flashcard;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class FlashcardResponse {
    private Long id;
    private Long deckId;
    private String frontText;
    private String backText;
    private String phonetic;
    private String exampleText;
    private String hint;
    private String note;
    private String frontImageUrl;
    private String backImageUrl;
    private String frontAudioUrl;
    private String backAudioUrl;
    private Integer cardOrder;
    private String cardColor;
    private Boolean isActive;
    private Long createdById;
    private Long updatedById;
    private LocalDateTime deletedAt;
    private Long version;
    private List<Long> tagIds;

    public static FlashcardResponse fromEntity(Flashcard flashcard, List<Long> tagIds) {
        if (flashcard == null) return null;
        
        FlashcardResponse response = new FlashcardResponse();
        response.setId(flashcard.getId());
        
        if (flashcard.getDeck() != null) {
            response.setDeckId(flashcard.getDeck().getId());
        }
        
        response.setFrontText(flashcard.getFrontText());
        response.setBackText(flashcard.getBackText());
        response.setPhonetic(flashcard.getPhonetic());
        response.setExampleText(flashcard.getExampleText());
        response.setHint(flashcard.getHint());
        response.setNote(flashcard.getNote());
        response.setFrontImageUrl(flashcard.getFrontImageUrl());
        response.setBackImageUrl(flashcard.getBackImageUrl());
        response.setFrontAudioUrl(flashcard.getFrontAudioUrl());
        response.setBackAudioUrl(flashcard.getBackAudioUrl());
        response.setCardOrder(flashcard.getCardOrder());
        response.setCardColor(flashcard.getCardColor());
        response.setIsActive(flashcard.isActive());
        
        if (flashcard.getCreatedBy() != null) {
            response.setCreatedById(flashcard.getCreatedBy().getId());
        }
        
        if (flashcard.getUpdatedBy() != null) {
            response.setUpdatedById(flashcard.getUpdatedBy().getId());
        }
        
        response.setDeletedAt(flashcard.getDeletedAt());
        response.setVersion(flashcard.getVersion());
        response.setTagIds(tagIds);
        
        return response;
    }
}
