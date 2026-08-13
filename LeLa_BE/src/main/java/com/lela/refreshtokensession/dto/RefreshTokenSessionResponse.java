package com.lela.refreshtokensession.dto;

import com.lela.users.dto.UsersResponse;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class RefreshTokenSessionResponse {
    private Long id;
    private UsersResponse user;
    private String tokenHash;
    private String tokenFamilyId;
    private RefreshTokenSessionResponse replacedByToken;
    private String deviceName;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime expiresAt;
    private LocalDateTime lastUsedAt;
    private LocalDateTime revokedAt;
    private String revokeReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
