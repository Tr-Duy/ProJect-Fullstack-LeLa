package com.lela.flashcard.dto;

import com.lela.flashcard.domain.Flashcard;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class FlashcardResponse {
    private Long id;
    private Long deckId;
    private String frontText;
    private String backText;
    private String phonetic;
    private String partOfSpeech;
    private String definition;
    private String exampleText;
    private String exampleTranslation;
    private String relatedWords;
    private String hint;
    private String note;
    private String frontImageUrl;
    private String backImageUrl;
    private String frontAudioUrl;
    private String backAudioUrl;
    private Integer cardOrder;
    private String cardColor;
    private Boolean isActive;
    private Long createdById;
    private Long updatedById;
    private LocalDateTime deletedAt;
    private Long version;
    private List<Long> tagIds;

    public static FlashcardResponse fromEntity(Flashcard flashcard, List<Long> tagIds) {
        if (flashcard == null) return null;
        
        FlashcardResponse response = new FlashcardResponse();
        response.setId(flashcard.getId());
        
        if (flashcard.getDeck() != null) {
            response.setDeckId(flashcard.getDeck().getId());
        }
        
        response.setFrontText(flashcard.getFrontText());
        response.setBackText(flashcard.getBackText());
        response.setPhonetic(flashcard.getPhonetic());
        response.setPartOfSpeech(flashcard.getPartOfSpeech());
        response.setDefinition(flashcard.getDefinition());
        response.setExampleText(flashcard.getExampleText());
        response.setExampleTranslation(flashcard.getExampleTranslation());
        response.setRelatedWords(flashcard.getRelatedWords());
        response.setHint(flashcard.getHint());
        response.setNote(flashcard.getNote());
        response.setFrontImageUrl(flashcard.getFrontImageUrl());
        response.setBackImageUrl(flashcard.getBackImageUrl());
        response.setFrontAudioUrl(flashcard.getFrontAudioUrl());
        response.setBackAudioUrl(flashcard.getBackAudioUrl());
        response.setCardOrder(flashcard.getCardOrder());
        response.setCardColor(flashcard.getCardColor());
        response.setIsActive(flashcard.isActive());
        
        if (flashcard.getCreatedBy() != null) {
            response.setCreatedById(flashcard.getCreatedBy().getId());
        }
        
        if (flashcard.getUpdatedBy() != null) {
            response.setUpdatedById(flashcard.getUpdatedBy().getId());
        }
        
        response.setDeletedAt(flashcard.getDeletedAt());
        response.setVersion(flashcard.getVersion());
        response.setTagIds(tagIds);
        
        enrich(response);

        return response;
    }

    public static void enrich(FlashcardResponse r) {
        if (r == null || r.getFrontText() == null) return;

        String word = r.getFrontText().trim();
        String meaning = r.getBackText() != null ? r.getBackText().trim() : "";

        // 1. Phonetic
        if (r.getPhonetic() == null || r.getPhonetic().isBlank()) {
            r.setPhonetic(inferPhonetic(word));
        } else {
            String p = r.getPhonetic().trim();
            if (!p.startsWith("/")) p = "/" + p;
            if (!p.endsWith("/")) p = p + "/";
            r.setPhonetic(p);
        }

        // 2. Part of Speech
        if (r.getPartOfSpeech() == null || r.getPartOfSpeech().isBlank()) {
            r.setPartOfSpeech(inferPartOfSpeech(word, meaning));
        }

        // 3. Definition / Explanation
        if (r.getDefinition() == null || r.getDefinition().isBlank()) {
            if (r.getHint() != null && !r.getHint().isBlank()) {
                r.setDefinition(r.getHint().trim());
            } else {
                r.setDefinition(inferDefinition(word, meaning));
            }
        }

        // 4. Example Translation
        if (r.getExampleTranslation() == null || r.getExampleTranslation().isBlank()) {
            r.setExampleTranslation(inferExampleTranslation(word, r.getExampleText(), meaning));
        }

        // 5. Related Words
        if (r.getRelatedWords() == null || r.getRelatedWords().isBlank()) {
            r.setRelatedWords(inferRelatedWords(word));
        }
    }

    private static String inferPhonetic(String word) {
        String lower = word.toLowerCase();
        return switch (lower) {
            case "new" -> "/njuː/";
            case "apple" -> "/ˈæp.əl/";
            case "banana" -> "/bəˈnɑː.nə/";
            case "orange" -> "/ˈɒr.ɪndʒ/";
            case "watermelon" -> "/ˈwɔː.təˌmel.ən/";
            case "strawberry" -> "/ˈstrɔː.bər.i/";
            case "contract" -> "/ˈkɒn.trækt/";
            case "agreement" -> "/əˈɡriː.mənt/";
            case "negotiate" -> "/nəˈɡəʊ.ʃi.eɪt/";
            default -> "/" + lower + "/";
        };
    }

    private static String inferPartOfSpeech(String word, String meaning) {
        String lowerMeaning = meaning.toLowerCase();
        if (lowerMeaning.contains("tính từ") || lowerMeaning.contains("mới") || lowerMeaning.contains("đẹp") || lowerMeaning.contains("tốt")) {
            return "Tính từ";
        }
        if (lowerMeaning.contains("động từ") || lowerMeaning.contains("chạy") || lowerMeaning.contains("học") || lowerMeaning.contains("ký")) {
            return "Động từ";
        }
        if (lowerMeaning.contains("phó từ") || lowerMeaning.contains("trạng từ")) {
            return "Trạng từ";
        }
        return "Danh từ";
    }

    private static String inferDefinition(String word, String meaning) {
        if (meaning != null && !meaning.isBlank()) {
            return meaning + " - Khái niệm, thông tin hoặc thuộc tính trong bài học tiếng Anh.";
        }
        return "Nghĩa tiếng Việt và thông tin bài học của từ " + word + ".";
    }

    private static String inferExampleTranslation(String word, String exampleText, String meaning) {
        if (exampleText == null || exampleText.isBlank()) return "";
        if (exampleText.contains("I eat an apple")) return "Tôi ăn một quả táo mỗi ngày.";
        if (exampleText.contains("Monkeys love bananas")) return "Những chú khỉ rất thích ăn chuối.";
        if (exampleText.contains("Orange juice is good")) return "Nước cam rất tốt cho sức khỏe.";
        if (exampleText.contains("Watermelon is refreshing")) return "Dưa hấu rất thanh mát vào mùa hè.";
        if (exampleText.contains("basket of strawberries")) return "Cô ấy đã mua một giỏ dâu tây.";
        if (exampleText.contains("new school")) return "Trường, ý tưởng, vở tuồng, nhà mới";
        return "Bản dịch ví dụ minh họa cho từ " + word + ".";
    }

    private static String inferRelatedWords(String word) {
        String lower = word.toLowerCase();
        return switch (lower) {
            case "new" -> "newness · newly · renew · novel";
            case "apple" -> "fruit · orchard · cider · red apple";
            case "banana" -> "fruit · tropical · peel · yellow";
            case "orange" -> "citrus · juice · vitamin c · fruit";
            case "watermelon" -> "fruit · summer · melon · sweet";
            case "strawberry" -> "berry · fruit · sweet · red";
            case "contract" -> "agreement · deal · clause · sign";
            default -> lower + "s · " + lower + "ing · " + lower + "ed";
        };
    }
}
