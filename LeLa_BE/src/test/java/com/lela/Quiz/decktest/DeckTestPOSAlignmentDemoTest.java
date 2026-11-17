package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.flashcard.domain.Flashcard;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

public class DeckTestPOSAlignmentDemoTest {

    private Flashcard c(Long id, String front, String back, String pos) {
        Flashcard f = new Flashcard();
        f.setId(id);
        f.setFrontText(front);
        f.setBackText(back);
        f.setPartOfSpeech(pos);
        f.isActive = true;
        return f;
    }

    @Test
    @DisplayName("In đề thi thực tế minh chứng căn chỉnh Loại từ (POS) cho Bộ 1001 và Bộ 18")
    void printRealExamForDeck1001AndDeck18() {
        DeckCardFilter filter = new DeckCardFilter();
        DeckTestQuestionGenerator generator = new DeckTestQuestionGenerator(filter);

        // Dữ liệu thật Bộ 1001 (8 thẻ hợp lệ sau Lô 1 - tất cả là 'n')
        List<Flashcard> deck1001 = List.of(
                c(10001L, "absorb", "hấp thụ, tiếp thu", "n"),
                c(10002L, "accidentally", "tình cờ, ngẫu nhiên", "n"),
                c(10003L, "additionally", "thêm vào đó, ngoài ra", "n"),
                c(10004L, "appropriately", "một cách thích hợp", "n"),
                c(10005L, "arrow", "mũi tên, kí hiệu chỉ hướng", "n"),
                c(10006L, "aside", "sang một bên", "n"),
                c(10016L, "consultant", "Nhà tư vấn, chuyên gia tư vấn", "n"),
                c(10017L, "convenience", "Sự tiện lợi, thuận tiện", "n")
        );

        // Dữ liệu thật Bộ 18 (TOEIC Contracts - 7 danh từ 'n', 9 động từ 'v')
        List<Flashcard> deck18 = List.of(
                c(820L, "Agreement", "Sự thoả thuận", "n"),
                c(822L, "Assurance", "Bảo đảm, chắc chắn", "n"),
                c(828L, "Obligation", "Nghĩa vụ, bổn phận", "n"),
                c(829L, "Party", "Nhóm làm việc chung, bên tham gia", "n"),
                c(830L, "Provision", "Sự cung cấp, điều khoản", "n"),
                c(831L, "Provider", "Nhà cung cấp", "n"),
                c(834L, "Specification", "Sự chỉ rõ, đặc tả", "n"),
                c(819L, "Abide by", "Tuân theo, chịu theo", "v"),
                c(821L, "Agree", "Đồng ý", "v"),
                c(823L, "Cancel", "Hủy bỏ", "v"),
                c(824L, "Determine", "Giải quyết vấn đề, xác định", "v"),
                c(825L, "Engage", "Thuê mướn, hứa hẹn", "v"),
                c(826L, "Establish", "Thành lập, thiết lập", "v"),
                c(827L, "Obligate", "Bắt buộc, ép buộc", "v"),
                c(832L, "Resolve", "Kiên quyết, giải quyết", "v"),
                c(833L, "Specify", "Định rõ, ghi rõ", "v")
        );

        System.out.println("================================================================================");
        System.out.println("DEMO SINH ĐỀ THI CĂN CHỈNH PART OF SPEECH (POS ALIGNMENT)");
        System.out.println("================================================================================");

        printExamDemo("BỘ 1001 (TOEIC General)", deck1001, generator);
        printExamDemo("BỘ 18 (TOEIC Contracts - Đa dạng N/V)", deck18, generator);
    }

    private void printExamDemo(String title, List<Flashcard> deck, DeckTestQuestionGenerator generator) {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println(">>> " + title + " (Tổng " + deck.size() + " thẻ)");
        System.out.println("--------------------------------------------------------------------------------");

        Map<Long, Flashcard> byId = deck.stream().collect(Collectors.toMap(Flashcard::getId, c -> c));
        Map<String, Flashcard> byText = new HashMap<>();
        for (Flashcard c : deck) {
            byText.put(c.getFrontText().trim().toLowerCase(), c);
            byText.put(c.getBackText().trim().toLowerCase(), c);
        }

        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), Math.min(8, deck.size()), 1, 20, 60);

        int qNum = 1;
        for (DeckTestQuestionGenerator.GeneratedScreen mc : exam.mcScreens()) {
            Flashcard target = byId.get(mc.sourceCardId());
            String targetPos = target.getPartOfSpeech();
            String answerKey = mc.solution().get("answer");

            System.out.printf("\nCâu %02d [Target: '%s' | POS: %s | Prompt: \"%s\"]\n",
                    qNum++, target.getFrontText(), targetPos, mc.prompt());

            for (TimedQuizEngine.Cell cell : mc.left()) {
                boolean isAns = cell.getId().equals(answerKey);
                String txt = cell.getText().trim();
                Flashcard choiceCard = byText.get(txt.toLowerCase());
                String choicePos = choiceCard != null ? choiceCard.getPartOfSpeech() : "?";
                String marker = isAns ? " [ĐÁP ÁN ĐÚNG]" : " [distractor]";
                System.out.printf("   - %-32s (POS: %-3s) %s\n", txt, choicePos, marker);

                // Kiểm tra căn chỉnh loại từ
                if (!isAns && choiceCard != null) {
                    assertThat(DeckTestQuestionGenerator.isSamePos(choicePos, targetPos))
                            .as("Distractor POS '%s' should match target POS '%s'", choicePos, targetPos)
                            .isTrue();
                }
            }
        }
        System.out.printf("\n[XÁC NHẬN] Tất cả distractors của %d câu hỏi đều CÙNG LOẠI TỪ (POS) với từ đích: 100%%\n", exam.mcScreens().size());
    }
}
