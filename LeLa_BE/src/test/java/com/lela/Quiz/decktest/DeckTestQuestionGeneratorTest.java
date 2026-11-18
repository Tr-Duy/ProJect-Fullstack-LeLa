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

    @Test
    @DisplayName("Ưu tiên distractors CÙNG part_of_speech với target khi có đủ trong bộ thẻ")
    void shouldPrioritizeSamePartOfSpeechDistractorsWhenAvailable() {
        // Tạo bộ 8 thẻ: 4 danh từ ('n') và 4 động từ ('v')
        List<Flashcard> deck = List.of(
                createCard(1L, "contract", "hợp đồng", "n"),
                createCard(2L, "agreement", "sự thỏa thuận", "noun"), // Test normalization: noun -> n
                createCard(3L, "assurance", "sự bảo đảm", "n"),
                createCard(4L, "bargain", "món hời", "n"),
                createCard(5L, "cancel", "hủy bỏ", "v"),
                createCard(6L, "determine", "xác định", "verb"), // Test normalization: verb -> v
                createCard(7L, "engage", "tham gia", "v"),
                createCard(8L, "establish", "thiết lập", "v")
        );

        Map<Long, Flashcard> cardMap = deck.stream().collect(Collectors.toMap(Flashcard::getId, c -> c));
        Map<String, Flashcard> wordMap = deck.stream().collect(Collectors.toMap(c -> c.getFrontText().toLowerCase(), c -> c));

        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 8, 0, 20, 60);

        for (DeckTestQuestionGenerator.GeneratedScreen mc : exam.mcScreens()) {
            Flashcard target = cardMap.get(mc.sourceCardId());
            String targetPosNorm = DeckTestQuestionGenerator.normalizePos(target.getPartOfSpeech());

            // Tìm các lựa chọn distractors
            for (TimedQuizEngine.Cell cell : mc.left()) {
                if (cell.getId().equals(mc.solution().get("answer"))) continue;

                // Xác định thẻ tương ứng của distractor
                String text = cell.getText().toLowerCase().trim();
                Flashcard distractorCard = deck.stream()
                        .filter(c -> c.getFrontText().equalsIgnoreCase(text) || c.getBackText().equalsIgnoreCase(text))
                        .findFirst()
                        .orElse(null);

                assertThat(distractorCard).isNotNull();
                String distractorPosNorm = DeckTestQuestionGenerator.normalizePos(distractorCard.getPartOfSpeech());

                // Vì mỗi nhóm ('n' và 'v') đều có 4 thẻ (target + 3 distractors),
                // tất cả các distractors PHẢI cùng POS với target!
                assertThat(distractorPosNorm)
                        .as("Target '%s' (%s) distractor '%s' should have POS '%s'",
                                target.getFrontText(), targetPosNorm, distractorCard.getFrontText(), targetPosNorm)
                        .isEqualTo(targetPosNorm);
            }
        }
    }

    @Test
    @DisplayName("Fallback sang loại từ khác khi không đủ distractors cùng part_of_speech")
    void shouldFallbackToOtherPartOfSpeechWhenSamePosIsInsufficient() {
        // Bộ 8 thẻ: chỉ có 2 danh từ và 6 động từ
        List<Flashcard> deck = List.of(
                createCard(1L, "contract", "hợp đồng", "n"),
                createCard(2L, "agreement", "sự thỏa thuận", "n"),
                createCard(3L, "cancel", "hủy bỏ", "v"),
                createCard(4L, "determine", "xác định", "v"),
                createCard(5L, "engage", "tham gia", "v"),
                createCard(6L, "establish", "thiết lập", "v"),
                createCard(7L, "obligate", "bắt buộc", "v"),
                createCard(8L, "resolve", "giải quyết", "v")
        );

        Map<Long, Flashcard> cardMap = deck.stream().collect(Collectors.toMap(Flashcard::getId, c -> c));

        // Chỉ test câu hỏi của target là card 1 ("contract", noun)
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 8, 0, 20, 60);

        DeckTestQuestionGenerator.GeneratedScreen contractScreen = exam.mcScreens().stream()
                .filter(s -> Objects.equals(s.sourceCardId(), 1L))
                .findFirst()
                .orElse(null);

        assertThat(contractScreen).isNotNull();

        // Target là 'contract' (n): chỉ có 1 thẻ 'n' khác là 'agreement'.
        // Do đó 3 distractors phải bao gồm: 1 thẻ 'n' và 2 thẻ 'v' (fallback thành công).
        List<String> distractorPosList = new ArrayList<>();
        for (TimedQuizEngine.Cell cell : contractScreen.left()) {
            if (cell.getId().equals(contractScreen.solution().get("answer"))) continue;
            String text = cell.getText().toLowerCase().trim();
            Flashcard distractor = deck.stream()
                    .filter(c -> c.getFrontText().equalsIgnoreCase(text) || c.getBackText().equalsIgnoreCase(text))
                    .findFirst()
                    .orElse(null);
            assertThat(distractor).isNotNull();
            distractorPosList.add(DeckTestQuestionGenerator.normalizePos(distractor.getPartOfSpeech()));
        }

        // Chứa đúng 1 danh từ và 2 động từ fallback
        assertThat(distractorPosList).containsExactlyInAnyOrder("n", "v", "v");
    }

    @Test
    @DisplayName("Kiểm tra chuẩn hóa các dạng part_of_speech khác nhau")
    void shouldNormalizePosCorrectly() {
        assertThat(DeckTestQuestionGenerator.normalizePos("noun")).isEqualTo("n");
        assertThat(DeckTestQuestionGenerator.normalizePos("N")).isEqualTo("n");
        assertThat(DeckTestQuestionGenerator.normalizePos("n.")).isEqualTo("n");
        assertThat(DeckTestQuestionGenerator.normalizePos("verb")).isEqualTo("v");
        assertThat(DeckTestQuestionGenerator.normalizePos("VERB")).isEqualTo("v");
        assertThat(DeckTestQuestionGenerator.normalizePos("v.")).isEqualTo("v");
        assertThat(DeckTestQuestionGenerator.normalizePos("adjective")).isEqualTo("adj");
        assertThat(DeckTestQuestionGenerator.normalizePos("adj")).isEqualTo("adj");
        assertThat(DeckTestQuestionGenerator.normalizePos("adverb")).isEqualTo("adv");
        assertThat(DeckTestQuestionGenerator.normalizePos("adv")).isEqualTo("adv");
        assertThat(DeckTestQuestionGenerator.normalizePos("phrase")).isEqualTo("phr");
        assertThat(DeckTestQuestionGenerator.normalizePos("phr")).isEqualTo("phr");
        assertThat(DeckTestQuestionGenerator.normalizePos("preposition")).isEqualTo("prep");
        assertThat(DeckTestQuestionGenerator.normalizePos("")).isEqualTo("");
        assertThat(DeckTestQuestionGenerator.normalizePos(null)).isEqualTo("");

        assertThat(DeckTestQuestionGenerator.isSamePos("noun", "n")).isTrue();
        assertThat(DeckTestQuestionGenerator.isSamePos("verb", "v")).isTrue();
        assertThat(DeckTestQuestionGenerator.isSamePos("adjective", "adj")).isTrue();
        assertThat(DeckTestQuestionGenerator.isSamePos("noun", "verb")).isFalse();
    }

    @Test
    @DisplayName("Quy tắc 1a: Thẻ có back_text chứa front_text chỉ được ra câu EN -> VI, không bao giờ ra VI -> EN")
    void shouldOnlyGenerateEnglishToVietnameseForCardsWhereBackContainsFront() {
        Flashcard loanwordCard = createCard(10247L, "AIDS", "bệnh AIDS", "n");
        List<Flashcard> deck = new ArrayList<>(sampleDeck(10));
        deck.set(0, loanwordCard); // Đặt AIDS vào danh sách

        // Chạy nhiều lần để kiểm tra cả các lượt chẵn/lẻ
        for (int trial = 0; trial < 10; trial++) {
            DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 0, 20, 60);
            var aidsScreenOpt = exam.mcScreens().stream()
                    .filter(s -> Objects.equals(s.sourceCardId(), 10247L))
                    .findFirst();

            assertThat(aidsScreenOpt).isPresent();
            var screen = aidsScreenOpt.get();

            // Prompt PHẢI là từ tiếng Anh "AIDS" (hướng EN -> VI)
            assertThat(screen.prompt()).isEqualTo("AIDS");

            // Các lựa chọn PHẢI là nghĩa tiếng Việt (chứa "bệnh AIDS")
            String correctOptionKey = screen.solution().get("answer");
            var correctCell = screen.left().stream()
                    .filter(c -> c.getId().equals(correctOptionKey))
                    .findFirst().orElseThrow();
            assertThat(correctCell.getText()).isEqualTo("bệnh AIDS");
        }
    }

    @Test
    @DisplayName("Quy tắc 1b: Distractor bị loại nếu trùng bất kỳ phân đoạn nghĩa nào với đáp án đúng hoặc distractor khác")
    void shouldRejectDistractorWithOverlappingMeaningSense() {
        // Thẻ target: "hiệp hội; sự liên kết"
        Flashcard target = createCard(1L, "association", "hiệp hội; sự liên kết", "n");
        // Thẻ cùng deck nhưng có phân đoạn "sự liên kết" trùng với target
        Flashcard conflictingCard = createCard(2L, "alliance", "đồng minh, sự liên kết", "n");

        List<Flashcard> deck = new ArrayList<>();
        deck.add(target);
        deck.add(conflictingCard);
        for (int i = 3; i <= 10; i++) {
            deck.add(createCard((long) i, "word" + i, "nghĩa riêng biệt " + i, "n"));
        }

        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), 10, 0, 20, 60);

        var targetScreen = exam.mcScreens().stream()
                .filter(s -> Objects.equals(s.sourceCardId(), 1L))
                .findFirst().orElseThrow();

        // Thẻ conflictingCard không bao giờ được xuất hiện trong 4 lựa chọn của targetScreen
        for (TimedQuizEngine.Cell cell : targetScreen.left()) {
            assertThat(cell.getText()).isNotEqualTo("đồng minh, sự liên kết");
            assertThat(cell.getText()).isNotEqualTo("alliance");
        }

        // Kiểm tra không có bất kỳ 2 lựa chọn nào trong 4 lựa chọn chia sẻ phân đoạn nghĩa
        List<String> choiceTexts = targetScreen.left().stream().map(TimedQuizEngine.Cell::getText).toList();
        for (int i = 0; i < choiceTexts.size(); i++) {
            Set<String> sensesI = DeckTestQuestionGenerator.extractMeaningSenses(choiceTexts.get(i));
            for (int j = i + 1; j < choiceTexts.size(); j++) {
                Set<String> sensesJ = DeckTestQuestionGenerator.extractMeaningSenses(choiceTexts.get(j));
                assertThat(Collections.disjoint(sensesI, sensesJ))
                        .as("Lựa chọn '%s' và '%s' không được chia sẻ phân đoạn nghĩa", choiceTexts.get(i), choiceTexts.get(j))
                        .isTrue();
            }
        }
    }

    @Test
    @DisplayName("Quy tắc 1b: Lấy từ fallbackPool khi deck không đủ distractor không trùng nghĩa, báo lỗi nếu thiếu")
    void shouldFetchFromFallbackPoolAndThrowIfStillInsufficient() {
        // Deck có 8 thẻ, nhưng 6 thẻ trong đó bị trùng nghĩa với nhau
        Flashcard target = createCard(1L, "targetWord", "mục tiêu; đích đến", "n");
        List<Flashcard> deck = new ArrayList<>();
        deck.add(target);
        // 6 thẻ đều có nghĩa chứa "mục tiêu" -> xung đột với target
        for (int i = 2; i <= 7; i++) {
            deck.add(createCard((long) i, "conflict" + i, "mục tiêu, phần " + i, "n"));
        }
        deck.add(createCard(8L, "distinct8", "nghĩa riêng 8", "n"));

        // Fallback pool có đủ 3 thẻ cùng POS n
        List<Flashcard> fallbackPool = List.of(
                createCard(101L, "fallback1", "kho dự trữ 1", "n"),
                createCard(102L, "fallback2", "kho dự trữ 2", "n"),
                createCard(103L, "fallback3", "kho dự trữ 3", "n")
        );

        // Với fallbackPool: sinh thành công và đủ 4 lựa chọn
        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, fallbackPool, 1, 0, 20, 60);
        assertThat(exam.mcScreens().get(0).left()).hasSize(4);

        // Nếu fallbackPool rỗng: không đủ 3 distractors không trùng nghĩa -> bắt buộc ném IllegalStateException
        assertThatThrownBy(() -> generator.generateExam(deck, List.of(), 1, 0, 20, 60))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Không đủ 4 lựa chọn không trùng nghĩa");
    }
}
