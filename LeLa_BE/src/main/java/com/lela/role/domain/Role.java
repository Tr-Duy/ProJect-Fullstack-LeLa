package com.lela.role.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Role extends AuditableEntity {
    // Mã code của vai trò (ví dụ: ADMIN, USER, STAFF)
    private String roleCode;

    // Tên vai trò hiển thị (ví dụ: Quản trị viên, Người dùng)
    private String name;

    // Mô tả chi tiết vai trò
    private String description;

    // Trạng thái hoạt động của vai trò (true: đang hoạt động, false: đã khóa)
    private Boolean isActive;
}
