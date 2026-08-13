package com.lela.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExchangeRequest {
    @NotBlank(message = "Code không được để trống")
    private String code;
}
