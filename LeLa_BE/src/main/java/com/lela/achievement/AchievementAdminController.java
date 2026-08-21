package com.lela.achievement;

import com.lela.achievement.dto.AchievementAdminRequest;
import com.lela.achievement.dto.AchievementResponse;
import com.lela.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/achievements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AchievementAdminController {

    private final AchievementService achievementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(achievementService.getAllAchievementsForAdmin(), "Tải danh sách thành tựu thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AchievementResponse>> create(@Valid @RequestBody AchievementAdminRequest req) {
        return ResponseEntity.ok(ApiResponse.success(achievementService.createAchievement(req), "Tạo thành tựu thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AchievementResponse>> update(@PathVariable Long id, @Valid @RequestBody AchievementAdminRequest req) {
        return ResponseEntity.ok(ApiResponse.success(achievementService.updateAchievement(id, req), "Cập nhật thành tựu thành công"));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<AchievementResponse>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(achievementService.toggleActive(id), "Thay đổi trạng thái thành tựu thành công"));
    }
}
