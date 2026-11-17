package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.flashcard.domain.Flashcard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DeckTestQuestionGeneratorTest {

    private DeckTestQuestionGenerator generator;
    private DeckCardFilter filter;

    @BeforeEach
    void setUp() {
        filter = new DeckCardFilter();
        generator = new DeckTestQuestionGenerator(filter);
    }

    private Flashcard createCard(Long id, String front, String back, String pos) {
        Flashcard f = new Flashcard();
        f.setId(id);
        f.setFrontText(front);
        f.setBackText(back);
        f.setPartOfSpeech(pos);
        f.isActive = true;
        return f;
    }

    private List<Flashcard> sampleDeck(int count) {
        List<Flashcard> cards = new ArrayList<>();
        String[] words = {"apple", "banana", "orange", "grape", "mango", "lemon", "peach", "cherry",
                "strawberry", "blueberry", "pineapple", "watermelon", "coconut", "papaya", "avocado", "apricot"};
        String[] meanings = {"quả táo", "quả chuối", "quả cam", "quả nho", "quả xoài", "quả chanh", "quả đào", "quả anh đào",
                "quả dâu tây", "quả việt quất", "quả dứa", "quả dưa hấu", "quả dừa", "quả đu đủ", "quả bơ", "quả mơ"};
        for (int i = 0; i < count; i++) {
            cards.add(createCard((long) (i + 1), words[i % words.length] + (i >= words.length ? "_" + i : ""),
                    meanings[i % meanings.length] + (i >= meanings.length ? " " + i : ""), "noun"));
        }
        return cards;
    }

    @Test
    @DisplayName("Ném ngoại lệ nếu bộ thẻ có ít hơn 8 thẻ hợp lệ")
    void shouldThrowIfLessThan8ValidCards() {
        List<Flashcard> smallDeck = sampleDeck(7);
        assertThatThrownBy(() -> generator.generateExam(smallDeck, List.of(), 10, 2, 20, 60))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ít nhất 8 thẻ hợp lệ");
    }

    @Test
    @DisplayName("Sinh đề thi đầy đủ 2 phần với bộ thẻ 16 từ")
    void shouldGenerateFullExamFor16Cards() {
        List<Flashcard> deck = sampleDeck(16);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 2, 20, 60);

        assertThat(exam.mcScreens()).hasSize(10);
        assertThat(exam.matchingScreens()).hasSize(2);
        assertThat(exam.allScreens()).hasSize(12);

        // Kiểm tra Part 1 (MC)
        for (DeckTestQuestionGenerator.GeneratedScreen mc : exam.mcScreens()) {
            assertThat(mc.type()).isEqualTo("MULTIPLE_CHOICE_MEANING");
            assertThat(mc.seconds()).isEqualTo(20);
            assertThat(mc.left()).hasSize(4); // 4 lựa chọn
            assertThat(mc.solution()).containsKey("answer");
            String correctKey = mc.solution().get("answer");
            assertThat(mc.left().stream().anyMatch(c -> c.getId().equals(correctKey))).isTrue();
        }

        // Kiểm tra Part 2 (Matching)
        for (DeckTestQuestionGenerator.GeneratedScreen match : exam.matchingScreens()) {
            assertThat(match.type()).isEqualTo("MATCHING_PAIRS");
            assertThat(match.seconds()).isEqualTo(60);
            assertThat(match.left()).hasSize(4);
            assertThat(match.right()).hasSize(4);
            assertThat(match.solution()).hasSize(4);
        }
    }

    @Test
    @DisplayName("Cột nối cặp không được thẳng hàng 100%")
    void shouldNotHaveAlignedMatchingColumns() {
        List<Flashcard> deck = sampleDeck(12);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 5, 1, 20, 60);

        assertThat(exam.matchingScreens()).isNotEmpty();
        DeckTestQuestionGenerator.GeneratedScreen screen = exam.matchingScreens().getFirst();

        boolean fullyAligned = true;
        for (int i = 0; i < screen.left().size(); i++) {
            String leftId = screen.left().get(i).getId();
            String rightId = screen.right().get(i).getId();
            if (!screen.solution().get(leftId).equals(rightId)) {
                fullyAligned = false;
                break;
            }
        }
        assertThat(fullyAligned).isFalse();
    }
}
