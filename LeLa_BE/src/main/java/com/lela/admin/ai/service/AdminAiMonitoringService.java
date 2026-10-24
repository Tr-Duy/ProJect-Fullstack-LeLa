package com.lela.admin.ai.service;

import com.lela.admin.ai.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AdminAiMonitoringService {
    AdminAiOverviewStats getOverviewStats();

    // Tab 1: Voice Sessions
    Page<AdminVoiceSessionResponse> getVoiceSessions(String status, Long userId, Long scenarioId, LocalDate startDate, LocalDate endDate, String search, Pageable pageable);
    AdminVoiceSessionDetailResponse getVoiceSessionDetail(Long id);

    // Tab 2: Quota Ledger
    Page<AdminQuotaLedgerResponse> getQuotaLedger(Long userId, String entryType, LocalDate startDate, LocalDate endDate, String search, Pageable pageable);
    AdminQuotaLedgerResponse adjustQuota(AdminAdjustQuotaRequest request, Long adminId);
    List<AdminUserQuotaSummaryResponse> getUserQuotaSummaries(String search);

    // Tab 3: AI Tutor & Fallback Logs
    Page<AdminAiTutorSessionResponse> getAiTutorLogs(Boolean isFallbackOnly, Long userId, LocalDate startDate, LocalDate endDate, String search, Pageable pageable);
    AdminAiTutorSessionResponse getAiTutorLogDetail(Long id);
}
