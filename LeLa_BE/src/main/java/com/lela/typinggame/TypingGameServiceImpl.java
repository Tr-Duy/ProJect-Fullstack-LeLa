package com.lela.typinggame;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.common.exception.BadRequestException;
import com.lela.common.exception.ConflictException;
import com.lela.common.exception.ForbiddenException;
import com.lela.common.exception.NotFoundExeception;
import com.lela.dailylearningactivity.DailyLearningActivityRepository;
import com.lela.dailylearningactivity.domain.DailyLearningActivity;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.typinggame.domain.TypingGameDeckConfig;
import com.lela.typinggame.domain.TypingGameHighScore;
import com.lela.typinggame.domain.TypingGameMode;
import com.lela.typinggame.domain.TypingGameRun;
import com.lela.typinggame.domain.TypingGameRunStatus;
import com.lela.typinggame.domain.TypingGameRunWord;
import com.lela.typinggame.domain.TypingWordResult;
import com.lela.typinggame.dto.CompleteStageRequest;
import com.lela.typinggame.dto.FinishTypingRunRequest;
import com.lela.typinggame.dto.StartTypingRunRequest;
import com.lela.typinggame.dto.TypingGameDeckDto;
import com.lela.typinggame.dto.TypingLeaderboardEntryDto;
import com.lela.typinggame.dto.TypingReviewWordDto;
import com.lela.typinggame.dto.TypingRunResponse;
import com.lela.typinggame.dto.TypingRunResultResponse;
import com.lela.typinggame.dto.TypingWordDto;
import com.lela.typinggame.dto.TypingWordEventDto;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.usersubscription.UserSubscriptionRepository;
import com.lela.usersubscription.domain.UserSubscription;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TypingGameServiceImpl implements TypingGameService {

    private final TypingGameRunRepository runRepository;
    private final TypingGameRunWordRepository runWordRepository;
    private final TypingGameHighScoreRepository highScoreRepository;
    private final TypingGameDeckConfigRepository deckConfigRepository;
    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final UsersRepository usersRepository;
    private final CardProgressRepository cardProgressRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final DailyLearningActivityRepository dailyLearningActivityRepository;
    private final TypingGameAntiCheatValidator antiCheatValidator;

    @Value("${typing-game.stale-timeout-minutes:30}")
    private int staleTimeoutMinutes;

    @Value("${typing-game.daily-xp-cap:150}")
    private int dailyXpCap;

    private Users getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundExeception("Người dùng không tồn tại"));
    }

    private boolean isUserPro(Users user) {
        LocalDateTime now = LocalDateTime.now();
        List<UserSubscription> activeSubs = userSubscriptionRepository.findActiveSubscriptionsByUserId(user.getId(), now);
        for (UserSubscription sub : activeSubs) {
            if (sub.getPlan() != null && sub.getPlan().getPlanCode() != null) {
                String code = sub.getPlan().getPlanCode().toUpperCase();
                if ("PLUS".equals(code) || "PREMIUM".equals(code)) {
                    return true;
                }
            }
        }
        return false;
    }

    private long calculateSpawnIntervalMs(int stageNo) {
        if (stageNo <= 1) {
            return 2800L;
        } else if (stageNo == 2) {
            return 2500L;
        } else if (stageNo <= 4) {
            return 2000L - (long) (stageNo - 3) * 100L;
        } else if (stageNo == 5) {
            return 1800L;
        } else {
            // Mốc 6 trở đi: 1.5s giảm dần xuống 1.2s
            long interval = 1500L - (long) (stageNo - 6) * 60L;
            return Math.max(1200L, interval);
        }
    }

    private double calculateBaseSpeed(int stageNo) {
        return 1.0 + (stageNo - 1) * 0.15;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TypingGameDeckDto> getDecks() {
        Users currentUser = getCurrentUser();
        boolean hasPro = isUserPro(currentUser);

        List<Deck> activeDecks = deckRepository.findAll().stream()
                .filter(Deck::isActive)
                .sorted(Comparator.comparing(Deck::getId))
                .toList();

        List<TypingGameDeckDto> dtos = new ArrayList<>();

        for (Deck deck : activeDecks) {
            Optional<TypingGameDeckConfig> configOpt = deckConfigRepository.findByDeckId(deck.getId());
            boolean isEnabled = configOpt.map(TypingGameDeckConfig::getIsEnabled).orElse(true);
            if (!isEnabled) {
                continue;
            }

            boolean requiresPro = configOpt.map(TypingGameDeckConfig::getRequiresPro).orElse(false);
            boolean isLocked = requiresPro && !hasPro;

            List<Flashcard> cards = flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId());
            int totalCards = cards.size();
            if (totalCards == 0) {
                continue;
            }

            int totalStages = Math.min(5, Math.max(1, totalCards));

            List<TypingGameHighScore> scores = highScoreRepository.findAllByUserIdAndDeckId(currentUser.getId(), deck.getId());
            Integer bestEasy = null;
            Integer bestHard = null;
            for (TypingGameHighScore s : scores) {
                if (s.getMode() == TypingGameMode.EASY) {
                    bestEasy = s.getBestScore();
                } else if (s.getMode() == TypingGameMode.HARD) {
                    bestHard = s.getBestScore();
                }
            }

            dtos.add(TypingGameDeckDto.builder()
                    .deckId(deck.getId())
                    .title(deck.getTitle())
                    .description(deck.getDescription())
                    .slug(deck.getSlug())
                    .cardColor(null)
                    .totalCards(totalCards)
                    .totalStages(totalStages)
                    .requiresPro(requiresPro)
                    .isLocked(isLocked)
                    .bestScoreEasy(bestEasy != null ? bestEasy : 0)
                    .bestScoreHard(bestHard != null ? bestHard : 0)
                    .build());
        }

        return dtos;
    }

    @Override
    @Transactional
    public TypingRunResponse startRun(StartTypingRunRequest request) {
        Users user = getCurrentUser();

        Deck deck = deckRepository.findById(request.getDeckId())
                .filter(Deck::isActive)
                .orElseThrow(() -> new NotFoundExeception("Bộ thẻ không tồn tại hoặc đã bị tắt"));

        Optional<TypingGameDeckConfig> configOpt = deckConfigRepository.findByDeckId(deck.getId());
        boolean isEnabled = configOpt.map(TypingGameDeckConfig::getIsEnabled).orElse(true);
        if (!isEnabled) {
            throw new BadRequestException("Bộ thẻ này hiện chưa được kích hoạt cho Luyện Gõ");
        }

        boolean requiresPro = configOpt.map(TypingGameDeckConfig::getRequiresPro).orElse(false);
        if (requiresPro && !isUserPro(user)) {
            throw new ForbiddenException("Bộ từ vựng này yêu cầu gói PLUS hoặc PREMIUM để luyện tập");
        }

        // 1. Kiểm tra run IN_PROGRESS cũ
        LocalDateTime now = LocalDateTime.now();
        List<TypingGameRun> inProgressRuns = runRepository.findByUserIdAndStatus(user.getId(), TypingGameRunStatus.IN_PROGRESS);
        for (TypingGameRun existingRun : inProgressRuns) {
            LocalDateTime lastActivity = existingRun.getUpdatedAt() != null ? existingRun.getUpdatedAt() : existingRun.getStartedAt();
            long inactiveMinutes = Duration.between(lastActivity, now).toMinutes();
            if (inactiveMinutes >= staleTimeoutMinutes || Boolean.TRUE.equals(request.getForceRestart())) {
                existingRun.setStatus(TypingGameRunStatus.ABANDONED);
                existingRun.setFinishedAt(now);
                runRepository.save(existingRun);
            } else {
                Map<String, Object> conflictData = Map.of(
                        "activeRunPublicId", existingRun.getPublicId(),
                        "mode", existingRun.getMode().name(),
                        "deckId", existingRun.getDeck().getId()
                );
                throw new ConflictException("Bạn đang có lượt chơi chưa hoàn thành (mã: " + existingRun.getPublicId() + ")", conflictData);
            }
        }

        // 2. Thuật toán chọn tối đa 200 từ
        List<Flashcard> allCards = flashcardRepository.findAllByDeckIdAndIsActiveTrue(deck.getId());
        if (allCards.isEmpty()) {
            throw new BadRequestException("Bộ thẻ không có từ vựng nào để chơi");
        }

        List<CardProgress> userProgress = cardProgressRepository.findAllByUserId(user.getId());
        Map<Long, CardProgress> progressMap = userProgress.stream()
                .filter(cp -> cp.getCard() != null)
                .collect(Collectors.toMap(cp -> cp.getCard().getId(), cp -> cp, (a, b) -> a));

        List<Flashcard> groupDueOrLapsed = new ArrayList<>();
        List<Flashcard> groupNew = new ArrayList<>();
        List<Flashcard> groupOthers = new ArrayList<>();

        for (Flashcard card : allCards) {
            CardProgress cp = progressMap.get(card.getId());
            if (cp == null) {
                groupNew.add(card);
            } else if (cp.getState() != CardProgressState.NEW &&
                    ((cp.getDueAt() != null && !cp.getDueAt().isAfter(now)) || cp.getLapseCount() > 0)) {
                groupDueOrLapsed.add(card);
            } else {
                groupOthers.add(card);
            }
        }

        // Sắp xếp nhóm 1 theo lapseCount giảm dần, dueAt tăng dần
        groupDueOrLapsed.sort((a, b) -> {
            CardProgress cpa = progressMap.get(a.getId());
            CardProgress cpb = progressMap.get(b.getId());
            int lapseCompare = Integer.compare(cpb.getLapseCount(), cpa.getLapseCount());
            if (lapseCompare != 0) return lapseCompare;
            if (cpa.getDueAt() == null && cpb.getDueAt() == null) return 0;
            if (cpa.getDueAt() == null) return 1;
            if (cpb.getDueAt() == null) return -1;
            return cpa.getDueAt().compareTo(cpb.getDueAt());
        });

        // Xáo ngẫu nhiên nhóm 2 và nhóm 3
        Collections.shuffle(groupNew, new Random());
        Collections.shuffle(groupOthers, new Random());

        // Hợp nhất theo thứ tự ưu tiên và loại trùng
        Set<Long> pickedIds = new HashSet<>();
        List<Flashcard> selectedCards = new ArrayList<>();

        for (Flashcard c : groupDueOrLapsed) {
            if (selectedCards.size() < 200 && pickedIds.add(c.getId())) {
                selectedCards.add(c);
            }
        }
        for (Flashcard c : groupNew) {
            if (selectedCards.size() < 200 && pickedIds.add(c.getId())) {
                selectedCards.add(c);
            }
        }
        for (Flashcard c : groupOthers) {
            if (selectedCards.size() < 200 && pickedIds.add(c.getId())) {
                selectedCards.add(c);
            }
        }

        // 2.1 CƠ CHẾ GỘP BỘ TỪ (DECK MERGING - TỪ 100 TỪ TRỞ LÊN)
        if (Boolean.TRUE.equals(request.getExpandedChallenge()) && selectedCards.size() < 100) {
            List<Deck> otherDecks = deckRepository.findAll().stream()
                    .filter(d -> d.isActive() && !d.getId().equals(deck.getId()))
                    .toList();
            for (Deck otherDeck : otherDecks) {
                if (selectedCards.size() >= 105) break;
                List<Flashcard> otherCards = flashcardRepository.findAllByDeckIdAndIsActiveTrue(otherDeck.getId());
                Collections.shuffle(otherCards, new Random());
                for (Flashcard oc : otherCards) {
                    if (pickedIds.add(oc.getId())) {
                        selectedCards.add(oc);
                        if (selectedCards.size() >= 105) break;
                    }
                }
            }
        }

        // Xáo ngẫu nhiên toàn bộ danh sách từ (Fisher-Yates) trước khi chia mốc
        Collections.shuffle(selectedCards, new Random());

        // Phân bổ 5 mốc theo thuật toán chuẩn
        int totalCardsCount = selectedCards.size();
        int totalStages = Math.min(5, Math.max(1, totalCardsCount));
        int baseCount = totalCardsCount / totalStages;
        int remainder = totalCardsCount % totalStages;
        String publicId = UUID.randomUUID().toString();

        TypingGameRun run = TypingGameRun.builder()
                .publicId(publicId)
                .user(user)
                .deck(deck)
                .mode(request.getMode())
                .status(TypingGameRunStatus.IN_PROGRESS)
                .score(0)
                .stageReached(1)
                .totalStages(totalStages)
                .livesLeft(3)
                .currentCombo(0)
                .maxCombo(0)
                .wordsCleared(0)
                .wordsMissed(0)
                .totalKeystrokes(0)
                .wrongKeystrokes(0)
                .accuracy(BigDecimal.ZERO)
                .wpm(BigDecimal.ZERO)
                .xpEarned(0)
                .currentStageServedAt(now)
                .flaggedCheat(false)
                .startedAt(now)
                .build();

        TypingGameRun savedRun = runRepository.save(run);

        // Lưu typing_game_run_words cho từng mốc
        Random rng = new Random();
        List<TypingGameRunWord> runWords = new ArrayList<>();

        int currentIdx = 0;
        for (int stageIndex = 0; stageIndex < totalStages; stageIndex++) {
            int stageNo = stageIndex + 1;
            int stageCardCount = baseCount + (stageIndex < remainder ? 1 : 0);
            int endIdx = Math.min(currentIdx + stageCardCount, totalCardsCount);
            List<Flashcard> stageSlice = new ArrayList<>(selectedCards.subList(currentIdx, endIdx));
            currentIdx = endIdx;

            // Xáo ngẫu nhiên trong nội bộ mốc
            Collections.shuffle(stageSlice, rng);

            // Chọn ngẫu nhiên đúng 1 từ mang tim trong mốc (~10%)
            int heartIndex = stageSlice.isEmpty() ? -1 : rng.nextInt(stageSlice.size());

            for (int pos = 0; pos < stageSlice.size(); pos++) {
                Flashcard fc = stageSlice.get(pos);
                boolean isHeart = (pos == heartIndex);
                runWords.add(TypingGameRunWord.builder()
                        .run(savedRun)
                        .flashcard(fc)
                        .stageNo(stageNo)
                        .positionNo(pos + 1)
                        .isHeartWord(isHeart)
                        .result(TypingWordResult.PENDING)
                        .wrongKeystrokes(0)
                        .clientDurationMs(0)
                        .build());
            }
        }

        runWordRepository.saveAll(runWords);

        // Chuẩn bị dữ liệu từ vựng trả về cho Stage 1
        List<TypingWordDto> stage1Words = getStageWords(savedRun.getId(), 1);

        return TypingRunResponse.builder()
                .publicId(savedRun.getPublicId())
                .deckId(deck.getId())
                .deckTitle(deck.getTitle())
                .mode(savedRun.getMode())
                .totalStages(totalStages)
                .livesLeft(savedRun.getLivesLeft())
                .currentStage(1)
                .currentCombo(0)
                .score(0)
                .spawnIntervalMs(calculateSpawnIntervalMs(1))
                .baseSpeed(calculateBaseSpeed(1))
                .words(stage1Words)
                .build();
    }

    private List<TypingWordDto> getStageWords(Long runId, int stageNo) {
        List<TypingGameRunWord> stageWords = runWordRepository.findByRunIdAndStageNoWithFlashcard(runId, stageNo);
        return stageWords.stream().map(rw -> {
            Flashcard fc = rw.getFlashcard();
            String wordText = fc.getFrontText() != null ? fc.getFrontText().trim() : "";
            return TypingWordDto.builder()
                    .flashcardId(fc.getId())
                    .word(wordText)
                    .meaning(fc.getBackText() != null ? fc.getBackText().trim() : (fc.getDefinition() != null ? fc.getDefinition().trim() : ""))
                    .phonetic(fc.getPhonetic())
                    .audioUrl(fc.getFrontAudioUrl() != null ? fc.getFrontAudioUrl() : fc.getBackAudioUrl())
                    .wordLength(wordText.length())
                    .isHeartWord(rw.getIsHeartWord())
                    .build();
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TypingRunResponse getRun(String publicId) {
        Users user = getCurrentUser();
        TypingGameRun run = runRepository.findByPublicId(publicId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy lượt chơi"));

        if (!run.getUser().getId().equals(user.getId())) {
            throw new NotFoundExeception("Không tìm thấy lượt chơi");
        }

        List<TypingWordDto> words = getStageWords(run.getId(), run.getStageReached());

        return TypingRunResponse.builder()
                .publicId(run.getPublicId())
                .deckId(run.getDeck().getId())
                .deckTitle(run.getDeck().getTitle())
                .mode(run.getMode())
                .totalStages(run.getTotalStages())
                .livesLeft(run.getLivesLeft())
                .currentStage(run.getStageReached())
                .currentCombo(run.getCurrentCombo())
                .score(run.getScore())
                .spawnIntervalMs(calculateSpawnIntervalMs(run.getStageReached()))
                .baseSpeed(calculateBaseSpeed(run.getStageReached()))
                .words(words)
                .build();
    }

    @Override
    @Transactional
    public TypingRunResponse completeStage(String publicId, Integer stageNo, CompleteStageRequest request) {
        Users user = getCurrentUser();
        TypingGameRun run = runRepository.findByPublicId(publicId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy lượt chơi"));

        if (!run.getUser().getId().equals(user.getId())) {
            throw new NotFoundExeception("Không tìm thấy lượt chơi");
        }

        if (run.getStatus() != TypingGameRunStatus.IN_PROGRESS) {
            throw new BadRequestException("Lượt chơi không ở trạng thái đang diễn ra");
        }

        if (!run.getStageReached().equals(stageNo)) {
            throw new BadRequestException("Mốc gửi lên không trùng khớp với mốc hiện tại của lượt chơi");
        }

        LocalDateTime now = LocalDateTime.now();
        List<TypingGameRunWord> stageRunWords = runWordRepository.findByRunIdAndStageNoWithFlashcard(run.getId(), stageNo);
        if (stageRunWords.isEmpty()) {
            throw new BadRequestException("Mốc không tồn tại từ vựng");
        }

        Map<Long, String> expectedWords = stageRunWords.stream()
                .collect(Collectors.toMap(rw -> rw.getFlashcard().getId(), rw -> rw.getFlashcard().getFrontText().trim()));
        Map<Long, Boolean> heartWordsMap = stageRunWords.stream()
                .collect(Collectors.toMap(rw -> rw.getFlashcard().getId(), TypingGameRunWord::getIsHeartWord));
        Map<Long, TypingGameRunWord> runWordMap = stageRunWords.stream()
                .collect(Collectors.toMap(rw -> rw.getFlashcard().getId(), rw -> rw));

        long spawnIntervalMs = calculateSpawnIntervalMs(stageNo);

        // Chạy xác thực Anti-Cheat và tính toán mốc
        TypingGameAntiCheatValidator.StageValidationResult result;
        try {
            result = antiCheatValidator.validateAndCalculateStage(
                    run,
                    request.getEvents(),
                    expectedWords,
                    heartWordsMap,
                    spawnIntervalMs,
                    now
            );
        } catch (BadRequestException ex) {
            run.setFlaggedCheat(true);
            run.setStatus(TypingGameRunStatus.ABANDONED);
            run.setFinishedAt(now);
            run.setXpEarned(0);
            runRepository.save(run);
            throw ex;
        }

        // Cập nhật chi tiết kết quả từng từ trong mốc
        for (TypingWordEventDto evt : request.getEvents()) {
            TypingGameRunWord rw = runWordMap.get(evt.getFlashcardId());
            if (rw != null) {
                rw.setResult(evt.getResult());
                rw.setWrongKeystrokes(evt.getWrongKeystrokes() != null ? evt.getWrongKeystrokes() : 0);
                rw.setClientDurationMs(evt.getClientDurationMs() != null ? evt.getClientDurationMs() : 0);
                if (evt.getResult() == TypingWordResult.CLEARED) {
                    rw.setClearedAt(now);
                }
                runWordRepository.save(rw);
            }
        }

        // Cập nhật số tim và điểm số
        int newLives = run.getLivesLeft() + result.getLivesDelta();
        run.setLivesLeft(newLives);
        run.setScore(run.getScore() + result.getCalculatedScore());
        run.setCurrentCombo(result.getCurrentCombo());
        run.setMaxCombo(Math.max(run.getMaxCombo(), result.getMaxCombo()));
        run.setWordsCleared(run.getWordsCleared() + result.getWordsCleared());
        run.setWordsMissed(run.getWordsMissed() + result.getWordsMissed());
        run.setTotalKeystrokes(run.getTotalKeystrokes() + result.getTotalKeystrokes());
        run.setWrongKeystrokes(run.getWrongKeystrokes() + result.getWrongKeystrokes());

        // Kiểm tra hết tim
        if (newLives <= 0) {
            run.setStatus(TypingGameRunStatus.GAME_OVER);
            run.setFinishedAt(now);
            finalizeRunStatsAndRecords(run, now, false);
            runRepository.save(run);

            return TypingRunResponse.builder()
                    .publicId(run.getPublicId())
                    .deckId(run.getDeck().getId())
                    .deckTitle(run.getDeck().getTitle())
                    .mode(run.getMode())
                    .totalStages(run.getTotalStages())
                    .livesLeft(0)
                    .currentStage(stageNo)
                    .currentCombo(0)
                    .score(run.getScore())
                    .spawnIntervalMs(spawnIntervalMs)
                    .baseSpeed(calculateBaseSpeed(stageNo))
                    .words(List.of())
                    .build();
        }

        // Kiểm tra hoàn thành toàn bộ mốc (Victory)
        if (stageNo >= run.getTotalStages()) {
            run.setStatus(TypingGameRunStatus.COMPLETED);
            run.setFinishedAt(now);
            finalizeRunStatsAndRecords(run, now, true);
            runRepository.save(run);

            return TypingRunResponse.builder()
                    .publicId(run.getPublicId())
                    .deckId(run.getDeck().getId())
                    .deckTitle(run.getDeck().getTitle())
                    .mode(run.getMode())
                    .totalStages(run.getTotalStages())
                    .livesLeft(run.getLivesLeft())
                    .currentStage(stageNo)
                    .currentCombo(run.getCurrentCombo())
                    .score(run.getScore())
                    .spawnIntervalMs(spawnIntervalMs)
                    .baseSpeed(calculateBaseSpeed(stageNo))
                    .words(List.of())
                    .build();
        }

        // Chuyển sang mốc tiếp theo
        int nextStageNo = stageNo + 1;
        run.setStageReached(nextStageNo);
        run.setCurrentStageServedAt(now);
        runRepository.save(run);

        List<TypingWordDto> nextWords = getStageWords(run.getId(), nextStageNo);

        return TypingRunResponse.builder()
                .publicId(run.getPublicId())
                .deckId(run.getDeck().getId())
                .deckTitle(run.getDeck().getTitle())
                .mode(run.getMode())
                .totalStages(run.getTotalStages())
                .livesLeft(run.getLivesLeft())
                .currentStage(nextStageNo)
                .currentCombo(run.getCurrentCombo())
                .score(run.getScore())
                .spawnIntervalMs(calculateSpawnIntervalMs(nextStageNo))
                .baseSpeed(calculateBaseSpeed(nextStageNo))
                .words(nextWords)
                .build();
    }

    @Override
    @Transactional
    public TypingRunResultResponse finishRun(String publicId, FinishTypingRunRequest request) {
        Users user = getCurrentUser();
        TypingGameRun run = runRepository.findByPublicId(publicId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy lượt chơi"));

        if (!run.getUser().getId().equals(user.getId())) {
            throw new NotFoundExeception("Không tìm thấy lượt chơi");
        }

        LocalDateTime now = LocalDateTime.now();

        // Idempotent: Nếu run đã kết thúc từ trước, chỉ trả về kết quả
        if (run.getStatus() == TypingGameRunStatus.IN_PROGRESS) {
            // Nếu có gửi kèm events của mốc dở dang, cập nhật nốt kết quả
            if (request.getEvents() != null && !request.getEvents().isEmpty()) {
                List<TypingGameRunWord> stageWords = runWordRepository.findByRunIdAndStageNoWithFlashcard(run.getId(), run.getStageReached());
                Map<Long, TypingGameRunWord> stageMap = stageWords.stream()
                        .collect(Collectors.toMap(rw -> rw.getFlashcard().getId(), rw -> rw));

                for (TypingWordEventDto evt : request.getEvents()) {
                    TypingGameRunWord rw = stageMap.get(evt.getFlashcardId());
                    if (rw != null && rw.getResult() == TypingWordResult.PENDING) {
                        rw.setResult(evt.getResult());
                        rw.setWrongKeystrokes(evt.getWrongKeystrokes() != null ? evt.getWrongKeystrokes() : 0);
                        rw.setClientDurationMs(evt.getClientDurationMs() != null ? evt.getClientDurationMs() : 0);
                        if (evt.getResult() == TypingWordResult.CLEARED) {
                            rw.setClearedAt(now);
                            run.setWordsCleared(run.getWordsCleared() + 1);
                        } else if (evt.getResult() == TypingWordResult.MISSED) {
                            run.setWordsMissed(run.getWordsMissed() + 1);
                        }
                        runWordRepository.save(rw);
                    }
                }
            }

            if ("LIVES_DEPLETED".equalsIgnoreCase(request.getReason())) {
                run.setStatus(TypingGameRunStatus.GAME_OVER);
                run.setLivesLeft(0);
            } else if ("VICTORY".equalsIgnoreCase(request.getReason()) && run.getStageReached() >= run.getTotalStages()) {
                run.setStatus(TypingGameRunStatus.COMPLETED);
            } else {
                run.setStatus(TypingGameRunStatus.ABANDONED);
            }

            run.setFinishedAt(now);
            finalizeRunStatsAndRecords(run, now, run.getStatus() == TypingGameRunStatus.COMPLETED);
            runRepository.save(run);
        }

        // Lấy danh sách từ vựng cần ôn lại (MISSED hoặc có sai phím)
        List<TypingGameRunWord> allRunWords = runWordRepository.findAllByRunIdWithFlashcard(run.getId());
        List<TypingReviewWordDto> reviewWords = allRunWords.stream()
                .filter(rw -> rw.getResult() == TypingWordResult.MISSED || rw.getWrongKeystrokes() > 0)
                .sorted((a, b) -> {
                    if (a.getResult() == TypingWordResult.MISSED && b.getResult() != TypingWordResult.MISSED) return -1;
                    if (b.getResult() == TypingWordResult.MISSED && a.getResult() != TypingWordResult.MISSED) return 1;
                    return Integer.compare(b.getWrongKeystrokes(), a.getWrongKeystrokes());
                })
                .limit(20)
                .map(rw -> {
                    Flashcard fc = rw.getFlashcard();
                    return TypingReviewWordDto.builder()
                            .flashcardId(fc.getId())
                            .word(fc.getFrontText())
                            .meaning(fc.getBackText() != null ? fc.getBackText() : fc.getDefinition())
                            .phonetic(fc.getPhonetic())
                            .audioUrl(fc.getFrontAudioUrl() != null ? fc.getFrontAudioUrl() : fc.getBackAudioUrl())
                            .exampleText(fc.getExampleText())
                            .exampleMeaning(fc.getExampleTranslation())
                            .result(rw.getResult().name())
                            .wrongKeystrokes(rw.getWrongKeystrokes())
                            .build();
                })
                .toList();

        // Kiểm tra xem có lập kỷ lục điểm cao mới không
        boolean isNewHighScore = false;
        Optional<TypingGameHighScore> hsOpt = highScoreRepository.findByUserIdAndDeckIdAndMode(user.getId(), run.getDeck().getId(), run.getMode());
        if (hsOpt.isPresent() && hsOpt.get().getRun() != null && hsOpt.get().getRun().getId().equals(run.getId())) {
            isNewHighScore = true;
        }

        // Tính số XP còn lại có thể nhận trong ngày
        LocalDate userToday = getUserLocalDate(user);
        LocalDateTime startOfDay = userToday.atStartOfDay();
        LocalDateTime endOfDay = userToday.plusDays(1).atStartOfDay();
        int dailyXpUsed = runRepository.sumDailyXpEarned(user.getId(), startOfDay, endOfDay);
        int dailyXpRemaining = Math.max(0, dailyXpCap - dailyXpUsed);

        return TypingRunResultResponse.builder()
                .publicId(run.getPublicId())
                .deckId(run.getDeck().getId())
                .deckTitle(run.getDeck().getTitle())
                .mode(run.getMode())
                .status(run.getStatus())
                .score(run.getScore())
                .stageReached(run.getStageReached())
                .totalStages(run.getTotalStages())
                .wordsCleared(run.getWordsCleared())
                .wordsMissed(run.getWordsMissed())
                .accuracy(run.getAccuracy())
                .wpm(run.getWpm())
                .maxCombo(run.getMaxCombo())
                .xpEarned(run.getXpEarned())
                .dailyXpRemaining(dailyXpRemaining)
                .isNewHighScore(isNewHighScore)
                .reviewWords(reviewWords)
                .build();
    }

    private void finalizeRunStatsAndRecords(TypingGameRun run, LocalDateTime now, boolean isVictory) {
        // 1. Tính toán Accuracy
        int totalKey = run.getTotalKeystrokes();
        int wrongKey = run.getWrongKeystrokes();
        if (totalKey > 0) {
            double acc = Math.max(0.0, (double) (totalKey - wrongKey) / totalKey * 100.0);
            run.setAccuracy(BigDecimal.valueOf(acc).setScale(2, RoundingMode.HALF_UP));
        } else {
            run.setAccuracy(BigDecimal.ZERO);
        }

        // 2. Tính toán WPM: (wordsCleared) / (totalPlayMinutes)
        long totalDurationMs = Math.max(1000L, Duration.between(run.getStartedAt(), now).toMillis());
        double minutes = totalDurationMs / 60000.0;
        double wpmVal = minutes > 0 ? (run.getWordsCleared() / minutes) : 0.0;
        run.setWpm(BigDecimal.valueOf(wpmVal).setScale(2, RoundingMode.HALF_UP));

        // 3. Tính XP và áp trần ngày (nếu không bị cờ cheat)
        if (!Boolean.TRUE.equals(run.getFlaggedCheat())) {
            int stagesCleared = isVictory ? run.getTotalStages() : Math.max(0, run.getStageReached() - 1);
            int rawXp = (run.getWordsCleared() * 2) + (stagesCleared * 5) + (isVictory ? 20 : 0);

            Users user = run.getUser();
            LocalDate userToday = getUserLocalDate(user);
            LocalDateTime startOfDay = userToday.atStartOfDay();
            LocalDateTime endOfDay = userToday.plusDays(1).atStartOfDay();

            int todayXpEarned = runRepository.sumDailyXpEarned(user.getId(), startOfDay, endOfDay);
            int remainingCap = Math.max(0, dailyXpCap - todayXpEarned);
            int xpAwarded = Math.min(rawXp, remainingCap);

            run.setXpEarned(xpAwarded);

            if (xpAwarded > 0) {
                // Cộng dồn vào xpTotal của User
                user.setXpTotal((user.getXpTotal() != null ? user.getXpTotal() : 0L) + xpAwarded);
                usersRepository.save(user);

                // Ghi nhận an toàn vào daily_learning_activities mà KHÔNG thay đổi cardsLearned, reviewCount, streak
                DailyLearningActivity activity = dailyLearningActivityRepository
                        .findByUserIdAndActivityDate(user.getId(), userToday)
                        .orElseGet(() -> {
                            DailyLearningActivity dla = new DailyLearningActivity();
                            dla.setUser(user);
                            dla.setActivityDate(userToday);
                            dla.setTimezone(user.getTimezone() != null ? user.getTimezone() : "Asia/Ho_Chi_Minh");
                            dla.setReviewCount(0);
                            dla.setCardsLearned(0);
                            dla.setQuizCount(0);
                            dla.setMinutesSpent(0);
                            dla.setXpEarned(0);
                            dla.setGoalMet(false);
                            return dla;
                        });

                activity.setXpEarned((activity.getXpEarned() != null ? activity.getXpEarned() : 0) + xpAwarded);
                dailyLearningActivityRepository.save(activity);
            }
        } else {
            run.setXpEarned(0);
        }

        // 4. Cập nhật Bảng Kỷ lục High Score cá nhân
        Optional<TypingGameHighScore> hsOpt = highScoreRepository.findByUserIdAndDeckIdAndMode(run.getUser().getId(), run.getDeck().getId(), run.getMode());
        if (hsOpt.isPresent()) {
            TypingGameHighScore hs = hsOpt.get();
            if (run.getScore() > hs.getBestScore()) {
                hs.setBestScore(run.getScore());
                hs.setBestStage(run.getStageReached());
                hs.setBestWpm(run.getWpm());
                hs.setBestAccuracy(run.getAccuracy());
                hs.setRun(run);
                highScoreRepository.save(hs);
            }
        } else {
            TypingGameHighScore newHs = TypingGameHighScore.builder()
                    .user(run.getUser())
                    .deck(run.getDeck())
                    .mode(run.getMode())
                    .bestScore(run.getScore())
                    .bestStage(run.getStageReached())
                    .bestWpm(run.getWpm())
                    .bestAccuracy(run.getAccuracy())
                    .run(run)
                    .build();
            highScoreRepository.save(newHs);
        }

        // 5. Đồng bộ SM-2 (SRS) an toàn: Tối đa 10 thẻ (ưu tiên MISSED, sau đó đến sai nhiều nhất)
        syncSm2ForRun(run, now);
    }

    private void syncSm2ForRun(TypingGameRun run, LocalDateTime now) {
        List<TypingGameRunWord> runWords = runWordRepository.findAllByRunIdWithFlashcard(run.getId());

        List<TypingGameRunWord> candidateWords = runWords.stream()
                .filter(rw -> rw.getResult() == TypingWordResult.MISSED || rw.getWrongKeystrokes() > 0)
                .sorted((a, b) -> {
                    if (a.getResult() == TypingWordResult.MISSED && b.getResult() != TypingWordResult.MISSED) return -1;
                    if (b.getResult() == TypingWordResult.MISSED && a.getResult() != TypingWordResult.MISSED) return 1;
                    return Integer.compare(b.getWrongKeystrokes(), a.getWrongKeystrokes());
                })
                .limit(10)
                .toList();

        for (TypingGameRunWord rw : candidateWords) {
            Optional<CardProgress> cpOpt = cardProgressRepository.findByUserIdAndCardId(run.getUser().getId(), rw.getFlashcard().getId());
            if (cpOpt.isPresent()) {
                CardProgress cp = cpOpt.get();
                // Chỉ áp dụng khi progress đã tồn tại và state != NEW
                if (cp.getState() != CardProgressState.NEW) {
                    if (cp.getDueAt() == null || cp.getDueAt().isAfter(now)) {
                        cp.setDueAt(now);
                        cardProgressRepository.save(cp);
                    }
                }
            }
        }
    }

    private LocalDate getUserLocalDate(Users user) {
        String tz = (user.getTimezone() != null && !user.getTimezone().isBlank()) ? user.getTimezone() : "Asia/Ho_Chi_Minh";
        try {
            return LocalDate.now(ZoneId.of(tz));
        } catch (Exception e) {
            return LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        }
    }

    @Override
    @Transactional
    public void abandonRun(String publicId) {
        Users user = getCurrentUser();
        TypingGameRun run = runRepository.findByPublicId(publicId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy lượt chơi"));

        if (!run.getUser().getId().equals(user.getId())) {
            throw new NotFoundExeception("Không tìm thấy lượt chơi");
        }

        if (run.getStatus() == TypingGameRunStatus.IN_PROGRESS) {
            run.setStatus(TypingGameRunStatus.ABANDONED);
            run.setFinishedAt(LocalDateTime.now());
            runRepository.save(run);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TypingLeaderboardEntryDto> getHighScores(Long deckId, TypingGameMode mode) {
        List<TypingGameHighScore> topScores = highScoreRepository.findTopByDeckIdAndMode(deckId, mode, PageRequest.of(0, 10));

        List<TypingLeaderboardEntryDto> dtos = new ArrayList<>();
        int rank = 1;
        for (TypingGameHighScore hs : topScores) {
            Users u = hs.getUser();
            String displayName = (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : "Learner #" + u.getId();

            dtos.add(TypingLeaderboardEntryDto.builder()
                    .rank(rank++)
                    .userId(u.getId())
                    .displayName(displayName)
                    .avatarUrl(u.getAvatarUrl())
                    .score(hs.getBestScore())
                    .stage(hs.getBestStage())
                    .wpm(hs.getBestWpm())
                    .accuracy(hs.getBestAccuracy())
                    .achievedAt(hs.getUpdatedAt() != null ? hs.getUpdatedAt() : hs.getCreatedAt())
                    .build());
        }

        return dtos;
    }
}
