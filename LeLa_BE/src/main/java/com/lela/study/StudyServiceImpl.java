package com.lela.study;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.common.exception.NotFoundExeception;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.FlashcardTagRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.flashcard.domain.FlashcardTag;
import com.lela.flashcard.dto.FlashcardResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyServiceImpl implements StudyService {

    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardTagRepository flashcardTagRepository;
    private final CardProgressRepository cardProgressRepository;
    private final UsersRepository usersRepository;

    private Users getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null || "anonymousUser".equalsIgnoreCase(username)) {
            return null;
        }
        return usersRepository.findByUsername(username).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardResponse> getStudyCards(Long deckId, String mode) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new NotFoundExeception("Bộ thẻ không tồn tại"));

        List<Flashcard> allCards = flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId());
        if (allCards.isEmpty()) {
            return Collections.emptyList();
        }

        // Preload tagIds for all cards
        List<Long> cardIds = allCards.stream().map(Flashcard::getId).toList();
        Map<Long, List<Long>> tagIdsByCardId = new HashMap<>();
        if (!cardIds.isEmpty()) {
            List<FlashcardTag> allTags = flashcardTagRepository.findByFlashcardIdIn(cardIds);
            for (FlashcardTag ft : allTags) {
                tagIdsByCardId.computeIfAbsent(ft.getFlashcard().getId(), k -> new ArrayList<>()).add(ft.getTag().getId());
            }
        }

        boolean isCramMode = "cram".equalsIgnoreCase(mode);
        if (isCramMode) {
            // Chế độ Ôn tập tự do (Cram Mode):
            // Lấy toàn bộ thẻ thuộc bộ thẻ đó (bỏ qua điều kiện lọc next_review_at <= NOW()), xáo trộn ngẫu nhiên để ôn lại
            List<FlashcardResponse> responses = new ArrayList<>();
            for (Flashcard card : allCards) {
                responses.add(FlashcardResponse.fromEntity(card, tagIdsByCardId.getOrDefault(card.getId(), Collections.emptyList())));
            }
            Collections.shuffle(responses, new Random());
            return responses;
        }

        // Chế độ SRS thông thường:
        Users user = getCurrentUser();
        if (user == null) {
            List<FlashcardResponse> responses = new ArrayList<>();
            for (Flashcard card : allCards) {
                responses.add(FlashcardResponse.fromEntity(card, tagIdsByCardId.getOrDefault(card.getId(), Collections.emptyList())));
            }
            return responses;
        }

        List<CardProgress> userProgress = cardProgressRepository.findAllByUserIdAndDeckId(user.getId(), deck.getId());
        Map<Long, CardProgress> progressMap = userProgress.stream()
                .filter(cp -> cp.getCard() != null)
                .collect(Collectors.toMap(cp -> cp.getCard().getId(), cp -> cp, (a, b) -> a));

        LocalDateTime now = LocalDateTime.now();
        List<Flashcard> dueCards = new ArrayList<>();
        List<Flashcard> newCards = new ArrayList<>();

        for (Flashcard card : allCards) {
            CardProgress cp = progressMap.get(card.getId());
            if (cp == null || cp.getState() == CardProgressState.NEW) {
                newCards.add(card);
            } else if (cp.getState() != CardProgressState.SUSPENDED) {
                if (cp.getDueAt() == null || !cp.getDueAt().isAfter(now)) {
                    dueCards.add(card);
                }
            }
        }

        int maxNew = 20;
        int maxReview = 100;
        List<Flashcard> selectedCards = new ArrayList<>();
        selectedCards.addAll(dueCards.stream().limit(maxReview).toList());
        selectedCards.addAll(newCards.stream().limit(maxNew).toList());

        List<FlashcardResponse> responses = new ArrayList<>();
        for (Flashcard card : selectedCards) {
            responses.add(FlashcardResponse.fromEntity(card, tagIdsByCardId.getOrDefault(card.getId(), Collections.emptyList())));
        }
        return responses;
    }
}
