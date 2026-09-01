package com.lela.flashcard;

import com.lela.deck.domain.Deck;
import com.lela.deck.DeckRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.flashcard.domain.FlashcardTag;
import com.lela.flashcard.domain.FlashcardTagId;
import com.lela.tag.domain.Tag;
import com.lela.flashcard.dto.FlashcardRequest;
import com.lela.flashcard.dto.FlashcardResponse;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final FlashcardTagRepository flashcardTagRepository;
    private final DeckRepository deckRepository;
    private final EntityManager entityManager;

    @Transactional
    @Override
    public FlashcardResponse createFlashcard(FlashcardRequest request) {
        Flashcard flashcard = new Flashcard();
        
        flashcard.setFrontText(request.getFrontText());
        flashcard.setBackText(request.getBackText());
        flashcard.setPhonetic(request.getPhonetic());
        flashcard.setPartOfSpeech(request.getPartOfSpeech());
        flashcard.setDefinition(request.getDefinition());
        flashcard.setExampleText(request.getExampleText());
        flashcard.setExampleTranslation(request.getExampleTranslation());
        flashcard.setRelatedWords(request.getRelatedWords());
        flashcard.setHint(request.getHint());
        flashcard.setNote(request.getNote());
        flashcard.setFrontImageUrl(request.getFrontImageUrl());
        flashcard.setBackImageUrl(request.getBackImageUrl());
        flashcard.setFrontAudioUrl(request.getFrontAudioUrl());
        flashcard.setBackAudioUrl(request.getBackAudioUrl());
        flashcard.setCardColor(request.getCardColor());
        
        if (request.getCardOrder() != null) {
            flashcard.setCardOrder(request.getCardOrder());
        }
        
        flashcard.setActive(true);

        if (request.getDeckId() != null) {
            Deck deck = deckRepository.findById(request.getDeckId())
                    .orElseThrow(() -> new RuntimeException("Deck not found"));
            flashcard.setDeck(deck);
            deck.setTotalCards((deck.getTotalCards() != null ? deck.getTotalCards() : 0) + 1);
            deckRepository.save(deck);
        }

        if (request.getCreatedById() != null) {
            Users creator = entityManager.getReference(Users.class, request.getCreatedById());
            flashcard.setCreatedBy(creator);
            // Mặc định lúc tạo thì người tạo cũng là người cập nhật
            flashcard.setUpdatedBy(creator);
        }

        Flashcard savedFlashcard = flashcardRepository.save(flashcard);

        // Xử lý gắn Tag nếu có truyền lên tagIds
        List<Long> tagIds = new ArrayList<>();
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            for (Long tagId : request.getTagIds()) {
                FlashcardTag flashcardTag = new FlashcardTag();
                FlashcardTagId id = new FlashcardTagId();
                id.setFlashcardId(savedFlashcard.getId());
                id.setTagId(tagId);
                
                flashcardTag.setId(id);
                flashcardTag.setFlashcard(savedFlashcard);
                flashcardTag.setTag(entityManager.getReference(Tag.class, tagId));
                
                flashcardTagRepository.save(flashcardTag);
                tagIds.add(tagId);
            }
        }

        return FlashcardResponse.fromEntity(savedFlashcard, tagIds);
    }

    @Transactional
    @Override
    public FlashcardResponse updateFlashcard(Long id, FlashcardRequest request) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        if (request.getFrontText() != null) flashcard.setFrontText(request.getFrontText());
        if (request.getBackText() != null) flashcard.setBackText(request.getBackText());
        if (request.getPhonetic() != null) flashcard.setPhonetic(request.getPhonetic());
        if (request.getPartOfSpeech() != null) flashcard.setPartOfSpeech(request.getPartOfSpeech());
        if (request.getDefinition() != null) flashcard.setDefinition(request.getDefinition());
        if (request.getExampleText() != null) flashcard.setExampleText(request.getExampleText());
        if (request.getExampleTranslation() != null) flashcard.setExampleTranslation(request.getExampleTranslation());
        if (request.getRelatedWords() != null) flashcard.setRelatedWords(request.getRelatedWords());
        if (request.getHint() != null) flashcard.setHint(request.getHint());
        if (request.getNote() != null) flashcard.setNote(request.getNote());
        if (request.getFrontImageUrl() != null) flashcard.setFrontImageUrl(request.getFrontImageUrl());
        if (request.getBackImageUrl() != null) flashcard.setBackImageUrl(request.getBackImageUrl());
        if (request.getFrontAudioUrl() != null) flashcard.setFrontAudioUrl(request.getFrontAudioUrl());
        if (request.getBackAudioUrl() != null) flashcard.setBackAudioUrl(request.getBackAudioUrl());
        if (request.getCardOrder() != null) flashcard.setCardOrder(request.getCardOrder());
        if (request.getCardColor() != null) flashcard.setCardColor(request.getCardColor());
        if (request.getIsActive() != null) flashcard.setActive(request.getIsActive());

        if (request.getCreatedById() != null) {
            Users updater = entityManager.getReference(Users.class, request.getCreatedById());
            flashcard.setUpdatedBy(updater);
        }

        Flashcard updatedFlashcard = flashcardRepository.save(flashcard);

        // Xử lý cập nhật Tags (xóa hết cũ và thêm mới)
        List<Long> tagIds = new ArrayList<>();
        if (request.getTagIds() != null) {
            flashcardTagRepository.deleteByFlashcardId(id);
            
            for (Long tagId : request.getTagIds()) {
                FlashcardTag flashcardTag = new FlashcardTag();
                FlashcardTagId tagIdKey = new FlashcardTagId();
                tagIdKey.setFlashcardId(updatedFlashcard.getId());
                tagIdKey.setTagId(tagId);
                
                flashcardTag.setId(tagIdKey);
                flashcardTag.setFlashcard(updatedFlashcard);
                flashcardTag.setTag(entityManager.getReference(Tag.class, tagId));
                
                flashcardTagRepository.save(flashcardTag);
                tagIds.add(tagId);
            }
        } else {
            // Lấy lại danh sách tag cũ nếu không gửi lên tagIds mới
            tagIds = flashcardTagRepository.findByFlashcardId(id).stream()
                    .map(ft -> ft.getTag().getId())
                    .collect(Collectors.toList());
        }

        return FlashcardResponse.fromEntity(updatedFlashcard, tagIds);
    }

    @Transactional(readOnly = true)
    @Override
    public FlashcardResponse getFlashcardById(Long id) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));
                
        List<Long> tagIds = flashcardTagRepository.findByFlashcardId(id).stream()
                .map(ft -> ft.getTag().getId())
                .collect(Collectors.toList());
                
        return FlashcardResponse.fromEntity(flashcard, tagIds);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<FlashcardResponse> getFlashcardsByDeck(Long deckId, Pageable pageable) {
        Page<Flashcard> cardsPage = flashcardRepository.findByDeckIdAndIsActiveTrue(deckId, pageable);
        List<Long> cardIds = cardsPage.getContent().stream().map(Flashcard::getId).collect(Collectors.toList());
        java.util.Map<Long, List<Long>> tagIdsByCardId = new java.util.HashMap<>();
        if (!cardIds.isEmpty()) {
            List<FlashcardTag> allTags = flashcardTagRepository.findByFlashcardIdIn(cardIds);
            for (FlashcardTag ft : allTags) {
                tagIdsByCardId.computeIfAbsent(ft.getFlashcard().getId(), k -> new ArrayList<>()).add(ft.getTag().getId());
            }
        }
        return cardsPage.map(flashcard -> {
            List<Long> tagIds = tagIdsByCardId.getOrDefault(flashcard.getId(), Collections.emptyList());
            return FlashcardResponse.fromEntity(flashcard, tagIds);
        });
    }

    @Transactional(readOnly = true)
    @Override
    public Page<FlashcardResponse> getFlashcardsByTag(Long tagId, Pageable pageable) {
        Page<Flashcard> cardsPage = flashcardRepository.findByTagIdAndIsActiveTrue(tagId, pageable);
        List<Long> cardIds = cardsPage.getContent().stream().map(Flashcard::getId).collect(Collectors.toList());
        java.util.Map<Long, List<Long>> tagIdsByCardId = new java.util.HashMap<>();
        if (!cardIds.isEmpty()) {
            List<FlashcardTag> allTags = flashcardTagRepository.findByFlashcardIdIn(cardIds);
            for (FlashcardTag ft : allTags) {
                tagIdsByCardId.computeIfAbsent(ft.getFlashcard().getId(), k -> new ArrayList<>()).add(ft.getTag().getId());
            }
        }
        return cardsPage.map(flashcard -> {
            List<Long> tagIds = tagIdsByCardId.getOrDefault(flashcard.getId(), Collections.emptyList());
            return FlashcardResponse.fromEntity(flashcard, tagIds);
        });
    }

    @Transactional
    @Override
    public void deleteFlashcard(Long id) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));
        
        flashcard.setActive(false);
        flashcard.setDeletedAt(LocalDateTime.now());
        flashcardRepository.save(flashcard);

        if (flashcard.getDeck() != null) {
            Deck deck = flashcard.getDeck();
            int current = deck.getTotalCards() != null ? deck.getTotalCards() : 0;
            deck.setTotalCards(Math.max(0, current - 1));
            deckRepository.save(deck);
        }
    }

    @Transactional
    @Override
    public List<FlashcardResponse> bulkCreateFlashcards(List<FlashcardRequest> requests) {
        List<FlashcardResponse> responses = new ArrayList<>();
        for (FlashcardRequest request : requests) {
            responses.add(createFlashcard(request));
        }
        return responses;
    }

    @Transactional
    @Override
    public void reorderFlashcards(Long deckId, List<Long> flashcardIds) {
        for (int i = 0; i < flashcardIds.size(); i++) {
            Long id = flashcardIds.get(i);
            Flashcard flashcard = flashcardRepository.findById(id).orElse(null);
            if (flashcard != null && flashcard.getDeck().getId().equals(deckId)) {
                flashcard.setCardOrder(i);
                flashcardRepository.save(flashcard);
            }
        }
    }
}
