package com.lela.Quiz.decktest;

import com.lela.flashcard.domain.Flashcard;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class DeckCardFilter {

    private static final Pattern GARBAGE_SUFFIX = Pattern.compile(".*\\s+(?:ad|adv|adj|n|v)\\.?$", Pattern.CASE_INSENSITIVE);

    public static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFC)
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
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
        if (back.matches(".*[<>={}].*")) {
            return false;
        }
        return true;
    }

    public List<Flashcard> filterValidCards(List<Flashcard> cards) {
        if (cards == null) return List.of();
        return cards.stream().filter(this::isValidCard).toList();
    }
}
