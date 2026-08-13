package com.lela.language.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

@Data
public class LanguageCreateRequest {
    @NotBlank
    private String languageCode;
    @NotBlank
    private String name;
    @NotBlank
    private String nativeName;
    @NotBlank
    private String flagUrl;
    @NotNull
    private Boolean isActive;
}
