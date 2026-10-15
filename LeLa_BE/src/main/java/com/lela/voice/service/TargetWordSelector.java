package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.flashcard.domain.Flashcard;
import com.lela.voice.domain.ConversationTargetWord;
import com.lela.voice.repository.ConversationTargetWordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TargetWordSelector {

    private final CardProgressRepository cardProgressRepository;
    private final ConversationTargetWordRepository targetWordRepository;

    /**
     * Chọn 3–5 từ mục tiêu:
     * - Ưu tiên LEARNING + Weak Words (lapse_count >= 2 hoặc again_count > 0)
     * - Tránh trùng lặp hoàn toàn với 2 session gần nhất
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Flashcard> selectTargetWords(Long userId) {
        List<CardProgress> userCards = cardProgressRepository.findAllByUserId(userId);
        if (userCards.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Phân loại từ yếu và từ đang học
        List<CardProgress> weakCards = userCards.stream()
                .filter(cp -> cp.getState() != CardProgressState.NEW && cp.getState() != CardProgressState.SUSPENDED)
                .filter(cp -> (cp.getLapseCount() != null && cp.getLapseCount() >= 2) || (cp.getAgainCount() != null && cp.getAgainCount() > 0))
                .sorted(Comparator.comparingInt(CardProgress::getLapseCount).reversed())
                .collect(Collectors.toList());

        List<CardProgress> learningCards = userCards.stream()
                .filter(cp -> cp.getState() == CardProgressState.LEARNING || cp.getState() == CardProgressState.RELEARNING)
                .collect(Collectors.toList());

        List<CardProgress> reviewCards = userCards.stream()
                .filter(cp -> cp.getState() == CardProgressState.REVIEW)
                .collect(Collectors.toList());

        // Tập hợp danh sách ứng viên có thứ tự ưu tiên
        Set<Long> selectedFlashcardIds = new LinkedHashSet<>();
        List<Flashcard> candidates = new ArrayList<>();

        // Thêm weak cards trước
        for (CardProgress cp : weakCards) {
            if (candidates.size() >= 5) break;
            if (cp.getCard() != null && selectedFlashcardIds.add(cp.getCard().getId())) {
                candidates.add(cp.getCard());
            }
        }

        // Thêm learning cards tiếp theo
        for (CardProgress cp : learningCards) {
            if (candidates.size() >= 5) break;
            if (cp.getCard() != null && selectedFlashcardIds.add(cp.getCard().getId())) {
                candidates.add(cp.getCard());
            }
        }

        // Thêm review cards nếu vẫn chưa đủ 3 từ
        if (candidates.size() < 3) {
            Collections.shuffle(reviewCards);
            for (CardProgress cp : reviewCards) {
                if (candidates.size() >= 5) break;
                if (cp.getCard() != null && selectedFlashcardIds.add(cp.getCard().getId())) {
                    candidates.add(cp.getCard());
                }
            }
        }

        return candidates;
    }
}
