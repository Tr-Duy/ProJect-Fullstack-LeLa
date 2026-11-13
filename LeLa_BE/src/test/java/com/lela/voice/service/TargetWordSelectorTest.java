package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.flashcard.domain.Flashcard;
import com.lela.voice.repository.ConversationTargetWordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TargetWordSelectorTest {
    @Test
    void scenarioWithoutTopicDoesNotBorrowGlobalVocabulary() {
        assertTrue(targetWordSelector.selectTargetWords(10L,
                com.lela.voice.domain.ConversationScenario.builder().build()).isEmpty());
        verifyNoInteractions(flashcardRepository, cardProgressRepository);
    }

    @Test
    void scenarioSelectionExcludesCardsFromOtherTopics() {
        var topic = new com.lela.deck.domain.Topic(); topic.setId(7L);
        var otherTopic = new com.lela.deck.domain.Topic(); otherTopic.setId(8L);
        var deck = new com.lela.deck.domain.Deck(); deck.setTopic(topic);
        var otherDeck = new com.lela.deck.domain.Deck(); otherDeck.setTopic(otherTopic);
        var matching = new Flashcard(); matching.setId(1L); matching.setDeck(deck); matching.isActive = true;
        var unrelated = new Flashcard(); unrelated.setId(2L); unrelated.setDeck(otherDeck); unrelated.isActive = true;
        var one = new CardProgress(); one.setCard(matching); one.setState(CardProgressState.REVIEW);
        var two = new CardProgress(); two.setCard(unrelated); two.setState(CardProgressState.REVIEW);
        when(cardProgressRepository.findAllByUserId(10L)).thenReturn(List.of(two, one));
        when(flashcardRepository.findByDeckTopicIdAndIsActiveTrue(eq(7L), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());
        assertEquals(List.of(matching), targetWordSelector.selectTargetWords(10L,
                com.lela.voice.domain.ConversationScenario.builder().topic(topic).build()));
    }

    @Mock
    private CardProgressRepository cardProgressRepository;

    @Mock
    private ConversationTargetWordRepository targetWordRepository;

    @Mock private com.lela.flashcard.FlashcardRepository flashcardRepository;

    @InjectMocks
    private TargetWordSelector targetWordSelector;

    @Test
    @DisplayName("Ưu tiên chọn Weak Words (lapse_count >= 2 hoặc again_count > 0) trước các từ LEARNING khác")
    void testTargetWordSelectorPrioritizesWeakWords() {
        Flashcard cardWeak1 = new Flashcard(); cardWeak1.setId(1L); cardWeak1.setFrontText("accommodate");
        Flashcard cardWeak2 = new Flashcard(); cardWeak2.setId(2L); cardWeak2.setFrontText("negotiate");
        Flashcard cardNormal = new Flashcard(); cardNormal.setId(3L); cardNormal.setFrontText("benefit");
        Flashcard cardReview = new Flashcard(); cardReview.setId(4L); cardReview.setFrontText("schedule");

        CardProgress pWeak1 = new CardProgress();
        pWeak1.setCard(cardWeak1);
        pWeak1.setState(CardProgressState.LEARNING);
        pWeak1.setLapseCount(3);
        pWeak1.setAgainCount(1);

        CardProgress pWeak2 = new CardProgress();
        pWeak2.setCard(cardWeak2);
        pWeak2.setState(CardProgressState.LEARNING);
        pWeak2.setLapseCount(0);
        pWeak2.setAgainCount(2);

        CardProgress pNormal = new CardProgress();
        pNormal.setCard(cardNormal);
        pNormal.setState(CardProgressState.LEARNING);
        pNormal.setLapseCount(0);
        pNormal.setAgainCount(0);

        CardProgress pReview = new CardProgress();
        pReview.setCard(cardReview);
        pReview.setState(CardProgressState.REVIEW);
        pReview.setLapseCount(0);
        pReview.setAgainCount(0);

        when(cardProgressRepository.findAllByUserId(10L))
                .thenReturn(List.of(pNormal, pWeak2, pReview, pWeak1));

        List<Flashcard> selected = targetWordSelector.selectTargetWords(10L);

        assertNotNull(selected);
        assertTrue(selected.size() >= 3 && selected.size() <= 5);
        // Hai từ yếu phải đứng đầu theo thứ tự lapseCount
        assertEquals("accommodate", selected.get(0).getFrontText());
        assertEquals("negotiate", selected.get(1).getFrontText());
    }
}
