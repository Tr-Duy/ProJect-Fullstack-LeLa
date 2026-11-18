package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.flashcard.domain.Flashcard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DeckTestQuestionGenerator {

    private final DeckCardFilter cardFilter;

    public record GeneratedScreen(
            String type,
            String prompt,
            int seconds,
            List<TimedQuizEngine.Cell> left,
            List<TimedQuizEngine.Cell> right,
            Map<String, String> solution,
            Long sourceCardId) {
    }

    public record GeneratedExam(
            List<GeneratedScreen> mcScreens,
            List<GeneratedScreen> matchingScreens,
            int fallbackUsedCount
    ) {
        public GeneratedExam(List<GeneratedScreen> mcScreens, List<GeneratedScreen> matchingScreens) {
            this(mcScreens, matchingScreens, 0);
        }

        public List<GeneratedScreen> allScreens() {
            List<GeneratedScreen> all = new ArrayList<>(mcScreens);
            all.addAll(matchingScreens);
            return all;
        }
    }

    private record ExamMcResult(List<GeneratedScreen> screens, int fallbackUsedCount) {}

    @FunctionalInterface
    public interface ExamStatsCollector {
        void onDistractor(Flashcard target, Flashcard distractor, boolean isOutsideDeck, boolean isSamePos);

        ExamStatsCollector NOOP = (target, distractor, isOutsideDeck, isSamePos) -> {};
    }

    public GeneratedExam generateExam(
            List<Flashcard> deckCards,
            List<Flashcard> fallbackPool,
            int mcCount,
            int matchingScreensCount,
            int mcSeconds,
            int matchingSeconds) {
        return generateExam(deckCards, fallbackPool, mcCount, matchingScreensCount, mcSeconds, matchingSeconds, ExamStatsCollector.NOOP);
    }

    public GeneratedExam generateExam(
            List<Flashcard> deckCards,
            List<Flashcard> fallbackPool,
            int mcCount,
            int matchingScreensCount,
            int mcSeconds,
            int matchingSeconds,
            ExamStatsCollector statsCollector
    ) {
        List<Flashcard> validDeckCards = cardFilter.filterValidCards(deckCards);
        if (validDeckCards.size() < 8) {
            throw new IllegalArgumentException(
                    "Bộ thẻ chưa đủ số thẻ hợp lệ tối thiểu (cần ít nhất 8 thẻ hợp lệ, hiện có " + validDeckCards.size()
                            + ").");
        }

        List<Flashcard> validFallback = cardFilter.filterValidCards(fallbackPool);

        // 1. Sinh Part 1: Multiple Choice Meaning (xen kẽ VI -> EN và EN -> VI)
        int targetMcCount = Math.min(mcCount, validDeckCards.size());
        ExamMcResult mcResult = generateMultipleChoiceScreens(validDeckCards, validFallback, targetMcCount, mcSeconds, statsCollector);
        List<GeneratedScreen> mcScreens = mcResult.screens();

        // Tập hợp các ID thẻ đã làm đáp án đúng ở Part 1
        Set<Long> mcTargetCardIds = mcScreens.stream()
                .map(GeneratedScreen::sourceCardId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 2. Sinh Part 2: Matching Pairs - KHÔNG được dùng lại thẻ đã là đáp án đúng ở
        // Part 1
        // Lọc tập thẻ còn lại không trùng với MC targets
        List<Flashcard> remainingForMatching = validDeckCards.stream()
                .filter(c -> !mcTargetCardIds.contains(c.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        // Nếu số thẻ còn lại không đủ số màn dự kiến, giảm số màn ghép cặp thay vì lặp
        // lại thẻ MC
        int targetScreens = Math.min(matchingScreensCount, remainingForMatching.size() / 4);
        List<GeneratedScreen> matchingScreens = generateMatchingScreens(remainingForMatching, targetScreens,
                matchingSeconds);

        return new GeneratedExam(mcScreens, matchingScreens, mcResult.fallbackUsedCount());
    }

    private ExamMcResult generateMultipleChoiceScreens(
            List<Flashcard> deckCards,
            List<Flashcard> fallbackPool,
            int count,
            int seconds,
            ExamStatsCollector statsCollector
    ) {
        List<Flashcard> targets = new ArrayList<>(deckCards);
        Collections.shuffle(targets);
        targets = targets.subList(0, count);

        Set<Long> deckCardIds = deckCards.stream().map(Flashcard::getId).collect(Collectors.toSet());
        int totalFallbackUsed = 0;

        List<GeneratedScreen> screens = new ArrayList<>();
        Set<String> optionGroups = new HashSet<>();
        Set<String> distractorGroups = new HashSet<>();
        Map<String, Integer> distractorUsage = new HashMap<>();

        for (int i = 0; i < targets.size(); i++) {
            Flashcard target = targets.get(i);
            // Thẻ có back_text chứa front_text (không phân biệt hoa thường) chỉ được ra câu
            // EN -> VI
            boolean isWordToMeaning = backContainsFront(target) || (i % 2 == 1);
            String targetEn = DeckCardFilter.normalize(target.getFrontText());
            String targetVi = target.getBackText().trim();
            String normTargetPos = normalizePos(target.getPartOfSpeech());
            boolean hasTargetPos = !normTargetPos.isEmpty();

            // Sắp xếp candidates ưu tiên:
            // 1. CÙNG part_of_speech với target (khi target có POS)
            // 2. distractorUsage thấp hơn
            Comparator<Flashcard> candidateComparator = Comparator
                    .<Flashcard, Integer>comparing(
                            c -> (hasTargetPos && isSamePos(c.getPartOfSpeech(), normTargetPos)) ? 0 : 1)
                    .thenComparing(c -> distractorUsage.getOrDefault(DeckCardFilter.normalize(c.getFrontText()), 0));

            // Candidate distractors: ưu tiên cùng bộ thẻ (không trùng front_text và không
            // trùng nghĩa với target)
            List<Flashcard> deckCandidates = deckCards.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(deckCandidates);
            deckCandidates.sort(candidateComparator);

            // Candidate distractors fallback từ kho chung cùng cấp: chia cùng POS và khác
            // POS
            List<Flashcard> fallbackSamePos = fallbackPool.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && hasTargetPos && isSamePos(c.getPartOfSpeech(), normTargetPos)
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(fallbackSamePos);

            List<Flashcard> fallbackOtherPos = fallbackPool.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && (!hasTargetPos || !isSamePos(c.getPartOfSpeech(), normTargetPos))
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(fallbackOtherPos);

            List<Flashcard> chosenChoices = null;
            for (int trial = 0; trial < 32; trial++) {
                List<Flashcard> candidateChoices = new ArrayList<>();
                candidateChoices.add(target);

                // 1. Lấy từ cùng deck trước
                for (Flashcard dc : deckCandidates) {
                    if (candidateChoices.size() >= 4)
                        break;
                    if (isChoiceEligible(candidateChoices, dc)) {
                        candidateChoices.add(dc);
                    }
                }

                // 2. Nếu chưa đủ 4, lấy từ fallback cùng POS
                if (candidateChoices.size() < 4) {
                    for (Flashcard fc : fallbackSamePos) {
                        if (candidateChoices.size() >= 4)
                            break;
                        if (isChoiceEligible(candidateChoices, fc)) {
                            candidateChoices.add(fc);
                        }
                    }
                }

                // 3. Nếu vẫn chưa đủ 4, lấy từ fallback khác POS
                if (candidateChoices.size() < 4) {
                    for (Flashcard fc : fallbackOtherPos) {
                        if (candidateChoices.size() >= 4)
                            break;
                        if (isChoiceEligible(candidateChoices, fc)) {
                            candidateChoices.add(fc);
                        }
                    }
                }

                if (candidateChoices.size() == 4) {
                    String optSig = signature(candidateChoices);
                    String distSig = signature(
                            candidateChoices.stream().filter(c -> !Objects.equals(c.getId(), target.getId())).toList());
                    if (optionGroups.contains(optSig) || distractorGroups.contains(distSig)) {
                        Collections.shuffle(deckCandidates);
                        deckCandidates.sort(candidateComparator);
                        Collections.shuffle(fallbackSamePos);
                        Collections.shuffle(fallbackOtherPos);
                        continue;
                    }
                    optionGroups.add(optSig);
                    distractorGroups.add(distSig);
                    chosenChoices = candidateChoices;
                    break;
                }
            }

            // Nếu sau 32 trials chưa tìm được tổ hợp signature mới, gom lại 1 lần cuối bảo
            // đảm đúng 4 lựa chọn không trùng nghĩa
            if (chosenChoices == null) {
                List<Flashcard> candidateChoices = new ArrayList<>();
                candidateChoices.add(target);
                for (Flashcard dc : deckCandidates) {
                    if (candidateChoices.size() >= 4)
                        break;
                    if (isChoiceEligible(candidateChoices, dc)) {
                        candidateChoices.add(dc);
                    }
                }
                if (candidateChoices.size() < 4) {
                    for (Flashcard fc : fallbackSamePos) {
                        if (candidateChoices.size() >= 4)
                            break;
                        if (isChoiceEligible(candidateChoices, fc)) {
                            candidateChoices.add(fc);
                        }
                    }
                }
                if (candidateChoices.size() < 4) {
                    for (Flashcard fc : fallbackOtherPos) {
                        if (candidateChoices.size() >= 4)
                            break;
                        if (isChoiceEligible(candidateChoices, fc)) {
                            candidateChoices.add(fc);
                        }
                    }
                }
                if (candidateChoices.size() == 4) {
                    chosenChoices = candidateChoices;
                }
            }

            // Báo lỗi rõ ràng nếu không thể tìm đủ 4 lựa chọn không trùng nghĩa
            if (chosenChoices == null || chosenChoices.size() < 4) {
                int foundCount = (chosenChoices == null) ? 1 : chosenChoices.size();
                throw new IllegalStateException("Không đủ 4 lựa chọn không trùng nghĩa cho câu hỏi thẻ id="
                        + target.getId() + " (" + target.getFrontText() + "). Số lựa chọn tìm được: " + foundCount);
            }

            // Ghi nhận tần suất xuất hiện của các distractors và đếm số lượng fallback được
            // dùng
            for (Flashcard ch : chosenChoices) {
                if (!Objects.equals(ch.getId(), target.getId())) {
                    String key = DeckCardFilter.normalize(ch.getFrontText());
                    distractorUsage.put(key, distractorUsage.getOrDefault(key, 0) + 1);
                    boolean isOutsideDeck = !deckCardIds.contains(ch.getId());
                    if (isOutsideDeck) {
                        totalFallbackUsed++;
                    }
                    boolean isSamePos = hasTargetPos && isSamePos(ch.getPartOfSpeech(), normTargetPos);
                    statsCollector.onDistractor(target, ch, isOutsideDeck, isSamePos);
                }
            }

            Collections.shuffle(chosenChoices);

            List<TimedQuizEngine.Cell> leftCells = new ArrayList<>();
            Map<String, String> solution = new HashMap<>();

            for (Flashcard ch : chosenChoices) {
                String optionKey = UUID.randomUUID().toString();
                // Nếu isWordToMeaning (EN -> VI): hiển thị nghĩa tiếng Việt
                // Nếu không (VI -> EN): hiển thị từ tiếng Anh
                String choiceText = isWordToMeaning ? ch.getBackText().trim() : ch.getFrontText().trim();
                leftCells.add(new TimedQuizEngine.Cell(optionKey, choiceText));
                if (Objects.equals(ch.getId(), target.getId())) {
                    solution.put("answer", optionKey);
                }
            }

            String prompt = isWordToMeaning ? target.getFrontText().trim() : targetVi;

            screens.add(new GeneratedScreen(
                    "MULTIPLE_CHOICE_MEANING",
                    prompt,
                    seconds,
                    leftCells,
                    List.of(),
                    solution,
                    target.getId()));
        }

        return new ExamMcResult(screens, totalFallbackUsed);
    }

    private List<GeneratedScreen> generateMatchingScreens(
            List<Flashcard> availableCards,
            int targetScreens,
            int seconds) {
        if (targetScreens <= 0 || availableCards.size() < 4) {
            return List.of();
        }
        List<GeneratedScreen> screens = new ArrayList<>();
        List<Flashcard> pool = new ArrayList<>(availableCards);
        Collections.shuffle(pool);

        for (int screenIdx = 0; screenIdx < targetScreens; screenIdx++) {
            List<Flashcard> screenCards = new ArrayList<>();
            List<Flashcard> skipped = new ArrayList<>();

            for (Flashcard candidate : pool) {
                if (screenCards.size() >= 4) {
                    skipped.add(candidate);
                    continue;
                }
                boolean conflicts = screenCards.stream()
                        .anyMatch(c -> DeckCardFilter.normalize(c.getFrontText())
                                .equals(DeckCardFilter.normalize(candidate.getFrontText()))
                                || isMeaningConflicting(c.getBackText(), candidate.getBackText()));
                if (!conflicts) {
                    screenCards.add(candidate);
                } else {
                    skipped.add(candidate);
                }
            }

            if (screenCards.size() < 4) {
                break; // Không đủ thẻ không xung đột trong tập khả dụng, giảm số màn ghép
            }

            pool = skipped;

            List<TimedQuizEngine.Cell> leftCells = new ArrayList<>();
            List<TimedQuizEngine.Cell> rightCells = new ArrayList<>();
            Map<String, String> solution = new LinkedHashMap<>();

            for (Flashcard c : screenCards) {
                String leftId = UUID.randomUUID().toString();
                String rightId = UUID.randomUUID().toString();
                leftCells.add(new TimedQuizEngine.Cell(leftId, c.getFrontText().trim()));
                rightCells.add(new TimedQuizEngine.Cell(rightId, c.getBackText().trim()));
                solution.put(leftId, rightId);
            }

            // Shuffle and ensure columns are not fully aligned
            Collections.shuffle(leftCells);
            Collections.shuffle(rightCells);
            avoidAlignedPairs(leftCells, rightCells, solution);

            screens.add(new GeneratedScreen(
                    "MATCHING_PAIRS",
                    "Ghép cặp từ vựng và nghĩa tiếng Việt tương ứng",
                    seconds,
                    leftCells,
                    rightCells,
                    solution,
                    null));
        }

        return screens;
    }

    private static void avoidAlignedPairs(
            List<TimedQuizEngine.Cell> left,
            List<TimedQuizEngine.Cell> right,
            Map<String, String> solution) {
        if (left.size() != right.size() || left.isEmpty())
            return;
        boolean aligned = true;
        for (int i = 0; i < left.size(); i++) {
            if (!Objects.equals(solution.get(left.get(i).getId()), right.get(i).getId())) {
                aligned = false;
                break;
            }
        }
        if (aligned) {
            Collections.rotate(right, 1);
        }
    }

    public static boolean backContainsFront(Flashcard card) {
        if (card == null || card.getFrontText() == null || card.getBackText() == null)
            return false;
        String front = DeckCardFilter.normalize(card.getFrontText());
        String back = DeckCardFilter.normalize(card.getBackText());
        return !front.isBlank() && back.contains(front);
    }

    public static Set<String> extractMeaningSenses(String meaning) {
        if (meaning == null || meaning.isBlank()) {
            return Collections.emptySet();
        }
        // Tách back_text theo , và ; chuẩn hóa (bỏ dấu câu, thường hóa)
        String[] parts = meaning.split("[,;]");
        Set<String> senses = new HashSet<>();
        for (String part : parts) {
            String normalized = DeckCardFilter.normalize(part)
                    .replaceAll("[\\p{Punct}]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!normalized.isEmpty()) {
                senses.add(normalized);
            }
        }
        return senses;
    }

    public static boolean isMeaningConflicting(String meaningA, String meaningB) {
        if (meaningA == null || meaningB == null)
            return false;
        String a = DeckCardFilter.normalize(meaningA);
        String b = DeckCardFilter.normalize(meaningB);
        if (a.equals(b))
            return true;
        Set<String> sensesA = extractMeaningSenses(meaningA);
        Set<String> sensesB = extractMeaningSenses(meaningB);
        return !Collections.disjoint(sensesA, sensesB);
    }

    private static boolean isChoiceEligible(List<Flashcard> currentChoices, Flashcard candidate) {
        if (candidate == null)
            return false;
        String candidateFront = DeckCardFilter.normalize(candidate.getFrontText());
        for (Flashcard ch : currentChoices) {
            if (Objects.equals(ch.getId(), candidate.getId()))
                return false;
            if (DeckCardFilter.normalize(ch.getFrontText()).equals(candidateFront))
                return false;
            if (isMeaningConflicting(ch.getBackText(), candidate.getBackText()))
                return false;
        }
        return true;
    }

    public static String normalizePos(String pos) {
        if (pos == null)
            return "";
        String p = pos.trim().toLowerCase();
        if (p.equals("noun") || p.equals("n") || p.startsWith("n."))
            return "n";
        if (p.equals("verb") || p.equals("v") || p.startsWith("v."))
            return "v";
        if (p.equals("adjective") || p.equals("adj") || p.startsWith("adj."))
            return "adj";
        if (p.equals("adverb") || p.equals("adv") || p.startsWith("adv."))
            return "adv";
        if (p.equals("phrase") || p.equals("phr") || p.startsWith("phr."))
            return "phr";
        if (p.equals("preposition") || p.equals("prep") || p.startsWith("prep."))
            return "prep";
        return p;
    }

    public static boolean isSamePos(String pos1, String pos2) {
        String p1 = normalizePos(pos1);
        String p2 = normalizePos(pos2);
        if (p1.isEmpty() || p2.isEmpty())
            return false;
        return p1.equals(p2);
    }

    private static String signature(List<Flashcard> cards) {
        return cards.stream()
                .map(c -> DeckCardFilter.normalize(c.getFrontText()))
                .sorted()
                .collect(Collectors.joining("|"));
    }
}
