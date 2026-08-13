package com.lela.achievement;

import com.lela.achievement.domain.Achievement;
import com.lela.common.ApiResponse;
import com.lela.common.exception.NotFoundExeception;
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

    private final AchievementRepository achievementRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Achievement>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(achievementRepository.findAll(), "Thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Achievement>> create(@RequestBody Achievement achievement) {
        return ResponseEntity.ok(ApiResponse.success(achievementRepository.save(achievement), "Tạo thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Achievement>> update(@PathVariable Long id, @RequestBody Achievement achievementDetails) {
        Achievement achievement = achievementRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy danh hiệu"));

        achievement.setCode(achievementDetails.getCode());
        achievement.setTitle(achievementDetails.getTitle());
        achievement.setDescription(achievementDetails.getDescription());
        achievement.setIconUrl(achievementDetails.getIconUrl());
        achievement.setXpReward(achievementDetails.getXpReward());
        achievement.setConditionType(achievementDetails.getConditionType());
        achievement.setConditionValue(achievementDetails.getConditionValue());

        return ResponseEntity.ok(ApiResponse.success(achievementRepository.save(achievement), "Cập nhật thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        achievementRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Xóa thành công"));
    }
}
