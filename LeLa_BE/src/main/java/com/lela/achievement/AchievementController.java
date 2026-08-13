package com.lela.achievement;

import com.lela.achievement.domain.UserAchievement;
import com.lela.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final UserAchievementRepository userAchievementRepository;
    private final com.lela.users.UsersRepository usersRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<UserAchievement>>> getMyAchievements() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId = usersRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();

        List<UserAchievement> achievements = userAchievementRepository.findAllByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(achievements, "Tải danh hiệu thành công"));
    }
}
