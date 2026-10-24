package com.lela.admin.ai.controller;

import com.lela.admin.ai.dto.*;
import com.lela.admin.ai.service.AdminAiMonitoringService;
import com.lela.common.ApiResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/ai/monitoring")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiMonitoringController {

    private final AdminAiMonitoringService monitoringService;
    private final UsersRepository usersRepository;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminAiOverviewStats>> getOverviewStats() {
        AdminAiOverviewStats stats = monitoringService.getOverviewStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Lấy thống kê tổng quan AI thành công"));
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 1: NHẬT KÝ PHIÊN HỘI THOẠI GIỌNG NÓI (VOICE SESSIONS)
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<Page<AdminVoiceSessionResponse>>> getVoiceSessions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long scenarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminVoiceSessionResponse> sessions = monitoringService.getVoiceSessions(
                status, userId, scenarioId, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(sessions, "Lấy danh sách phiên hội thoại AI thành công"));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<AdminVoiceSessionDetailResponse>> getVoiceSessionDetail(@PathVariable Long id) {
        AdminVoiceSessionDetailResponse detail = monitoringService.getVoiceSessionDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail, "Lấy chi tiết phiên hội thoại AI thành công"));
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 2: SỔ CÁI & ĐIỀU CHỈNH HẠN MỨC (QUOTA LEDGER)
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/quota-ledger")
    public ResponseEntity<ApiResponse<Page<AdminQuotaLedgerResponse>>> getQuotaLedger(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String entryType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminQuotaLedgerResponse> ledger = monitoringService.getQuotaLedger(
                userId, entryType, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(ledger, "Lấy dữ liệu sổ ghi hạn mức AI thành công"));
    }

    @PostMapping("/quota-ledger/adjust")
    public ResponseEntity<ApiResponse<AdminQuotaLedgerResponse>> adjustQuota(
            @Valid @RequestBody AdminAdjustQuotaRequest request
    ) {
        String authName = SecurityContextHolder.getContext().getAuthentication().getName();
        Long adminId = usersRepository.findByUsername(authName)
                .or(() -> usersRepository.findByEmail(authName))
                .map(Users::getId)
                .orElse(null);

        AdminQuotaLedgerResponse adjusted = monitoringService.adjustQuota(request, adminId);
        return new ResponseEntity<>(ApiResponse.success(adjusted, "Điều chỉnh hạn mức người dùng thành công"), HttpStatus.CREATED);
    }

    @GetMapping("/quota-ledger/users")
    public ResponseEntity<ApiResponse<List<AdminUserQuotaSummaryResponse>>> getUserQuotaSummaries(
            @RequestParam(required = false) String search
    ) {
        List<AdminUserQuotaSummaryResponse> users = monitoringService.getUserQuotaSummaries(search);
        return ResponseEntity.ok(ApiResponse.success(users, "Lấy danh sách hạn mức học viên thành công"));
    }

    // ─────────────────────────────────────────────────────────────
    // TAB 3: GIÁM SÁT TRỢ LÝ AI TUTOR & FALLBACK LOGS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/ai-tutor-logs")
    public ResponseEntity<ApiResponse<Page<AdminAiTutorSessionResponse>>> getAiTutorLogs(
            @RequestParam(required = false) Boolean isFallbackOnly,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminAiTutorSessionResponse> logs = monitoringService.getAiTutorLogs(
                isFallbackOnly, userId, startDate, endDate, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(logs, "Lấy danh sách nhật ký AI Tutor thành công"));
    }

    @GetMapping("/ai-tutor-logs/{id}")
    public ResponseEntity<ApiResponse<AdminAiTutorSessionResponse>> getAiTutorLogDetail(@PathVariable Long id) {
        AdminAiTutorSessionResponse detail = monitoringService.getAiTutorLogDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail, "Lấy chi tiết phiên AI Tutor thành công"));
    }
}
