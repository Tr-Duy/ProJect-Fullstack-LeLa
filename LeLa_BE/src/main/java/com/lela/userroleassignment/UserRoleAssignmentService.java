package com.lela.userroleassignment;

import com.lela.userroleassignment.dto.UserRoleAssignmentCreateRequest;
import com.lela.userroleassignment.dto.UserRoleAssignmentResponse;

import java.util.List;

public interface UserRoleAssignmentService {
    // Lấy danh sách vai trò được gán cho người dùng.
    List<UserRoleAssignmentResponse> findByUserId(Long userId);

    // Gán vai trò cho người dùng.
    UserRoleAssignmentResponse assignRole(UserRoleAssignmentCreateRequest request, Long assignedByUserId);

    // Hủy gán vai trò của người dùng.
    void unassignRole(Long userId, Long roleId);
}
