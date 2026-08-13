package com.lela.refreshtokensession.domain;

import com.lela.domain.AuditableEntity;
import com.lela.users.domain.Users;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "refresh_token_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RefreshTokenSession extends AuditableEntity {
    // Thông tin người dùng sở hữu session refresh token này
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Users user;

    // Mã băm (hash) của Refresh Token nhằm bảo mật
    private String tokenHash;

    // Mã định danh nhóm token (dùng cho cơ chế xoay vòng token - token rotation)
    private String tokenFamilyId;

    // Phiên làm việc (token) thay thế cho token hiện tại
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_by_token_id")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private RefreshTokenSession replacedByToken;

    // Tên thiết bị đăng nhập của người dùng
    private String deviceName;

    // Địa chỉ IP thực hiện đăng nhập
    private String ipAddress;

    // Thông tin phần mềm Client truy cập (User Agent)
    private String userAgent;

    // Thời điểm hết hạn của Refresh Token
    private LocalDateTime expiresAt;

    // Thời điểm token được sử dụng gần đây nhất
    private LocalDateTime lastUsedAt;

    // Thời điểm thu hồi/hủy hiệu lực token (nếu có)
    private LocalDateTime revokedAt;

    // Lý do thu hồi/hủy hiệu lực token (ví dụ: đăng xuất, xoay vòng phát hiện bất
    // thường)
    private String revokeReason;
}
