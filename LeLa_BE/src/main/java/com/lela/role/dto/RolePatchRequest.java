package com.lela.role.dto;

import lombok.Data;

@Data
public class RolePatchRequest {
    private String roleCode;
    private String name;
    private String description;
    private Boolean isActive;
}
