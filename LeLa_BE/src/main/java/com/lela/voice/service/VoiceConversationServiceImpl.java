package com.lela.voice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.*;
import com.lela.voice.dto.*;
import com.lela.voice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceConversationServiceImpl implements VoiceConversationService {

    private final ConversationQuotaService quotaService;
    private final ConversationLevelService levelService;
    private final TargetWordSelector targetWordSelector;
    private final VocabularyWhitelistService whitelistService;
    private final VoiceAiService voiceAiService;
    private final VoiceSessionFinalizer sessionFinalizer;
    private final ConversationScenarioRepository scenarioRepository;
    private final ConversationSessionRepository sessionRepository;
    private final ConversationTurnRepository turnRepository;
    private final ConversationTargetWordRepository targetWordRepository;
    private final FoundationWordRepository foundationWordRepository;
    private final VoiceConfigurationProperties props;
    private final ObjectMapper objectMapper;

    private VoiceUiConfigDto buildUiConfig(int level) {
        // Tốc độ TTS tuyến tính 0.8x -> 1.1x theo level
        double ttsRate = 0.8 + ((level - 100) / 900.0) * 0.3;
        ttsRate = Math.round(ttsRate * 100.0) / 100.0;
        boolean bilingual = level < 500;
        return new VoiceUiConfigDto(ttsRate, bilingual, true, 8);
    }

    private List<VoiceTargetWordDto> mapTargetWordsToDtos(List<ConversationTargetWord> targetWords) {
        return targetWords.stream()
                .map(tw -> new VoiceTargetWordDto(
                        tw.getFlashcard() != null ? tw.getFlashcard().getId() : null,
                        tw.getWordText(),
                        tw.getFlashcard() != null ? tw.getFlashcard().getBackText() : null,
                        tw.getFlashcard() != null ? tw.getFlashcard().getPhonetic() : null,
                        tw.getUsedCorrectly(),
                        tw.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VoiceStatusResponse getStatus(Users user) {
        Long userId = user.getId();

        boolean unlocked = quotaService.isFeatureUnlocked(userId);
        long learnedCards = quotaService.getLearnedCardsCount(userId);
        int remainingQuota = quotaService.getRemainingQuota(userId);
        String nextReset = quotaService.getNextResetAtIso(userId);

        UserConversationLevel userLvl = levelService.getOrCreateLevel(userId, user);
        Optional<ConversationSession> inProgress = sessionRepository.findInProgressSessionByUserId(userId);

        VoiceUiConfigDto uiConfig = buildUiConfig(userLvl.getCurrentLevel());

        return new VoiceStatusResponse(
                unlocked,
                learnedCards,
                20L,
                remainingQuota,
                props.getMaxSessionsPerDay(),
                nextReset,
                userLvl.getCurrentLevel(),
                userLvl.getInitialBandMin(),
                userLvl.getHighestLevel(),
                userLvl.getTotalSessions(),
                userLvl.getConsecutiveHardCount(),
                inProgress.isPresent(),
                inProgress.map(ConversationSession::getPublicId).orElse(null),
                uiConfig
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationScenarioDto> getScenarios(Users user) {
        UserConversationLevel userLvl = levelService.getOrCreateLevel(user.getId(), user);
        List<ConversationScenario> scenarios = scenarioRepository.findActiveForLevel(userLvl.getCurrentLevel());
        if (scenarios.isEmpty()) {
            scenarios = scenarioRepository.findByIsActiveTrue();
        }
        return scenarios.stream()
                .map(s -> new ConversationScenarioDto(
                        s.getId(),
                        s.getTitle(),
                        s.getSlug(),
                        s.getLevelMin(),
                        s.getLevelMax(),
                        s.getAiRole(),
                        s.getUserRole(),
                        s.getDescription(),
                        s.getOpeningLine(),
                        s.getIsActive()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VoiceStartResponse startSession(Users user, VoiceStartRequest req) {
        // 1. Chọn Scenario
        ConversationScenario scenario = null;
        if (req != null && req.scenarioSlug() != null && !req.scenarioSlug().isBlank()) {
            scenario = scenarioRepository.findBySlug(req.scenarioSlug()).orElse(null);
        }
        if (scenario == null) {
            UserConversationLevel lvl = levelService.getOrCreateLevel(user.getId(), user);
            List<ConversationScenario> available = scenarioRepository.findActiveForLevel(lvl.getCurrentLevel());
            if (available.isEmpty()) available = scenarioRepository.findByIsActiveTrue();
            if (available.isEmpty()) throw new IllegalStateException("Không có kịch bản hội thoại khả dụng.");
            scenario = available.get(new Random().nextInt(available.size()));
        }

        // 2. Chọn 3-5 Target Words
        List<Flashcard> targetCards = targetWordSelector.selectTargetWords(user.getId());
        if (targetCards.size() < 3) {
            throw new IllegalStateException("Chưa đủ từ vựng mục tiêu để bắt đầu (cần tối thiểu 3 từ). Hãy học thêm thẻ Flashcard!");
        }

        // 3. Khóa quota và tạo phiên IN_PROGRESS
        ConversationSession session = quotaService.startSessionWithLock(user, scenario, targetCards);

        // 4. Lưu Target Words cho phiên nếu phiên mới tạo
        List<ConversationTargetWord> existingTargetWords = targetWordRepository.findBySessionId(session.getId());
        if (existingTargetWords.isEmpty()) {
            for (Flashcard card : targetCards) {
                ConversationTargetWord tw = ConversationTargetWord.builder()
                        .session(session)
                        .flashcard(card)
                        .wordText(card.getFrontText())
                        .usedCount(0)
                        .usedCorrectly(false)
                        .status("UNUSED")
                        .build();
                targetWordRepository.save(tw);
            }
            existingTargetWords = targetWordRepository.findBySessionId(session.getId());
        }

        // 5. Lưu Turn 0 (Lời mở đầu của AI) nếu chưa có
        List<ConversationTurn> turns = turnRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());
        if (turns.isEmpty()) {
            ConversationTurn openingTurn = ConversationTurn.builder()
                    .session(session)
                    .turnNumber(0)
                    .role("ASSISTANT")
                    .transcript(scenario.getOpeningLine())
                    .isValid(true)
                    .aiReply(scenario.getOpeningLine())
                    .build();
            turnRepository.save(openingTurn);
        }

        List<VoiceTargetWordDto> wordDtos = mapTargetWordsToDtos(existingTargetWords);
        VoiceUiConfigDto uiConfig = buildUiConfig(session.getLevelAtStart());

        return new VoiceStartResponse(
                session.getPublicId(),
                scenario.getTitle(),
                scenario.getAiRole(),
                scenario.getUserRole(),
                scenario.getOpeningLine(),
                session.getLevelAtStart(),
                props.getMaxDurationSeconds(),
                props.getMaxValidTurns(),
                wordDtos,
                uiConfig
        );
    }

    @Override
    @Transactional
    public VoiceTurnResponse processTurn(Users user, String publicId, VoiceTurnRequest req) {
        ConversationSession session = sessionRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại");
        }

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new IllegalStateException("Phiên hội thoại đã kết thúc");
        }

        // Cập nhật last_activity_at và thời lượng
        LocalDateTime now = LocalDateTime.now();
        session.setLastActivityAt(now);
        if (session.getStartedAt() != null) {
            long duration = Duration.between(session.getStartedAt(), now).getSeconds();
            session.setDurationSeconds((int) duration);
        }

        // Kiểm tra lượt hợp lệ:
        boolean isValid = req.transcript() != null && !req.transcript().isBlank();
        if (isValid && req.sttConfidence() != null && req.sttConfidence().doubleValue() > 0.0) {
            if (req.sttConfidence().doubleValue() < props.getMinSttConfidence() && Boolean.TRUE.equals(req.isRetry())) {
                isValid = false; // Lượt nói lại không bị trừ điểm và không tính lượt
            }
        }

        List<ConversationTurn> turns = turnRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());
        int nextTurnNumber = turns.isEmpty() ? 1 : turns.get(turns.size() - 1).getTurnNumber() + 1;

        if (isValid) {
            session.setValidTurnCount(session.getValidTurnCount() + 1);
        }

        // Lấy danh sách Target Words của phiên (eagerly fetch flashcard)
        List<ConversationTargetWord> targetWords = targetWordRepository.findBySessionId(session.getId());
        List<String> targetWordStrings = targetWords.stream().map(ConversationTargetWord::getWordText).collect(Collectors.toList());

        // Lấy tập hợp Whitelist
        Set<String> whitelist = foundationWordRepository.findAllWordsLower();
        for (ConversationTargetWord tw : targetWords) {
            whitelist.addAll(whitelistService.generateInflections(tw.getWordText()));
        }

        // Lịch sử hội thoại 4 turns gần nhất
        List<String> history = turns.stream()
                .skip(Math.max(0, turns.size() - 4))
                .map(t -> t.getRole() + ": " + t.getTranscript())
                .collect(Collectors.toList());

        // Gọi VoiceAiService với Gemini và fallback
        VoiceAiService.TurnAiOutput aiOutput = voiceAiService.generateTurnResponse(
                session.getScenario(),
                session.getLevelAtStart(),
                req.transcript(),
                targetWordStrings,
                whitelist,
                history
        );

        if (aiOutput.getTokensUsed() != null) {
            session.setAiTokensUsed(session.getAiTokensUsed() + aiOutput.getTokensUsed());
        }

        // So khớp và cập nhật Target Words
        for (ConversationTargetWord tw : targetWords) {
            boolean matchedInUserSpeech = whitelistService.tokenizeText(req.transcript()).stream()
                    .anyMatch(tok -> whitelistService.matchesTargetWord(tok, tw.getWordText()));

            if (matchedInUserSpeech) {
                tw.setUsedCount(tw.getUsedCount() + 1);
                boolean hasGrammarError = aiOutput.getGrammarErrors() != null && !aiOutput.getGrammarErrors().isEmpty();
                if (hasGrammarError) {
                    tw.setStatus("USED_WRONG");
                    tw.setUsedCorrectly(false);
                } else {
                    tw.setStatus("USED_CORRECT");
                    tw.setUsedCorrectly(true);
                }
                targetWordRepository.save(tw);
            }
        }

        String grammarErrorsJson = "[]";
        try {
            if (aiOutput.getGrammarErrors() != null) {
                grammarErrorsJson = objectMapper.writeValueAsString(aiOutput.getGrammarErrors());
            }
        } catch (Exception ignored) {}

        // Lưu Turn mới
        ConversationTurn turn = ConversationTurn.builder()
                .session(session)
                .turnNumber(nextTurnNumber)
                .role("USER")
                .transcript(req.transcript() != null ? req.transcript() : "")
                .sttConfidence(req.sttConfidence())
                .isValid(isValid)
                .grammarErrorsJson(grammarErrorsJson)
                .correctedText(aiOutput.getCorrectedSentence())
                .aiReply(aiOutput.getAiReply())
                .suggestionText(aiOutput.getQuickSuggestion())
                .build();
        turnRepository.save(turn);
        sessionRepository.save(session);

        // Kiểm tra điều kiện kết thúc phiên:
        boolean sessionEnded = false;
        String endReason = null;
        if (session.getDurationSeconds() >= props.getMaxDurationSeconds()) {
            sessionEnded = true;
            endReason = "Hết thời gian 300 giây của phiên hội thoại.";
        } else if (session.getValidTurnCount() >= props.getMaxValidTurns()) {
            sessionEnded = true;
            endReason = "Đã hoàn thành xuất sắc 10 lượt hội thoại.";
        }

        List<ConversationTargetWord> updatedTargetWords = targetWordRepository.findBySessionId(session.getId());
        List<VoiceTargetWordDto> updatedWordDtos = mapTargetWordsToDtos(updatedTargetWords);

        return new VoiceTurnResponse(
                nextTurnNumber,
                aiOutput.getAiReply(),
                aiOutput.getGrammarErrors() != null ? aiOutput.getGrammarErrors() : Collections.emptyList(),
                aiOutput.getCorrectedSentence(),
                aiOutput.getQuickSuggestion(),
                updatedWordDtos,
                session.getValidTurnCount(),
                sessionEnded,
                endReason
        );
    }

    @Override
    @Transactional
    public VoiceReportResponse finishSession(Users user, String publicId, VoiceFinishRequest req) {
        String feedback = req != null ? req.feedback() : "COMFORTABLE";

        ConversationSession session = sessionFinalizer.finalizeSession(publicId, user.getId(), feedback);

        UserConversationLevel userLvl = levelService.getOrCreateLevel(user.getId(), user);
        List<ConversationTargetWord> targetWords = targetWordRepository.findBySessionId(session.getId());
        List<ConversationTurn> turns = turnRepository.findBySessionIdOrderByTurnNumberAsc(session.getId());

        List<VoiceTargetWordDto> wordDtos = mapTargetWordsToDtos(targetWords);

        List<VoiceTurnCorrectionDto> corrections = new ArrayList<>();
        for (ConversationTurn t : turns) {
            if ("USER".equalsIgnoreCase(t.getRole()) && t.getCorrectedText() != null && !t.getCorrectedText().isBlank()) {
                List<String> errors = Collections.emptyList();
                try {
                    if (t.getGrammarErrorsJson() != null && !t.getGrammarErrorsJson().isBlank()) {
                        errors = objectMapper.readValue(t.getGrammarErrorsJson(), List.class);
                    }
                } catch (Exception ignored) {}

                corrections.add(new VoiceTurnCorrectionDto(
                        t.getTurnNumber(),
                        t.getTranscript(),
                        errors,
                        t.getCorrectedText()
                ));
            }
        }

        boolean hardWarning = userLvl.getConsecutiveHardCount() >= 3;

        return new VoiceReportResponse(
                session.getPublicId(),
                session.getOverallScore() != null ? session.getOverallScore() : 0,
                null, // Pronunciation score explicitly NULL
                session.getGrammarScore() != null ? session.getGrammarScore() : 0,
                session.getFluencyScore() != null ? session.getFluencyScore() : 0,
                session.getVocabularyScore() != null ? session.getVocabularyScore() : 0,
                session.getSystemRecommendation(),
                session.getUserFeedback(),
                session.getLevelAtStart(),
                userLvl.getCurrentLevel(),
                session.getXpAwarded(),
                hardWarning,
                wordDtos,
                corrections
        );
    }

    @Override
    @Transactional
    public void abandonSession(Users user, String publicId) {
        quotaService.abandonSession(publicId, user.getId());
    }
}
