package com.lela.Quiz.decktest;

import com.lela.Quiz.decktest.DeckTestProperties;
import com.lela.Quiz.decktest.DeckTestQuestionGenerator;
import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.Quiz.timed.VocabularyRepository;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class DeckTestAllQualifiedDecksTest {

    private static final Logger log = LoggerFactory.getLogger(DeckTestAllQualifiedDecksTest.class);

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private DeckCardFilter cardFilter;

    @Autowired
    private DeckTestQuestionGenerator questionGenerator;

    @Autowired
    private DeckTestProperties properties;

    @Test
    @DisplayName("Kiểm thử Question Generator trên TẤT CẢ các bộ có >= 8 thẻ hợp lệ")
    void testQuestionGenerationOnAllQualifiedDecks() {
        List<Deck> allDecks = deckRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.isActive) && d.getDeletedAt() == null)
                .sorted(Comparator.comparing(Deck::getId))
                .toList();

        int totalActive = allDecks.size();
        int qualifiedCount = 0;
        int passCount = 0;
        int failCount = 0;
        List<String> failedDeckReports = new ArrayList<>();

        System.out.println("================================================================================");
        System.out.println("BẮT ĐẦU KIỂM THỬ DECK TEST QUESTION GENERATOR TRÊN TOÀN BỘ CSDL");
        System.out.println("Tổng số bộ thẻ đang hoạt động: " + totalActive);
        System.out.println("================================================================================");

        for (Deck deck : allDecks) {
            List<Flashcard> rawCards = flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId());
            List<Flashcard> validCards = cardFilter.filterValidCards(rawCards);

            if (validCards.size() < 8) {
                continue;
            }

            qualifiedCount++;
            Long levelId = deck.getLevel() != null ? deck.getLevel().getId() : null;
            List<Flashcard> fallbackPool = vocabularyRepository.findSystemWords(properties.getSystemOwner(), levelId);

            try {
                DeckTestQuestionGenerator.GeneratedExam exam = questionGenerator.generateExam(
                        validCards,
                        fallbackPool,
                        properties.getMcQuestionCount(),
                        properties.getMatchingScreensCount(),
                        properties.getMcQuestionSeconds(),
                        properties.getMatchingScreenSeconds()
                );

                // 1. Kiểm tra MC Screens
                List<DeckTestQuestionGenerator.GeneratedScreen> mcScreens = exam.mcScreens();
                int expectedMc = Math.min(properties.getMcQuestionCount(), validCards.size());
                assertThat(mcScreens).hasSize(expectedMc);

                Set<Long> targetCardIds = new HashSet<>();

                for (var screen : mcScreens) {
                    assertThat(screen.type()).isEqualTo("MULTIPLE_CHOICE_MEANING");
                    assertThat(screen.prompt()).isNotBlank();
                    assertThat(screen.prompt()).doesNotContain("từ vựng thuộc nhóm");
                    assertThat(screen.prompt()).doesNotContain("đang cập nhật");

                    // Trong MULTIPLE_CHOICE_MEANING: left là danh sách 4 lựa chọn, right rỗng
                    assertThat(screen.left()).hasSize(4);
                    assertThat(screen.right()).isEmpty();

                    // 4 lựa chọn phải có text phân biệt
                    Set<String> choiceTexts = screen.left().stream()
                            .map(c -> DeckCardFilter.normalize(c.getText()))
                            .collect(Collectors.toSet());
                    assertThat(choiceTexts).hasSize(4);

                    // Giải pháp có đúng 1 đáp án đúng
                    assertThat(screen.solution()).hasSize(1);
                    String correctOptionId = screen.solution().get("answer");
                    assertThat(correctOptionId).isNotNull();
                    boolean hasCorrectChoice = screen.left().stream().anyMatch(c -> c.getId().equals(correctOptionId));
                    assertThat(hasCorrectChoice).isTrue();

                    // Không placeholder trong các lựa chọn
                    for (var cell : screen.left()) {
                        assertThat(cell.getText()).doesNotContain("từ vựng thuộc nhóm");
                        assertThat(cell.getText()).doesNotContain("đang cập nhật");
                    }

                    // Không trùng từ đích trong cùng đề
                    if (screen.sourceCardId() != null) {
                        assertThat(targetCardIds.add(screen.sourceCardId())).isTrue();
                    }
                }

                // 2. Kiểm tra Matching Screens
                List<DeckTestQuestionGenerator.GeneratedScreen> matchingScreens = exam.matchingScreens();
                int remainingForMatching = validCards.size() - mcScreens.size();
                int expectedMatching = Math.min(properties.getMatchingScreensCount(), remainingForMatching / 4);
                assertThat(matchingScreens).hasSize(expectedMatching);

                for (var screen : matchingScreens) {
                    assertThat(screen.type()).isEqualTo("MATCHING_PAIRS");
                    assertThat(screen.left()).hasSize(4);
                    assertThat(screen.right()).hasSize(4);
                    assertThat(screen.solution()).hasSize(4);

                    for (var cell : screen.left()) {
                        assertThat(cell.getText()).doesNotContain("từ vựng thuộc nhóm");
                        assertThat(cell.getText()).doesNotContain("đang cập nhật");
                    }
                    for (var cell : screen.right()) {
                        assertThat(cell.getText()).doesNotContain("từ vựng thuộc nhóm");
                        assertThat(cell.getText()).doesNotContain("đang cập nhật");
                    }
                }

                passCount++;
            } catch (Throwable t) {
                failCount++;
                String err = "Deck " + deck.getId() + " (" + deck.getTitle() + "): " + t.getMessage();
                failedDeckReports.add(err);
                log.error("Generation failed for {}", err, t);
            }
        }

        System.out.println("================================================================================");
        System.out.println("KẾT QUẢ KIỂM THỬ SINH ĐỀ THI TRÊN TOÀN BỘ CSDL:");
        System.out.println("Số bộ đủ điều kiện (>= 8 thẻ hợp lệ): " + qualifiedCount);
        System.out.println("Số bộ PASS 100%: " + passCount);
        System.out.println("Số bộ FAIL: " + failCount);
        if (failCount > 0) {
            System.out.println("Chi tiết bộ lỗi:");
            for (String r : failedDeckReports) {
                System.out.println("  - " + r);
            }
        }
        System.out.println("================================================================================");

        assertThat(qualifiedCount).isEqualTo(166);
        assertThat(failCount).isEqualTo(0);
        assertThat(passCount).isEqualTo(166);
    }
}
