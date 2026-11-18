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
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
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
    @EnabledIfEnvironmentVariable(named = "LELA_RUN_ALL_DECKS_TEST", matches = "true")
    @DisplayName("Kiểm thử Question Generator trên TẤT CẢ các bộ có >= 8 thẻ hợp lệ (30 lần mỗi bộ)")
    void testQuestionGenerationOnAllQualifiedDecks() {
        List<Deck> allDecks = deckRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.isActive) && d.getDeletedAt() == null)
                .sorted(Comparator.comparing(Deck::getId))
                .toList();

        int totalActive = allDecks.size();
        int qualifiedCount = 0;
        int passCount = 0;
        int failCount = 0;
        long totalExamsGenerated = 0;
        long totalFallbackUsed = 0;
        long totalExceptions = 0;
        long totalRule1aQuestions = 0;

        long totalMcQuestions = 0;
        long totalMcQuestionsWithFallback = 0;
        long mcQuestionsDeck8 = 0;
        long mcWithFallbackDeck8 = 0;
        long mcQuestionsDeckGe14 = 0;
        long mcWithFallbackDeckGe14 = 0;
        long totalDistractorsAll = 0;
        long totalSamePosDistractorsAll = 0;

        List<String> failedDeckReports = new ArrayList<>();

        System.out.println("================================================================================");
        System.out.println("BẮT ĐẦU KIỂM THỬ DECK TEST QUESTION GENERATOR TRÊN TOÀN BỘ CSDL (30 RUNS/DECK)");
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

            boolean deckPassedAllRuns = true;

            for (int seed = 1; seed <= 30; seed++) {
                try {
                    Set<Long> questionsWithFallbackInExam = new HashSet<>();
                    long[] distractorCounters = new long[2]; // [0] = total, [1] = samePos

                    DeckTestQuestionGenerator.ExamStatsCollector statsCollector = (target, distractor, isOutsideDeck, isSamePos) -> {
                        distractorCounters[0]++;
                        if (isSamePos) {
                            distractorCounters[1]++;
                        }
                        if (isOutsideDeck) {
                            questionsWithFallbackInExam.add(target.getId());
                        }
                    };

                    DeckTestQuestionGenerator.GeneratedExam exam = questionGenerator.generateExam(
                            validCards,
                            fallbackPool,
                            properties.getMcQuestionCount(),
                            properties.getMatchingScreensCount(),
                            properties.getMcQuestionSeconds(),
                            properties.getMatchingScreenSeconds(),
                            statsCollector
                    );
                    totalExamsGenerated++;
                    totalFallbackUsed += exam.fallbackUsedCount();
                    totalMcQuestions += exam.mcScreens().size();
                    int qWithFallback = questionsWithFallbackInExam.size();
                    totalMcQuestionsWithFallback += qWithFallback;
                    totalDistractorsAll += distractorCounters[0];
                    totalSamePosDistractorsAll += distractorCounters[1];

                    if (validCards.size() == 8) {
                        mcQuestionsDeck8 += exam.mcScreens().size();
                        mcWithFallbackDeck8 += qWithFallback;
                    } else if (validCards.size() >= 14) {
                        mcQuestionsDeckGe14 += exam.mcScreens().size();
                        mcWithFallbackDeckGe14 += qWithFallback;
                    }

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

                        // 4 lựa chọn, right rỗng
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

                        // Quy tắc 1b: Không có cặp lựa chọn nào trong cùng câu chia sẻ phân đoạn nghĩa
                        List<String> rawChoiceTexts = screen.left().stream().map(c -> c.getText().trim()).toList();
                        for (int ci = 0; ci < rawChoiceTexts.size(); ci++) {
                            Set<String> sensesCi = DeckTestQuestionGenerator.extractMeaningSenses(rawChoiceTexts.get(ci));
                            for (int cj = ci + 1; cj < rawChoiceTexts.size(); cj++) {
                                Set<String> sensesCj = DeckTestQuestionGenerator.extractMeaningSenses(rawChoiceTexts.get(cj));
                                assertThat(Collections.disjoint(sensesCi, sensesCj))
                                        .as("Deck %d seed %d: Hai lựa chọn '%s' và '%s' trong cùng câu hỏi không được chia sẻ phân đoạn nghĩa",
                                                deck.getId(), seed, rawChoiceTexts.get(ci), rawChoiceTexts.get(cj))
                                        .isTrue();
                            }
                        }

                        // Quy tắc 1a: Với thẻ nhóm (a) (back_text chứa front_text), chỉ có hướng EN -> VI
                        Flashcard targetCard = validCards.stream()
                                .filter(c -> Objects.equals(c.getId(), screen.sourceCardId()))
                                .findFirst().orElse(null);
                        if (targetCard != null && DeckTestQuestionGenerator.backContainsFront(targetCard)) {
                            totalRule1aQuestions++;
                            assertThat(screen.prompt())
                                    .as("Thẻ nhóm 1a (id=%d, front='%s', back='%s') bắt buộc phải ra hướng EN -> VI",
                                            targetCard.getId(), targetCard.getFrontText(), targetCard.getBackText())
                                    .isEqualTo(targetCard.getFrontText().trim());
                        }
                    }

                    // 2. Kiểm tra Matching Screens
                    List<DeckTestQuestionGenerator.GeneratedScreen> matchingScreens = exam.matchingScreens();
                    int remainingForMatching = validCards.size() - mcScreens.size();
                    int maxPossibleMatching = remainingForMatching / 4;
                    int expectedMatching = Math.min(properties.getMatchingScreensCount(), maxPossibleMatching);
                    assertThat(matchingScreens.size()).isLessThanOrEqualTo(expectedMatching);

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

                        // Guard phân đoạn nghĩa cho matching screens: không 2 thẻ nào chia sẻ phân đoạn nghĩa
                        List<String> rightMeanings = screen.right().stream().map(c -> c.getText().trim()).toList();
                        for (int mi = 0; mi < rightMeanings.size(); mi++) {
                            Set<String> sI = DeckTestQuestionGenerator.extractMeaningSenses(rightMeanings.get(mi));
                            for (int mj = mi + 1; mj < rightMeanings.size(); mj++) {
                                Set<String> sJ = DeckTestQuestionGenerator.extractMeaningSenses(rightMeanings.get(mj));
                                assertThat(Collections.disjoint(sI, sJ))
                                        .as("Deck %d seed %d matching: Hai nghĩa '%s' và '%s' không được chia sẻ phân đoạn nghĩa",
                                                deck.getId(), seed, rightMeanings.get(mi), rightMeanings.get(mj))
                                        .isTrue();
                            }
                        }
                    }

                } catch (Throwable t) {
                    deckPassedAllRuns = false;
                    totalExceptions++;
                    String err = "Deck " + deck.getId() + " (" + deck.getTitle() + ") seed " + seed + ": " + t.getMessage();
                    failedDeckReports.add(err);
                    log.error("Generation failed for {}", err, t);
                    break;
                }
            }

            if (deckPassedAllRuns) {
                passCount++;
            } else {
                failCount++;
            }
        }

        System.out.println("================================================================================");
        System.out.println("KẾT QUẢ KIỂM THỬ SINH ĐỀ THI TRÊN TOÀN BỘ CSDL (30 RUNS/DECK):");
        System.out.println("Số bộ đủ điều kiện (>= 8 thẻ hợp lệ): " + qualifiedCount);
        System.out.println("Số bộ PASS 100% cả 30 lần sinh đề: " + passCount);
        System.out.println("Số bộ FAIL: " + failCount);
        System.out.println("Tổng số đề sinh: " + totalExamsGenerated);
        System.out.println("Số lần phải dùng fallbackPool (gọi distractor): " + totalFallbackUsed);
        System.out.println("Số ngoại lệ (exceptions): " + totalExceptions);
        System.out.println("Số câu EN->VI bắt buộc do rule 1a: " + totalRule1aQuestions);

        double pctFallbackOverall = (totalMcQuestions > 0) ? (100.0 * totalMcQuestionsWithFallback / totalMcQuestions) : 0.0;
        double pctFallback8 = (mcQuestionsDeck8 > 0) ? (100.0 * mcWithFallbackDeck8 / mcQuestionsDeck8) : 0.0;
        double pctFallbackGe14 = (mcQuestionsDeckGe14 > 0) ? (100.0 * mcWithFallbackDeckGe14 / mcQuestionsDeckGe14) : 0.0;
        double pctSamePos = (totalDistractorsAll > 0) ? (100.0 * totalSamePosDistractorsAll / totalDistractorsAll) : 0.0;

        System.out.println("Tổng số câu hỏi MC đã sinh: " + totalMcQuestions);
        System.out.printf("Số câu có ít nhất 1 distractor từ fallbackPool: %d (%.2f%% trên tổng số câu)\n",
                totalMcQuestionsWithFallback, pctFallbackOverall);
        System.out.printf("  - Với các bộ đúng 8 thẻ: %d/%d câu (%.2f%%)\n",
                mcWithFallbackDeck8, mcQuestionsDeck8, pctFallback8);
        System.out.printf("  - Với các bộ >= 14 thẻ: %d/%d câu (%.2f%%)\n",
                mcWithFallbackDeckGe14, mcQuestionsDeckGe14, pctFallbackGe14);
        System.out.printf("Tỷ lệ distractors cùng loại từ (POS) với từ đích: %d/%d (%.2f%%)\n",
                totalSamePosDistractorsAll, totalDistractorsAll, pctSamePos);

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
        assertThat(totalExceptions).isEqualTo(0);
        assertThat(totalExamsGenerated).isEqualTo(166L * 30L);
    }
}
