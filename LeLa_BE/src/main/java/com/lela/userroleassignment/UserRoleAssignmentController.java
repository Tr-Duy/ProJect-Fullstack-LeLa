package com.lela.userroleassignment;

import com.lela.userroleassignment.dto.UserRoleAssignmentCreateRequest;
import com.lela.userroleassignment.dto.UserRoleAssignmentResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.lela.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/user-roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserRoleAssignmentController {
    private final UserRoleAssignmentService service;

    // API lấy danh sách vai trò được gán cho người dùng.
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserRoleAssignmentResponse>>> findByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(service.findByUserId(userId), "Lấy danh sách thành công"));
    }

    // API gán vai trò mới cho người dùng.
    @PostMapping
    public ResponseEntity<ApiResponse<UserRoleAssignmentResponse>> assignRole(@Valid @RequestBody UserRoleAssignmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.assignRole(request, null), "Gán vai trò thành công"));
    }

    // API hủy gán vai trò khỏi người dùng.
    @DeleteMapping("/user/{userId}/role/{roleId}")
    public ResponseEntity<ApiResponse<Void>> unassignRole(@PathVariable Long userId, @PathVariable Long roleId) {
        service.unassignRole(userId, roleId);
        return ResponseEntity.ok(ApiResponse.successMessage("Hủy gán vai trò thành công"));
    }
}
