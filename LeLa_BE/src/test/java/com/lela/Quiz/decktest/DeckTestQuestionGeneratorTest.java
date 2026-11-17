package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.flashcard.domain.Flashcard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.stream.Collectors;

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
        String[] words = {
                "apple", "banana", "orange", "grape", "mango", "lemon", "peach", "cherry",
                "strawberry", "blueberry", "pineapple", "watermelon", "coconut", "papaya", "avocado", "apricot",
                "plum", "fig", "lime", "pear", "guava", "kiwi", "pomegranate", "raspberry"
        };
        String[] meanings = {
                "quả táo", "quả chuối", "quả cam", "quả nho", "quả xoài", "quả chanh", "quả đào", "quả anh đào",
                "quả dâu tây", "quả việt quất", "quả dứa", "quả dưa hấu", "quả dừa", "quả đu đủ", "quả bơ", "quả mơ",
                "quả mận", "quả sung", "quả chanh xanh", "quả lê", "quả ổi", "quả kiwi", "quả lựu", "quả mâm xôi"
        };
        for (int i = 0; i < count; i++) {
            cards.add(createCard((long) (i + 1), words[i % words.length] + (i >= words.length ? "_" + i : ""),
                    meanings[i % meanings.length] + (i >= meanings.length ? " " + i : ""), "n"));
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
    @DisplayName("Sinh đề thi 18 thẻ: đủ 10 câu MC và 2 màn ghép cặp, không trùng thẻ đích MC")
    void shouldGenerateDisjointExamFor18Cards() {
        List<Flashcard> deck = sampleDeck(18);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 2, 20, 60);

        assertThat(exam.mcScreens()).hasSize(10);
        assertThat(exam.matchingScreens()).hasSize(2);
        assertThat(exam.allScreens()).hasSize(12);

        Set<Long> mcTargetIds = exam.mcScreens().stream()
                .map(DeckTestQuestionGenerator.GeneratedScreen::sourceCardId)
                .collect(Collectors.toSet());
        assertThat(mcTargetIds).hasSize(10);

        // Kiểm tra Part 2 (Matching) không chứa từ nào của MC target
        Set<String> mcTargetEnglishWords = deck.stream()
                .filter(c -> mcTargetIds.contains(c.getId()))
                .map(c -> DeckCardFilter.normalize(c.getFrontText()))
                .collect(Collectors.toSet());

        for (DeckTestQuestionGenerator.GeneratedScreen match : exam.matchingScreens()) {
            for (TimedQuizEngine.Cell cell : match.left()) {
                String matchWord = DeckCardFilter.normalize(cell.getText());
                assertThat(mcTargetEnglishWords).doesNotContain(matchWord);
            }
        }
    }

    @Test
    @DisplayName("Bộ thẻ 16 từ: giảm màn ghép cặp xuống 1 thay vì lặp lại thẻ MC")
    void shouldReduceMatchingScreensWhenCardsAreFew() {
        List<Flashcard> deck = sampleDeck(16);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 2, 20, 60);

        // 16 thẻ: 10 thẻ cho MC, còn 6 thẻ -> chỉ đủ cho 1 màn ghép cặp (4 thẻ), không lặp lại thẻ MC
        assertThat(exam.mcScreens()).hasSize(10);
        assertThat(exam.matchingScreens()).hasSize(1);
        assertThat(exam.allScreens()).hasSize(11);

        Set<Long> mcTargetIds = exam.mcScreens().stream()
                .map(DeckTestQuestionGenerator.GeneratedScreen::sourceCardId)
                .collect(Collectors.toSet());

        Set<String> mcTargetEnglishWords = deck.stream()
                .filter(c -> mcTargetIds.contains(c.getId()))
                .map(c -> DeckCardFilter.normalize(c.getFrontText()))
                .collect(Collectors.toSet());

        for (DeckTestQuestionGenerator.GeneratedScreen match : exam.matchingScreens()) {
            for (TimedQuizEngine.Cell cell : match.left()) {
                String matchWord = DeckCardFilter.normalize(cell.getText());
                assertThat(mcTargetEnglishWords).doesNotContain(matchWord);
            }
        }
    }

    @Test
    @DisplayName("Trộn chiều từ -> nghĩa và nghĩa -> từ trong các câu chọn đáp án")
    void shouldMixWordToMeaningAndMeaningToWord() {
        List<Flashcard> deck = sampleDeck(16);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 1, 20, 60);

        boolean hasMeaningToWord = false;
        boolean hasWordToMeaning = false;

        for (DeckTestQuestionGenerator.GeneratedScreen mc : exam.mcScreens()) {
            // Nếu prompt bắt đầu bằng 'quả ' là tiếng Việt (Meaning -> Word)
            if (mc.prompt().startsWith("quả ")) {
                hasMeaningToWord = true;
                // Các lựa chọn là tiếng Anh
                assertThat(mc.left().getFirst().getText()).doesNotStartWith("quả ");
            } else {
                hasWordToMeaning = true;
                // Prompt là tiếng Anh, lựa chọn là tiếng Việt
                assertThat(mc.left().getFirst().getText()).startsWith("quả ");
            }
        }

        assertThat(hasMeaningToWord).isTrue();
        assertThat(hasWordToMeaning).isTrue();
    }

    @Test
    @DisplayName("Đáp án nhiễu không lặp một từ quá 2 lần trong cùng đề khi kho còn lựa chọn")
    void shouldNotRepeatDistractorMoreThanTwiceWhenPoolIsLarge() {
        List<Flashcard> deck = sampleDeck(20);
        List<Flashcard> fallback = sampleDeck(20);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, fallback, 10, 2, 20, 60);

        Map<String, Integer> distractorCount = new HashMap<>();
        for (DeckTestQuestionGenerator.GeneratedScreen mc : exam.mcScreens()) {
            String answerKey = mc.solution().get("answer");
            for (TimedQuizEngine.Cell cell : mc.left()) {
                if (!cell.getId().equals(answerKey)) {
                    String text = cell.getText().toLowerCase().trim();
                    distractorCount.put(text, distractorCount.getOrDefault(text, 0) + 1);
                }
            }
        }

        for (Map.Entry<String, Integer> entry : distractorCount.entrySet()) {
            assertThat(entry.getValue())
                    .as("Distractor '%s' should not repeat more than 2 times", entry.getKey())
                    .isLessThanOrEqualTo(2);
        }
    }

    @Test
    @DisplayName("Cột nối cặp không được thẳng hàng 100%")
    void shouldNotHaveAlignedMatchingColumns() {
        List<Flashcard> deck = sampleDeck(18);
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 2, 20, 60);

        assertThat(exam.matchingScreens()).isNotEmpty();
        for (DeckTestQuestionGenerator.GeneratedScreen screen : exam.matchingScreens()) {
            boolean fullyAligned = true;
            for (int i = 0; i < screen.left().size(); i++) {
                String leftId = screen.left().get(i).getId();
                String rightId = screen.right().get(i).getId();
                if (!Objects.equals(screen.solution().get(leftId), rightId)) {
                    fullyAligned = false;
                    break;
                }
            }
            assertThat(fullyAligned).isFalse();
        }
    }
}
