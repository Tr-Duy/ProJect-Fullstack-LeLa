package com.lela.Quiz.decktest;

import com.lela.flashcard.domain.Flashcard;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class DeckCardFilter {

    private static final Pattern GARBAGE_SUFFIX = Pattern.compile(".*\\s+(?:ad|adv|adj|n|v)\\.?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern POS_ANNOTATION = Pattern.compile(".*\\s*\\((?:a|adj|adv|n|v|prep|conj|pron)\\.?\\)\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Set<String> ABNORMAL_POS_TOKENS = Set.of(
            "adj", "adj.", "adv", "adv.", "gerund", "v.", "v", "n.", "n"
    );

    public static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFC)
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    public static boolean isAbnormalFrontText(String frontText) {
        if (frontText == null) return true;
        String raw = frontText.trim();
        if (raw.length() > 40) {
            return true;
        }
        String[] words = raw.split("\\s+");
        if (words.length > 4) {
            return true;
        }
        if (words.length > 1) {
            for (int i = 1; i < words.length; i++) {
                String token = words[i].toLowerCase(Locale.ROOT).replaceAll("[()\\[\\],;]", "");
                if (ABNORMAL_POS_TOKENS.contains(token)) {
                    return true;
                }
            }
        }
        return false;
    }

    public boolean isValidCard(Flashcard f) {
        if (f == null || !Boolean.TRUE.equals(f.isActive) || f.getDeletedAt() != null) {
            return false;
        }
        String front = normalize(f.getFrontText());
        String back = normalize(f.getBackText());

        if (front.isBlank() || back.isBlank()) {
            return false;
        }
        if (front.length() <= 1 || back.length() <= 1) {
            return false;
        }
        if (back.contains("từ vựng thuộc nhóm") || back.contains("đang cập nhật")) {
            return false;
        }
        if (GARBAGE_SUFFIX.matcher(back).matches() || GARBAGE_SUFFIX.matcher(front).matches()) {
            return false;
        }
        if (POS_ANNOTATION.matcher(back).matches() || POS_ANNOTATION.matcher(front).matches()) {
            return false;
        }
        if (back.matches(".*[<>={}].*")) {
            return false;
        }
        if (isAbnormalFrontText(f.getFrontText())) {
            return false;
        }
        return true;
    }

    public List<Flashcard> filterValidCards(List<Flashcard> cards) {
        if (cards == null) return List.of();
        java.util.Set<String> seenKeys = new java.util.HashSet<>();
        java.util.List<Flashcard> result = new java.util.ArrayList<>();
        for (Flashcard f : cards) {
            if (isValidCard(f)) {
                Long deckId = (f.getDeck() != null) ? f.getDeck().getId() : 0L;
                String key = deckId + "#" + normalize(f.getFrontText());
                if (seenKeys.add(key)) {
                    result.add(f);
                }
            }
        }
        return result;
    }
}
