package com.lela.admin.ai.controller;

import com.lela.admin.ai.dto.AdminScenarioRequest;
import com.lela.admin.ai.dto.AdminScenarioResponse;
import com.lela.admin.ai.service.AdminAiScenarioService;
import com.lela.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/ai/scenarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiScenarioController {

    private final AdminAiScenarioService scenarioService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminScenarioResponse>>> getScenarios(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AdminScenarioResponse> page = scenarioService.getScenarios(topicId, isActive, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Lấy danh sách kịch bản AI thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminScenarioResponse>> getScenarioById(@PathVariable Long id) {
        AdminScenarioResponse scenario = scenarioService.getScenarioById(id);
        return ResponseEntity.ok(ApiResponse.success(scenario, "Lấy chi tiết kịch bản AI thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminScenarioResponse>> createScenario(@Valid @RequestBody AdminScenarioRequest request) {
        AdminScenarioResponse created = scenarioService.createScenario(request);
        return new ResponseEntity<>(ApiResponse.success(created, "Tạo mới kịch bản AI thành công"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminScenarioResponse>> updateScenario(
            @PathVariable Long id,
            @Valid @RequestBody AdminScenarioRequest request
    ) {
        AdminScenarioResponse updated = scenarioService.updateScenario(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật kịch bản AI thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteScenario(@PathVariable Long id) {
        scenarioService.deleteScenario(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa hoặc chuyển trạng thái kịch bản AI thành công"));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<ApiResponse<AdminScenarioResponse>> cloneScenario(@PathVariable Long id) {
        AdminScenarioResponse cloned = scenarioService.cloneScenario(id);
        return new ResponseEntity<>(ApiResponse.success(cloned, "Nhân bản kịch bản AI thành công"), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<AdminScenarioResponse>> toggleStatus(@PathVariable Long id) {
        AdminScenarioResponse toggled = scenarioService.toggleStatus(id);
        return ResponseEntity.ok(ApiResponse.success(toggled, "Chuyển trạng thái xuất bản thành công"));
    }
}
