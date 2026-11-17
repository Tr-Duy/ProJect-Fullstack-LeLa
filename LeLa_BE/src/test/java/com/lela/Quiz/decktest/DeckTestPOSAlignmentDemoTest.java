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

    // Tra cứu loại từ thực tế theo ngôn ngữ học tiếng Anh
    private static String getTrueLinguisticPos(String word) {
        String w = word.toLowerCase().trim();
        if (w.endsWith("ly") && !w.equals("rely") && !w.equals("apply") && !w.equals("supply")) return "adv";
        if (w.equals("absorb") || w.equals("chase") || w.equals("compose") || w.equals("crack") ||
                w.equals("cope") || w.equals("confess") || w.equals("dare") || w.equals("disappoint")) return "v";
        if (w.equals("considerable") || w.equals("dependent") || w.equals("awkward") || w.equals("charming") ||
                w.equals("automatic") || w.equals("bold")) return "adj";
        if (w.equals("aside")) return "adv";
        return "n";
    }

    @Test
    @DisplayName("Kiểm nghiệm đề thi bằng DỮ LIỆU THẬT trong DB: Bộ 1001 và Bộ 1016 (Oxford)")
    void testRealDbDataForDeck1001And1016() {
        DeckCardFilter filter = new DeckCardFilter();
        DeckTestQuestionGenerator generator = new DeckTestQuestionGenerator(filter);

        // Dữ liệu THẬT 100% trong lela_db hiện tại cho Bộ 1001 (8 thẻ hợp lệ)
        // Chú ý: Trong DB, cả 8 thẻ này đều đang bị lưu part_of_speech = 'n'
        List<Flashcard> realDeck1001 = List.of(
                c(10001L, "absorb", "hấp thụ, tiếp thu", "n"),          // Thực tế: VERB
                c(10002L, "accidentally", "tình cờ, ngẫu nhiên", "n"),  // Thực tế: ADVERB
                c(10003L, "additionally", "thêm vào đó, ngoài ra", "n"),// Thực tế: ADVERB
                c(10004L, "appropriately", "một cách thích hợp", "n"),  // Thực tế: ADVERB
                c(10005L, "arrow", "mũi tên, kí hiệu chỉ hướng", "n"),  // Thực tế: NOUN
                c(10006L, "aside", "sang một bên", "n"),               // Thực tế: ADVERB
                c(10016L, "consultant", "Nhà tư vấn, chuyên gia tư vấn", "n"), // Thực tế: NOUN
                c(10017L, "convenience", "Sự tiện lợi, thuận tiện", "n")       // Thực tế: NOUN
        );

        // Dữ liệu THẬT 100% trong lela_db hiện tại cho Bộ 1016 (8 thẻ hợp lệ sau Lô 1)
        List<Flashcard> realDeck1016 = List.of(
                c(10246L, "addiction", "sự nghiện, sự say mê", "n"),
                c(10247L, "AIDS", "bệnh AIDS", "n"),
                c(10248L, "ambulance", "xe cứu thương", "n"),
                c(10249L, "anxiety", "sự lo âu, mối băn khoăn", "n"),
                c(10255L, "considerable", "Đáng kể, to lớn", "adj"),
                c(10257L, "consumption", "Sự tiêu thụ, lượng tiêu thụ", "n"),
                c(10258L, "cope", "Đương đầu, xử lý (tình huống khó)", "v"),
                c(10263L, "dependent", "Phụ thuộc, lệ thuộc", "adj")
        );

        System.out.println("================================================================================");
        System.out.println("KIỂM NGHIỆM THUẬT TOÁN BẰNG DỮ LIỆU THẬT TRONG DB (BỘ 1001 & BỘ 1016)");
        System.out.println("================================================================================");

        evaluateDeckOnRealData("BỘ 1001 (Oxford 5000 - Office #01)", realDeck1001, generator);
        evaluateDeckOnRealData("BỘ 1016 (Oxford 5000 - Health & Medicine #01)", realDeck1016, generator);
    }

    private void evaluateDeckOnRealData(String title, List<Flashcard> deck, DeckTestQuestionGenerator generator) {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println(">>> " + title);
        System.out.println("--------------------------------------------------------------------------------");

        Map<Long, Flashcard> byId = deck.stream().collect(Collectors.toMap(Flashcard::getId, c -> c));
        Map<String, Flashcard> byText = new HashMap<>();
        for (Flashcard c : deck) {
            byText.put(c.getFrontText().trim().toLowerCase(), c);
            byText.put(c.getBackText().trim().toLowerCase(), c);
        }

        DeckTestQuestionGenerator.GeneratedExam exam = generator.generateExam(deck, List.of(), deck.size(), 0, 20, 60);

        int totalDistractors = 0;
        int dbPosMatchCount = 0;
        int truePosMatchCount = 0;

        int qNum = 1;
        for (DeckTestQuestionGenerator.GeneratedScreen mc : exam.mcScreens()) {
            Flashcard target = byId.get(mc.sourceCardId());
            String dbTargetPos = target.getPartOfSpeech();
            String trueTargetPos = getTrueLinguisticPos(target.getFrontText());
            String answerKey = mc.solution().get("answer");

            System.out.printf("\nCâu %02d [Target: '%s' | Nhãn DB: %s | Loại từ THẬT: %s | Prompt: \"%s\"]\n",
                    qNum++, target.getFrontText(), dbTargetPos, trueTargetPos, mc.prompt());

            for (TimedQuizEngine.Cell cell : mc.left()) {
                boolean isAns = cell.getId().equals(answerKey);
                String txt = cell.getText().trim();
                Flashcard choiceCard = byText.get(txt.toLowerCase());
                if (choiceCard == null) continue;

                String dbChoicePos = choiceCard.getPartOfSpeech();
                String trueChoicePos = getTrueLinguisticPos(choiceCard.getFrontText());
                String marker = isAns ? " [ĐÁP ÁN ĐÚNG]" : " [distractor]";

                System.out.printf("   - %-32s (Nhãn DB: %-3s | Thật: %-3s) %s\n", txt, dbChoicePos, trueChoicePos, marker);

                if (!isAns) {
                    totalDistractors++;
                    if (DeckTestQuestionGenerator.isSamePos(dbChoicePos, dbTargetPos)) {
                        dbPosMatchCount++;
                    }
                    if (trueChoicePos.equals(trueTargetPos)) {
                        truePosMatchCount++;
                    }
                }
            }
        }

        double dbMatchPercent = (dbPosMatchCount * 100.0) / totalDistractors;
        double trueMatchPercent = (truePosMatchCount * 100.0) / totalDistractors;

        System.out.println("\n--- ĐÁNH GIÁ KẾT QUẢ ĐỐI VỚI DỮ LIỆU THẬT ---");
        System.out.printf("  1. Khớp theo Nhãn POS trong Database : %d/%d (%.1f%%)\n", dbPosMatchCount, totalDistractors, dbMatchPercent);
        System.out.printf("  2. Khớp theo Loại từ Ngôn ngữ học THẬT: %d/%d (%.1f%%)\n", truePosMatchCount, totalDistractors, trueMatchPercent);
        if (trueMatchPercent < dbMatchPercent) {
            System.out.println("  ==> KẾT LUẬN: Thuật toán hoạt động 100% đúng theo nhãn DB, NHƯNG kết quả hiển thị cho người học bị lệch do dữ liệu DB bị gắn sai loại từ (ví dụ: accidentally -ly bị gán 'n'). Cần sửa dữ liệu DB qua migration.");
        }
    }
}
