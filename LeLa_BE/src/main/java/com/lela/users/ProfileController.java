package com.lela.users;

import com.lela.common.ApiResponse;
import com.lela.users.dto.ProfileUpdateRequest;
import com.lela.users.dto.UsersPatchRequest;
import com.lela.users.dto.UsersResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final UsersService usersService;
    private final UsersRepository usersRepository;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UsersResponse>> getMyProfile() {
        return usersService.findById(getCurrentUserId())
                .map(response -> ResponseEntity.ok(ApiResponse.success(response, "Profile found")))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UsersResponse>> updateMyProfile(@RequestBody ProfileUpdateRequest request) {
        UsersPatchRequest patchRequest = new UsersPatchRequest();
        patchRequest.setFullName(request.getFullName());
        patchRequest.setAvatarUrl(request.getAvatarUrl());
        patchRequest.setTimezone(request.getTimezone());
        patchRequest.setDailyGoalCards(request.getDailyGoalCards());
        patchRequest.setNativeLanguageId(request.getNativeLanguageId());
        patchRequest.setTargetLanguageId(request.getTargetLanguageId());
        
        return ResponseEntity.ok(ApiResponse.success(
                usersService.patch(getCurrentUserId(), patchRequest), 
                "Profile updated successfully"
        ));
    }
}
