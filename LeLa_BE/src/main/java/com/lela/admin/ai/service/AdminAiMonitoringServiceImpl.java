package com.lela.admin.ai.service;

import com.lela.admin.ai.dto.*;
import com.lela.chat.ChatConversationRepository;
import com.lela.chat.ChatMessageRepository;
import com.lela.chat.domain.ChatConversation;
import com.lela.chat.domain.ChatMessage;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.voice.domain.*;
import com.lela.voice.repository.*;
import com.lela.voice.service.ConversationQuotaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAiMonitoringServiceImpl implements AdminAiMonitoringService {

    private final ConversationSessionRepository sessionRepository;
    private final ConversationTurnRepository turnRepository;
    private final ConversationTargetWordRepository targetWordRepository;
    private final ConversationScenarioRepository scenarioRepository;
    private final UsageLedgerRepository usageLedgerRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UsersRepository usersRepository;
    private final UserConversationLevelRepository userLevelRepository;
    private final ConversationQuotaService quotaService;

    @Override
    @Transactional(readOnly = true)
    public AdminAiOverviewStats getOverviewStats() {
        long totalSessions = sessionRepository.count();
        long completedSessions = sessionRepository.countByStatus("COMPLETED");
        long abandonedSessions = sessionRepository.countByStatus("ABANDONED");
        long totalVoiceMinutes = usageLedgerRepository.sumAllSessionMinutes();

        long totalScenarios = scenarioRepository.count();
        long publishedScenarios = scenarioRepository.findByIsActiveTrue().size();

        long totalAiTutor = chatConversationRepository.countByChannelType("AI_TUTOR");
        long totalFallback = chatConversationRepository.countByChannelTypeAndIsFallbackTriggeredTrue("AI_TUTOR");
        long activeAiUsers = userLevelRepository.count();

        return AdminAiOverviewStats.builder()
                .totalVoiceSessions(totalSessions)
                .completedVoiceSessions(completedSessions)
                .abandonedVoiceSessions(abandonedSessions)
                .totalVoiceMinutes(totalVoiceMinutes)
                .totalScenarios(totalScenarios)
                .publishedScenarios(publishedScenarios)
                .totalAiTutorConversations(totalAiTutor)
                .totalFallbackTriggeredConversations(totalFallback)
                .totalActiveAiUsers(activeAiUsers)
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 1: VOICE SESSIONS
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<AdminVoiceSessionResponse> getVoiceSessions(
            String status,
            Long userId,
            Long scenarioId,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<ConversationSession> page = sessionRepository.findWithFilters(
                status, userId, scenarioId, startDt, endDt, search, pageable
        );

        return page.map(this::mapToVoiceSessionResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminVoiceSessionDetailResponse getVoiceSessionDetail(Long id) {
        ConversationSession s = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên hội thoại ID: " + id));

        List<ConversationTurn> turns = turnRepository.findBySessionIdOrderByTurnNumberAsc(s.getId());
        List<ConversationTargetWord> targetWords = targetWordRepository.findBySessionId(s.getId());

        List<AdminVoiceTurnDto> turnDtos = turns.stream().map(t -> AdminVoiceTurnDto.builder()
                .id(t.getId())
                .turnNumber(t.getTurnNumber())
                .role(t.getRole())
                .transcript(t.getTranscript())
                .sttConfidence(t.getSttConfidence())
                .isValid(t.getIsValid())
                .pronunciationScore(t.getPronunciationScore())
                .grammarErrorsJson(t.getGrammarErrorsJson())
                .correctedText(t.getCorrectedText())
                .aiReply(t.getAiReply())
                .suggestionText(t.getSuggestionText())
                .audioUrl(t.getAudioUrl())
                .createdAt(t.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        List<AdminTargetWordDto> targetWordDtos = targetWords.stream().map(tw -> AdminTargetWordDto.builder()
                .id(tw.getId())
                .flashcardId(tw.getFlashcard() != null ? tw.getFlashcard().getId() : null)
                .wordText(tw.getWordText())
                .usedCount(tw.getUsedCount())
                .usedCorrectly(tw.getUsedCorrectly())
                .status(tw.getStatus())
                .build()
        ).collect(Collectors.toList());

        int durationSec = s.getDurationSeconds() != null ? s.getDurationSeconds() : 0;
        int minutesUsed = Math.max(1, (int) Math.ceil(durationSec / 60.0));

        return AdminVoiceSessionDetailResponse.builder()
                .id(s.getId())
                .publicId(s.getPublicId())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .username(s.getUser() != null ? s.getUser().getUsername() : null)
                .userFullName(s.getUser() != null ? s.getUser().getFullName() : null)
                .userEmail(s.getUser() != null ? s.getUser().getEmail() : null)
                .scenarioId(s.getScenario() != null ? s.getScenario().getId() : null)
                .scenarioTitle(s.getScenario() != null ? s.getScenario().getTitle() : null)
                .scenarioDescription(s.getScenario() != null ? s.getScenario().getDescription() : null)
                .aiRole(s.getScenario() != null ? s.getScenario().getAiRole() : null)
                .userRole(s.getScenario() != null ? s.getScenario().getUserRole() : null)
                .levelAtStart(s.getLevelAtStart())
                .overallScore(s.getOverallScore())
                .pronunciationScore(s.getPronunciationScore())
                .grammarScore(s.getGrammarScore())
                .fluencyScore(s.getFluencyScore())
                .vocabularyScore(s.getVocabularyScore())
                .userFeedback(s.getUserFeedback())
                .systemRecommendation(s.getSystemRecommendation())
                .durationSeconds(durationSec)
                .minutesUsed(minutesUsed)
                .validTurnCount(s.getValidTurnCount())
                .status(s.getStatus())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .finishedAt(s.getFinishedAt())
                .xpAwarded(s.getXpAwarded())
                .aiTokensUsed(s.getAiTokensUsed())
                .turns(turnDtos)
                .targetWords(targetWordDtos)
                .build();
    }

    private AdminVoiceSessionResponse mapToVoiceSessionResponse(ConversationSession s) {
        int durationSec = s.getDurationSeconds() != null ? s.getDurationSeconds() : 0;
        int minutesUsed = Math.max(1, (int) Math.ceil(durationSec / 60.0));

        return AdminVoiceSessionResponse.builder()
                .id(s.getId())
                .publicId(s.getPublicId())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .username(s.getUser() != null ? s.getUser().getUsername() : null)
                .userFullName(s.getUser() != null ? s.getUser().getFullName() : null)
                .userEmail(s.getUser() != null ? s.getUser().getEmail() : null)
                .scenarioId(s.getScenario() != null ? s.getScenario().getId() : null)
                .scenarioTitle(s.getScenario() != null ? s.getScenario().getTitle() : null)
                .levelAtStart(s.getLevelAtStart())
                .overallScore(s.getOverallScore())
                .pronunciationScore(s.getPronunciationScore())
                .grammarScore(s.getGrammarScore())
                .fluencyScore(s.getFluencyScore())
                .vocabularyScore(s.getVocabularyScore())
                .userFeedback(s.getUserFeedback())
                .systemRecommendation(s.getSystemRecommendation())
                .durationSeconds(durationSec)
                .minutesUsed(minutesUsed)
                .validTurnCount(s.getValidTurnCount())
                .status(s.getStatus())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .finishedAt(s.getFinishedAt())
                .xpAwarded(s.getXpAwarded())
                .aiTokensUsed(s.getAiTokensUsed())
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 2: QUOTA LEDGER & MANUAL ADJUSTMENT
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<AdminQuotaLedgerResponse> getQuotaLedger(
            Long userId,
            String entryType,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        Page<UsageLedger> page = usageLedgerRepository.findWithFilters(
                userId, entryType, startDate, endDate, search, pageable
        );

        return page.map(ul -> AdminQuotaLedgerResponse.builder()
                .id(ul.getId())
                .userId(ul.getUser() != null ? ul.getUser().getId() : null)
                .username(ul.getUser() != null ? ul.getUser().getUsername() : null)
                .userFullName(ul.getUser() != null ? ul.getUser().getFullName() : null)
                .userEmail(ul.getUser() != null ? ul.getUser().getEmail() : null)
                .sessionId(ul.getSession() != null ? ul.getSession().getId() : null)
                .sessionPublicId(ul.getSession() != null ? ul.getSession().getPublicId() : null)
                .scenarioTitle(ul.getSession() != null && ul.getSession().getScenario() != null ? ul.getSession().getScenario().getTitle() : null)
                .entryType(ul.getEntryType())
                .minutesUsed(ul.getMinutesUsed())
                .usageDate(ul.getUsageDate())
                .adminActorId(ul.getAdminActor() != null ? ul.getAdminActor().getId() : null)
                .adminActorName(ul.getAdminActor() != null ? ul.getAdminActor().getFullName() : "Hệ thống tự động")
                .reason(ul.getReason())
                .createdAt(ul.getCreatedAt())
                .build()
        );
    }

    @Override
    @Transactional
    public AdminQuotaLedgerResponse adjustQuota(AdminAdjustQuotaRequest request, Long adminId) {
        Users targetUser = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học viên ID: " + request.getUserId()));

        Users adminActor = null;
        if (adminId != null) {
            adminActor = usersRepository.findById(adminId).orElse(null);
        }

        UsageLedger entry = UsageLedger.builder()
                .user(targetUser)
                .session(null)
                .entryType("ADJUST")
                .minutesUsed(request.getMinutes())
                .usageDate(LocalDate.now())
                .adminActor(adminActor)
                .reason(request.getReason().trim())
                .build();

        entry = usageLedgerRepository.save(entry);

        log.info("Admin {} adjusted {} minutes for user {}. Reason: {}", 
                adminActor != null ? adminActor.getUsername() : "UNKNOWN", 
                request.getMinutes(), targetUser.getUsername(), request.getReason());

        return AdminQuotaLedgerResponse.builder()
                .id(entry.getId())
                .userId(targetUser.getId())
                .username(targetUser.getUsername())
                .userFullName(targetUser.getFullName())
                .userEmail(targetUser.getEmail())
                .entryType(entry.getEntryType())
                .minutesUsed(entry.getMinutesUsed())
                .usageDate(entry.getUsageDate())
                .adminActorId(adminActor != null ? adminActor.getId() : null)
                .adminActorName(adminActor != null ? adminActor.getFullName() : "Hệ thống")
                .reason(entry.getReason())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserQuotaSummaryResponse> getUserQuotaSummaries(String search) {
        List<Users> users;
        if (search != null && !search.isBlank()) {
            users = usersRepository.searchUsers(search.trim(), null, org.springframework.data.domain.PageRequest.of(0, 50)).getContent();
        } else {
            users = usersRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 50)).getContent();
        }

        LocalDate today = LocalDate.now();
        List<AdminUserQuotaSummaryResponse> result = new ArrayList<>();

        for (Users u : users) {
            int sessionMin = usageLedgerRepository.sumSessionMinutesByUserId(u.getId());
            int adjustMin = usageLedgerRepository.sumAdjustedMinutesByUserId(u.getId());
            int todayMin = usageLedgerRepository.sumTodaySessionMinutes(u.getId(), today);
            int remainingQuota = quotaService.getRemainingQuota(u.getId());

            Integer currentLevel = userLevelRepository.findByUserId(u.getId())
                    .map(UserConversationLevel::getCurrentLevel)
                    .orElse(200);

            result.add(AdminUserQuotaSummaryResponse.builder()
                    .userId(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .totalSessionMinutes(sessionMin)
                    .totalAdjustedMinutes(adjustMin)
                    .netMinutes(sessionMin + adjustMin)
                    .todayUsedMinutes(todayMin)
                    .remainingSessionsToday(remainingQuota)
                    .currentLevel(currentLevel)
                    .build());
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 3: AI TUTOR & FALLBACK LOGS
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAiTutorSessionResponse> getAiTutorLogs(
            Boolean isFallbackOnly,
            Long userId,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<ChatConversation> page = chatConversationRepository.findAiTutorSessionsWithFilters(
                isFallbackOnly, userId, startDt, endDt, search, pageable
        );

        return page.map(c -> {
            List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
            return AdminAiTutorSessionResponse.builder()
                    .id(c.getId())
                    .userId(c.getUser() != null ? c.getUser().getId() : null)
                    .username(c.getUser() != null ? c.getUser().getUsername() : "Guest")
                    .userFullName(c.getUser() != null ? c.getUser().getFullName() : c.getGuestName())
                    .userEmail(c.getUser() != null ? c.getUser().getEmail() : c.getGuestEmail())
                    .status(c.getStatus() != null ? c.getStatus().name() : "CLOSED")
                    .isFallbackTriggered(Boolean.TRUE.equals(c.getIsFallbackTriggered()))
                    .fallbackReason(c.getFallbackReason())
                    .errorMessage(c.getErrorMessage())
                    .messageCount(msgs.size())
                    .createdAt(c.getCreatedAt())
                    .updatedAt(c.getUpdatedAt())
                    .build();
        });
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAiTutorSessionResponse getAiTutorLogDetail(Long id) {
        ChatConversation c = chatConversationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên AI Tutor ID: " + id));

        List<ChatMessage> msgs = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
        List<AdminAiTutorMessageDto> msgDtos = msgs.stream().map(m -> AdminAiTutorMessageDto.builder()
                .id(m.getId())
                .senderType(m.getSenderType() != null ? m.getSenderType().name() : "LEARNER")
                .senderId(m.getSenderId())
                .senderName(m.getSenderType() != null && m.getSenderType().name().contains("LEARNER") ? (c.getUser() != null ? c.getUser().getFullName() : "Learner") : "AI Tutor")
                .content(m.getContent())
                .isFallback(Boolean.TRUE.equals(m.getIsFallback()))
                .tokensUsed(m.getTokensUsed())
                .createdAt(m.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return AdminAiTutorSessionResponse.builder()
                .id(c.getId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .username(c.getUser() != null ? c.getUser().getUsername() : "Guest")
                .userFullName(c.getUser() != null ? c.getUser().getFullName() : c.getGuestName())
                .userEmail(c.getUser() != null ? c.getUser().getEmail() : c.getGuestEmail())
                .status(c.getStatus() != null ? c.getStatus().name() : "CLOSED")
                .isFallbackTriggered(Boolean.TRUE.equals(c.getIsFallbackTriggered()))
                .fallbackReason(c.getFallbackReason())
                .errorMessage(c.getErrorMessage())
                .messageCount(msgs.size())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .messages(msgDtos)
                .build();
    }
}
