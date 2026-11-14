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
    public record RejectedCard(Long cardId, String english, String meaning, String pos, Long level, String declaredPos, List<String> reasons) {}
    public record Inspection(List<Word> accepted, List<RejectedCard> rejected) {}
    public static final Set<String> KNOWN_POS_REVIEW = Set.of("appeal", "target", "file", "inventory", "regardless", "regularly", "relatively", "adequate", "investigative");

    static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFC)
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    public List<Word> clean(List<Flashcard> cards) {
        return inspect(cards).accepted();
    }

    static String canonicalPos(String pos) {
        return switch (normalize(pos).replace(".", "")) {
            case "noun" -> "n";
            case "verb" -> "v";
            case "adjective" -> "adj";
            case "adverb" -> "adv";
            default -> normalize(pos).replace(".", "");
        };
    }
    public static String reviewHead(String word) {
        return normalize(word).replaceAll("\\s+(?:ad|adv|adj|n|v)\\.?$", "");
    }
    public static Set<String> sourcePosLabels(Flashcard card) {
        Set<String> labels = new TreeSet<>();
        var note = java.util.regex.Pattern.compile("(?:^|\\|)\\s*pos:\\s*([^|]+)").matcher(normalize(card.getNote()));
        if (note.find()) {
            for (String token : note.group(1).split("[,/\\s]+")) {
                String pos = canonicalPos(token);
                if (Set.of("n","v","adj","adv","prep","pron","conj","phr").contains(pos)) labels.add(pos);
            }
        }
        if (labels.isEmpty()) {
            var hint = java.util.regex.Pattern.compile("^(n|v|adj|adv|prep|pron|conj|phr)\\.\\s*(?:\\||$)").matcher(normalize(card.getHint()));
            if (hint.find()) labels.add(hint.group(1));
        }
        return labels;
    }
    public Inspection inspect(List<Flashcard> cards) {
        Map<String, Word> words = new LinkedHashMap<>();
        List<RejectedCard> rejected = new ArrayList<>();
        Set<String> englishHeads = cards.stream().map(f -> normalize(f.getFrontText()))
                .filter(w -> w.matches("[a-z]{4,}")).collect(Collectors.toSet());
        for (Flashcard f : cards) {
            String en = normalize(f.getFrontText()), vi = normalize(f.getBackText());
            String pos = canonicalPos(f.getPartOfSpeech()), head = reviewHead(en);
            Set<String> declaredPos = sourcePosLabels(f);
            Long level = f.getDeck() == null || f.getDeck().getLevel() == null ? null : f.getDeck().getLevel().getId();
            List<String> reasons = new ArrayList<>();
            if (level == null) reasons.add("MISSING_LEVEL");
            if (!en.matches("[a-z]+(?:[ '-][a-z]+){0,3}")) reasons.add("INVALID_ENGLISH_TEXT");
            if (en.matches(".*\\s+(?:ad|adv|adj|n|v|noun|verb|gerund)\\.?$")) reasons.add("GARBAGE_POS_SUFFIX");
            if (vi.isBlank()) reasons.add("MISSING_MEANING");
            if (vi.contains("từ vựng thuộc nhóm")) reasons.add("PLACEHOLDER_MEANING");
            if (vi.matches(".*[<>={}].*")) reasons.add("INVALID_MEANING_TEXT");
            if (!en.isBlank() && (vi.contains(en) || Arrays.stream(vi.split("[^\\p{L}]+" )).anyMatch(w -> englishHeads.contains(w) || w.equals("contract"))))
                reasons.add("ENGLISH_IN_VIETNAMESE_MEANING");
            if (!Set.of("n", "v", "adj", "adv", "prep", "pron", "conj", "phr").contains(pos)) reasons.add("UNSUPPORTED_OR_MISSING_POS");
            if (!declaredPos.isEmpty() && !declaredPos.contains(pos)) reasons.add("SOURCE_POS_METADATA_CONFLICT");
            boolean knownMismatch = (head.equals("appeal") && !Set.of("n", "v").contains(pos))
                    || (head.equals("target") && pos.equals("v") && vi.startsWith("mục tiêu"))
                    || (head.equals("file") && pos.equals("v") && (vi.startsWith("hồ sơ") || vi.startsWith("tài liệu")))
                    || (head.equals("inventory") && pos.equals("n") && vi.startsWith("kiểm kê"))
                    || (head.equals("adequate") && !pos.equals("adj"))
                    || (Set.of("regardless", "regularly", "relatively").contains(head) && !pos.equals("adv"));
            if (knownMismatch) reasons.add("KNOWN_POS_MEANING_REVIEW");
            if (Set.of("v", "adj", "adv").contains(pos) && vi.matches("^(sự |việc |người ).*")) reasons.add("NOUN_MEANING_WITH_NON_NOUN_POS");
            if (en.equals("fill out") && vi.contains("đầy đủ")) reasons.add("KNOWN_MEANING_REVIEW");
            if (en.equals("investigative") && vi.equals("điều tra")) reasons.add("KNOWN_MEANING_REVIEW");
            if (words.containsKey(en)) reasons.add("DUPLICATE_ENGLISH");
            if (!reasons.isEmpty()) {
                rejected.add(new RejectedCard(f.getId(), f.getFrontText(), f.getBackText(), f.getPartOfSpeech(), level, String.join("/",declaredPos), List.copyOf(reasons)));
                continue;
            }
            Set<String> related = Arrays.stream(normalize(f.getRelatedWords()).split("[,;/|·]"))
                    .filter(s -> !s.isBlank()).map(String::trim).collect(Collectors.toSet());
            words.putIfAbsent(en, new Word(f.getId(), f.getFrontText().trim(), f.getBackText().trim(), pos,
                    level, related));
        }
        return new Inspection(new ArrayList<>(words.values()), rejected);
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
        int required = type.equals("MATCHING_PAIRS") ? count * 4 : Math.max(2, count);
        if (source.size() < required) throw new IllegalStateException("Kho từ chung sau lọc không đủ cho cấp độ đã chọn: có " + source.size() + ", cần ít nhất " + required + " từ hợp lệ.");
        List<Word> pool = new ArrayList<>(source);
        Collections.shuffle(pool);
        List<Item> result = new ArrayList<>();
        Set<String> used = new HashSet<>();
        Set<String> optionGroups = new HashSet<>();
        Set<String> distractorGroups = new HashSet<>();
        for (Word word : pool) {
            if (result.size() >= count) break;
            if (used.contains(normalize(word.english()))) continue;
            if (type.equals("MULTIPLE_CHOICE_MEANING")) {
                List<Word> choices = List.of();
                String group = "", distractors = "";
                for (int trial = 0; trial < 64; trial++) {
                    List<Word> candidates = new ArrayList<>(pool);
                    Collections.shuffle(candidates);
                    candidates.sort(Comparator.comparing(w -> !w.pos().equals(word.pos())));
                    List<Word> candidateChoices = new ArrayList<>(List.of(word));
                    for (Word candidate : candidates) {
                        if (candidate.level() == word.level() && candidateChoices.stream().noneMatch(w -> conflicts(w, candidate))) {
                            candidateChoices.add(candidate);
                            if (candidateChoices.size() == 4) break;
                        }
                    }
                    group = signature(candidateChoices);
                    distractors = signature(candidateChoices.stream().filter(w -> !normalize(w.english()).equals(normalize(word.english()))).toList());
                    if (candidateChoices.size() == 4 && (optionGroups.contains(group) || distractorGroups.contains(distractors))) continue;
                    choices = candidateChoices; break;
                }
                if (choices.size() < 2) continue;
                if (choices.size() == 4) { optionGroups.add(group); distractorGroups.add(distractors); }
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
        if (result.size() < count) throw new IllegalStateException("Kho từ chung sau lọc không đủ câu/cặp không mơ hồ cho cấp độ đã chọn: tạo được " + result.size() + "/" + count + ".");
        return result;
    }
    private static String signature(List<Word> words) {
        return words.stream().map(w -> normalize(w.english())).sorted().collect(Collectors.joining("|"));
    }
}
