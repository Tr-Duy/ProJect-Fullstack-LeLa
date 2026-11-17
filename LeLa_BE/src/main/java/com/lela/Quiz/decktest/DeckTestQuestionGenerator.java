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
            Long sourceCardId
    ) {}

    public record GeneratedExam(
            List<GeneratedScreen> mcScreens,
            List<GeneratedScreen> matchingScreens
    ) {
        public List<GeneratedScreen> allScreens() {
            List<GeneratedScreen> all = new ArrayList<>(mcScreens);
            all.addAll(matchingScreens);
            return all;
        }
    }

    public GeneratedExam generateExam(
            List<Flashcard> deckCards,
            List<Flashcard> fallbackPool,
            int mcCount,
            int matchingScreensCount,
            int mcSeconds,
            int matchingSeconds
    ) {
        List<Flashcard> validDeckCards = cardFilter.filterValidCards(deckCards);
        if (validDeckCards.size() < 8) {
            throw new IllegalArgumentException("Bộ thẻ chưa đủ số thẻ hợp lệ tối thiểu (cần ít nhất 8 thẻ hợp lệ, hiện có " + validDeckCards.size() + ").");
        }

        List<Flashcard> validFallback = cardFilter.filterValidCards(fallbackPool);

        // 1. Sinh Part 1: Multiple Choice Meaning (xen kẽ VI -> EN và EN -> VI)
        int targetMcCount = Math.min(mcCount, validDeckCards.size());
        List<GeneratedScreen> mcScreens = generateMultipleChoiceScreens(validDeckCards, validFallback, targetMcCount, mcSeconds);

        // Tập hợp các ID thẻ đã làm đáp án đúng ở Part 1
        Set<Long> mcTargetCardIds = mcScreens.stream()
                .map(GeneratedScreen::sourceCardId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 2. Sinh Part 2: Matching Pairs - KHÔNG được dùng lại thẻ đã là đáp án đúng ở Part 1
        // Lọc tập thẻ còn lại không trùng với MC targets
        List<Flashcard> remainingForMatching = validDeckCards.stream()
                .filter(c -> !mcTargetCardIds.contains(c.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        // Nếu số thẻ còn lại không đủ số màn dự kiến, giảm số màn ghép cặp thay vì lặp lại thẻ MC
        int targetScreens = Math.min(matchingScreensCount, remainingForMatching.size() / 4);
        List<GeneratedScreen> matchingScreens = generateMatchingScreens(remainingForMatching, targetScreens, matchingSeconds);

        return new GeneratedExam(mcScreens, matchingScreens);
    }

    private List<GeneratedScreen> generateMultipleChoiceScreens(
            List<Flashcard> deckCards,
            List<Flashcard> fallbackPool,
            int count,
            int seconds
    ) {
        List<Flashcard> targets = new ArrayList<>(deckCards);
        Collections.shuffle(targets);
        targets = targets.subList(0, count);

        List<GeneratedScreen> screens = new ArrayList<>();
        Set<String> optionGroups = new HashSet<>();
        Set<String> distractorGroups = new HashSet<>();
        Map<String, Integer> distractorUsage = new HashMap<>();

        for (int i = 0; i < targets.size(); i++) {
            Flashcard target = targets.get(i);
            boolean isWordToMeaning = (i % 2 == 1); // Trộn chiều EN -> VI xen kẽ
            String targetEn = DeckCardFilter.normalize(target.getFrontText());
            String targetVi = target.getBackText().trim();
            String targetPos = target.getPartOfSpeech() == null ? "" : target.getPartOfSpeech().trim().toLowerCase();

            // Sắp xếp candidates ưu tiên:
            // 1. distractorUsage < 2
            // 2. cùng part of speech
            Comparator<Flashcard> candidateComparator = Comparator
                    .<Flashcard, Integer>comparing(c -> distractorUsage.getOrDefault(DeckCardFilter.normalize(c.getFrontText()), 0) >= 2 ? 1 : 0)
                    .thenComparing(c -> !Objects.equals(c.getPartOfSpeech(), targetPos));

            // Candidate distractors: ưu tiên cùng bộ thẻ
            List<Flashcard> deckCandidates = deckCards.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(deckCandidates);
            deckCandidates.sort(candidateComparator);

            // Candidate distractors fallback từ kho chung cùng cấp
            List<Flashcard> fallbackCandidates = fallbackPool.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(fallbackCandidates);
            fallbackCandidates.sort(candidateComparator);

            List<Flashcard> chosenChoices = null;
            for (int trial = 0; trial < 32; trial++) {
                List<Flashcard> candidateChoices = new ArrayList<>();
                candidateChoices.add(target);

                // Lấy từ deck trước (ưu tiên distractorUsage < 2)
                for (Flashcard dc : deckCandidates) {
                    if (candidateChoices.size() >= 4) break;
                    if (candidateChoices.stream().noneMatch(ch -> DeckCardFilter.normalize(ch.getFrontText()).equals(DeckCardFilter.normalize(dc.getFrontText()))
                            || isMeaningConflicting(ch.getBackText(), dc.getBackText()))) {
                        candidateChoices.add(dc);
                    }
                }

                // Nếu chưa đủ 4, lấy thêm từ fallback
                if (candidateChoices.size() < 4) {
                    for (Flashcard fc : fallbackCandidates) {
                        if (candidateChoices.size() >= 4) break;
                        if (candidateChoices.stream().noneMatch(ch -> DeckCardFilter.normalize(ch.getFrontText()).equals(DeckCardFilter.normalize(fc.getFrontText()))
                                || isMeaningConflicting(ch.getBackText(), fc.getBackText()))) {
                            candidateChoices.add(fc);
                        }
                    }
                }

                if (candidateChoices.size() >= 2) {
                    String optSig = signature(candidateChoices);
                    String distSig = signature(candidateChoices.stream().filter(c -> !Objects.equals(c.getId(), target.getId())).toList());
                    if (candidateChoices.size() == 4 && (optionGroups.contains(optSig) || distractorGroups.contains(distSig))) {
                        Collections.shuffle(deckCandidates);
                        deckCandidates.sort(candidateComparator);
                        Collections.shuffle(fallbackCandidates);
                        fallbackCandidates.sort(candidateComparator);
                        continue;
                    }
                    optionGroups.add(optSig);
                    distractorGroups.add(distSig);
                    chosenChoices = candidateChoices;
                    break;
                }
            }

            if (chosenChoices == null) {
                chosenChoices = new ArrayList<>(List.of(target));
                for (Flashcard dc : deckCandidates) {
                    if (chosenChoices.size() >= 4) break;
                    chosenChoices.add(dc);
                }
                if (chosenChoices.size() < 4) {
                    for (Flashcard fc : fallbackCandidates) {
                        if (chosenChoices.size() >= 4) break;
                        chosenChoices.add(fc);
                    }
                }
            }

            // Ghi nhận tần suất xuất hiện của các distractors
            for (Flashcard ch : chosenChoices) {
                if (!Objects.equals(ch.getId(), target.getId())) {
                    String key = DeckCardFilter.normalize(ch.getFrontText());
                    distractorUsage.put(key, distractorUsage.getOrDefault(key, 0) + 1);
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
                    target.getId()
            ));
        }

        return screens;
    }

    private List<GeneratedScreen> generateMatchingScreens(
            List<Flashcard> availableCards,
            int targetScreens,
            int seconds
    ) {
        if (targetScreens <= 0 || availableCards.size() < 4) {
            return List.of();
        }
        List<GeneratedScreen> screens = new ArrayList<>();
        List<Flashcard> pool = new ArrayList<>(availableCards);
        Collections.shuffle(pool);

        int poolIndex = 0;
        for (int screenIdx = 0; screenIdx < targetScreens; screenIdx++) {
            List<Flashcard> screenCards = new ArrayList<>();

            // Lấy 4 thẻ không xung đột
            int attempts = 0;
            while (screenCards.size() < 4 && attempts < 100 && poolIndex < pool.size()) {
                attempts++;
                Flashcard candidate = pool.get(poolIndex++);
                if (screenCards.stream().noneMatch(c ->
                        DeckCardFilter.normalize(c.getFrontText()).equals(DeckCardFilter.normalize(candidate.getFrontText()))
                                || isMeaningConflicting(c.getBackText(), candidate.getBackText()))) {
                    screenCards.add(candidate);
                }
            }

            if (screenCards.size() < 4) {
                break; // Không đủ thẻ không xung đột trong tập khả dụng
            }

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
                    null
            ));
        }

        return screens;
    }

    private static void avoidAlignedPairs(
            List<TimedQuizEngine.Cell> left,
            List<TimedQuizEngine.Cell> right,
            Map<String, String> solution
    ) {
        if (left.size() != right.size() || left.isEmpty()) return;
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

    private static boolean isMeaningConflicting(String meaningA, String meaningB) {
        String a = DeckCardFilter.normalize(meaningA);
        String b = DeckCardFilter.normalize(meaningB);
        if (a.equals(b)) return true;
        Set<String> sensesA = senses(a);
        Set<String> sensesB = senses(b);
        if (!Collections.disjoint(sensesA, sensesB)) return true;
        return false;
    }

    private static Set<String> senses(String meaning) {
        return Arrays.stream(meaning.split("[,;/|]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    private static String signature(List<Flashcard> cards) {
        return cards.stream()
                .map(c -> DeckCardFilter.normalize(c.getFrontText()))
                .sorted()
                .collect(Collectors.joining("|"));
    }
}
