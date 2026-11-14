package com.lela.Quiz.timed;

import com.lela.flashcard.domain.Flashcard;
import org.springframework.stereotype.Component;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class VocabularyGenerator {
    public record Word(long id, String english, String meaning, String pos, long level, Set<String> related) {}
    public record Item(String type, List<Word> words, List<Word> choices) {}

    static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFC)
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    public List<Word> clean(List<Flashcard> cards) {
        Map<String, Word> words = new LinkedHashMap<>();
        Set<String> englishHeads = cards.stream().map(f -> normalize(f.getFrontText()))
                .filter(w -> w.matches("[a-z]{4,}")).collect(Collectors.toSet());
        for (Flashcard f : cards) {
            String en = normalize(f.getFrontText()), vi = normalize(f.getBackText());
            if (f.getDeck().getLevel() == null || !en.matches("[a-z]+(?:[ '-][a-z]+){0,3}")
                    || vi.isBlank() || vi.contains(en) || vi.contains("từ vựng thuộc nhóm")
                    || Arrays.stream(vi.split("[^\\p{L}]+" )).anyMatch(englishHeads::contains)
                    || vi.matches(".*[<>={}].*")) continue;
            Set<String> related = Arrays.stream(normalize(f.getRelatedWords()).split("[,;/|·]"))
                    .filter(s -> !s.isBlank()).map(String::trim).collect(Collectors.toSet());
            String pos = normalize(f.getPartOfSpeech()).replace("noun", "n").replace("adjective", "adj").replace("verb", "v");
            words.putIfAbsent(en, new Word(f.getId(), f.getFrontText().trim(), f.getBackText().trim(), pos,
                    f.getDeck().getLevel().getId(), related));
        }
        return new ArrayList<>(words.values());
    }

    static Set<String> senses(Word w) {
        return Arrays.stream(normalize(w.meaning()).split("[,;/|]"))
                .map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.toSet());
    }

    public static boolean conflicts(Word a, Word b) {
        return normalize(a.english()).equals(normalize(b.english()))
                || normalize(a.meaning()).equals(normalize(b.meaning()))
                || !Collections.disjoint(senses(a), senses(b))
                || senses(a).stream().anyMatch(x -> senses(b).stream().anyMatch(y ->
                    x.startsWith(y + " ") || y.startsWith(x + " ") || x.endsWith(" " + y) || y.endsWith(" " + x)))
                || a.related().contains(normalize(b.english())) || b.related().contains(normalize(a.english()));
    }

    public List<Item> generate(String type, List<Word> source, int count) {
        List<Word> pool = new ArrayList<>(source);
        Collections.shuffle(pool);
        List<Item> result = new ArrayList<>();
        Set<String> used = new HashSet<>();
        for (Word word : pool) {
            if (result.size() >= count) break;
            if (used.contains(normalize(word.english()))) continue;
            if (type.equals("MULTIPLE_CHOICE_MEANING")) {
                List<Word> candidates = new ArrayList<>(pool);
                candidates.sort(Comparator.comparing(w -> !w.pos().equals(word.pos())));
                List<Word> choices = new ArrayList<>(List.of(word));
                for (Word candidate : candidates) {
                    if (candidate.level() == word.level() && choices.stream().noneMatch(w -> conflicts(w, candidate))) {
                        choices.add(candidate);
                        if (choices.size() == 4) break;
                    }
                }
                if (choices.size() < 2) continue;
                Collections.shuffle(choices);
                result.add(new Item(type, List.of(word), choices));
                used.add(normalize(word.english()));
            } else if (type.equals("MATCHING_PAIRS")) {
                List<Word> pairs = new ArrayList<>();
                for (Word candidate : pool) {
                    if (!used.contains(normalize(candidate.english())) && pairs.stream().noneMatch(w -> conflicts(w, candidate))) {
                        pairs.add(candidate);
                        if (pairs.size() == 4) break;
                    }
                }
                if (pairs.size() < 4) break;
                pairs.forEach(w -> used.add(normalize(w.english())));
                result.add(new Item(type, pairs, List.of()));
            } else throw new IllegalArgumentException("Unsupported vocabulary mode");
        }
        if (result.isEmpty()) throw new IllegalStateException("Kho từ chung không đủ dữ liệu hợp lệ cho dạng bài này.");
        return result;
    }
}
