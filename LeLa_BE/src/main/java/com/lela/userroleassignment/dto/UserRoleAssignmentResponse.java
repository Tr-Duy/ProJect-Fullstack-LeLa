package com.lela.userroleassignment.dto;

import com.lela.role.dto.RoleResponse;
import com.lela.users.dto.UsersResponse;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserRoleAssignmentResponse {
    private UsersResponse user;
    private RoleResponse role;
    private UsersResponse assignedBy;
    private LocalDateTime createdAt;
}
