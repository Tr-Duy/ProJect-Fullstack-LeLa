package com.lela.refreshtokensession.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class RefreshTokenSessionPatchRequest {
    private Long userId;
    private String tokenHash;
    private String tokenFamilyId;
    private Long replacedByTokenId;
    private String deviceName;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime expiresAt;
    private LocalDateTime lastUsedAt;
    private LocalDateTime revokedAt;
    private String revokeReason;
}
