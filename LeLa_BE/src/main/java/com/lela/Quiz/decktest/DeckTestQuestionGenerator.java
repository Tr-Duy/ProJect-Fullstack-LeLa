package com.lela.Quiz.decktest;

import com.lela.Quiz.timed.TimedQuizEngine;
import com.lela.flashcard.domain.Flashcard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
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

        // 1. Sinh Part 1: Multiple Choice Meaning
        int targetMcCount = Math.min(mcCount, validDeckCards.size());
        List<GeneratedScreen> mcScreens = generateMultipleChoiceScreens(validDeckCards, validFallback, targetMcCount, mcSeconds);

        // 2. Sinh Part 2: Matching Pairs
        int targetScreens = Math.min(matchingScreensCount, validDeckCards.size() / 4);
        List<GeneratedScreen> matchingScreens = generateMatchingScreens(validDeckCards, targetScreens, matchingSeconds);

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

        for (Flashcard target : targets) {
            String targetEn = DeckCardFilter.normalize(target.getFrontText());
            String targetVi = target.getBackText().trim();
            String targetPos = target.getPartOfSpeech() == null ? "" : target.getPartOfSpeech().trim().toLowerCase();

            // Candidate distractors: ưu tiên cùng bộ thẻ
            List<Flashcard> deckCandidates = deckCards.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(deckCandidates);
            // Sắp xếp ưu tiên cùng part of speech
            deckCandidates.sort(Comparator.comparing(c -> !Objects.equals(c.getPartOfSpeech(), targetPos)));

            // Candidate distractors fallback từ kho chung cùng cấp
            List<Flashcard> fallbackCandidates = fallbackPool.stream()
                    .filter(c -> !Objects.equals(c.getId(), target.getId())
                            && !DeckCardFilter.normalize(c.getFrontText()).equals(targetEn)
                            && !isMeaningConflicting(targetVi, c.getBackText()))
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(fallbackCandidates);
            fallbackCandidates.sort(Comparator.comparing(c -> !Objects.equals(c.getPartOfSpeech(), targetPos)));

            List<Flashcard> chosenChoices = null;
            for (int trial = 0; trial < 32; trial++) {
                List<Flashcard> candidateChoices = new ArrayList<>();
                candidateChoices.add(target);

                // Lấy từ deck trước
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
                        Collections.shuffle(fallbackCandidates);
                        continue;
                    }
                    optionGroups.add(optSig);
                    distractorGroups.add(distSig);
                    chosenChoices = candidateChoices;
                    break;
                }
            }

            if (chosenChoices == null) {
                // Fallback đơn giản nếu không đủ 4
                chosenChoices = new ArrayList<>(List.of(target));
                for (Flashcard dc : deckCandidates) {
                    if (chosenChoices.size() >= 4) break;
                    chosenChoices.add(dc);
                }
            }

            Collections.shuffle(chosenChoices);

            List<TimedQuizEngine.Cell> leftCells = new ArrayList<>();
            Map<String, String> solution = new HashMap<>();

            for (Flashcard ch : chosenChoices) {
                String optionKey = UUID.randomUUID().toString();
                leftCells.add(new TimedQuizEngine.Cell(optionKey, ch.getFrontText().trim()));
                if (Objects.equals(ch.getId(), target.getId())) {
                    solution.put("answer", optionKey);
                }
            }

            screens.add(new GeneratedScreen(
                    "MULTIPLE_CHOICE_MEANING",
                    targetVi,
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
            List<Flashcard> deckCards,
            int targetScreens,
            int seconds
    ) {
        List<GeneratedScreen> screens = new ArrayList<>();
        List<Flashcard> pool = new ArrayList<>(deckCards);
        Collections.shuffle(pool);

        int poolIndex = 0;
        for (int screenIdx = 0; screenIdx < targetScreens; screenIdx++) {
            List<Flashcard> screenCards = new ArrayList<>();

            // Cố gắng lấy 4 thẻ không xung đột
            int attempts = 0;
            while (screenCards.size() < 4 && attempts < 100) {
                attempts++;
                if (poolIndex >= pool.size()) {
                    Collections.shuffle(pool);
                    poolIndex = 0;
                }
                Flashcard candidate = pool.get(poolIndex++);
                if (screenCards.stream().noneMatch(c ->
                        DeckCardFilter.normalize(c.getFrontText()).equals(DeckCardFilter.normalize(candidate.getFrontText()))
                                || isMeaningConflicting(c.getBackText(), candidate.getBackText()))) {
                    screenCards.add(candidate);
                }
            }

            if (screenCards.size() < 4) {
                break; // Không đủ thẻ không xung đột
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
