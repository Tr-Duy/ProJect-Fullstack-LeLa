package com.lela.language.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class LanguageResponse {
    private Long id;
    private String languageCode;
    private String name;
    private String nativeName;
    private String flagUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
