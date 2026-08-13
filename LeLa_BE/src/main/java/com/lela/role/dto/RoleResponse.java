package com.lela.role.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RoleResponse {
    private Long id;
    private String roleCode;
    private String name;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
