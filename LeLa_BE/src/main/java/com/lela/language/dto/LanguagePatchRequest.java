package com.lela.language.dto;

import lombok.Data;

@Data
public class LanguagePatchRequest {
    private String languageCode;
    private String name;
    private String nativeName;
    private String flagUrl;
    private Boolean isActive;
}
