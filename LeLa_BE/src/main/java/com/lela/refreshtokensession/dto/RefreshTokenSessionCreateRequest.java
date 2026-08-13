package com.lela.refreshtokensession.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class RefreshTokenSessionCreateRequest {
    @NotNull
    private Long userId;

    @NotBlank
    private String tokenHash;

    @NotBlank
    private String tokenFamilyId;

    private Long replacedByTokenId;

    @NotBlank
    private String deviceName;

    @NotBlank
    private String ipAddress;

    @NotBlank
    private String userAgent;

    @NotNull
    private LocalDateTime expiresAt;

    @NotNull
    private LocalDateTime lastUsedAt;

    private LocalDateTime revokedAt;

    private String revokeReason;
}
