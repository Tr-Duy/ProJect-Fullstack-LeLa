package com.lela.role.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
public class RoleCreateRequest {
    @NotBlank
    private String roleCode;
    @NotBlank
    private String name;
    @NotBlank
    private String description;
    @NotNull
    private Boolean isActive;
}
