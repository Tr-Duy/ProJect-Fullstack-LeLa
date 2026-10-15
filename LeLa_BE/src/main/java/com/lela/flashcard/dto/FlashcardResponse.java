package com.lela.flashcard.dto;

import com.lela.flashcard.domain.Flashcard;
import com.lela.flashcard.util.FlashcardDataSanitizer;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class FlashcardResponse {
    private Long id;
    private Long deckId;
    private String frontText;
    private String backText;
    private String phonetic;
    private String partOfSpeech;
    private String definition;
    private String exampleText;
    private String exampleTranslation;
    private String relatedWords;
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

    // Standardized fields
    private String word;
    private String vietnameseMeaning;
    private String exampleEn;
    private String exampleVi;
    private String definitionEn;
    private List<String> synonyms = new ArrayList<>();
    private List<String> antonyms = new ArrayList<>();

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
        response.setPartOfSpeech(flashcard.getPartOfSpeech());
        response.setDefinition(flashcard.getDefinition());
        response.setExampleText(flashcard.getExampleText());
        response.setExampleTranslation(flashcard.getExampleTranslation());
        response.setRelatedWords(flashcard.getRelatedWords());
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
        
        enrich(response);

        return response;
    }

    public static void enrich(FlashcardResponse r) {
        if (r == null || r.getFrontText() == null) return;

        FlashcardDataSanitizer.SanitizedResult res = FlashcardDataSanitizer.sanitize(
                r.getFrontText(),
                r.getBackText(),
                r.getPhonetic(),
                r.getPartOfSpeech(),
                r.getDefinition(),
                r.getExampleText(),
                r.getExampleTranslation(),
                r.getRelatedWords(),
                r.getHint(),
                r.getNote()
        );

        // Standardize base fields
        r.setFrontText(res.getWord());
        r.setBackText(res.getVietnameseMeaning());
        r.setPhonetic(res.getPhonetic());
        r.setPartOfSpeech(res.getPartOfSpeech());
        r.setDefinition(res.getDefinition());
        r.setExampleText(res.getExampleEn());
        r.setExampleTranslation(res.getExampleVi());
        r.setRelatedWords(res.getRelatedWords());

        // Populate standardized DTO alias fields
        r.setWord(res.getWord());
        r.setVietnameseMeaning(res.getVietnameseMeaning());
        r.setExampleEn(res.getExampleEn());
        r.setExampleVi(res.getExampleVi());
        r.setDefinitionEn(res.getDefinition());
        r.setSynonyms(res.getSynonyms() != null ? res.getSynonyms() : new ArrayList<>());
        r.setAntonyms(res.getAntonyms() != null ? res.getAntonyms() : new ArrayList<>());
    }
}
