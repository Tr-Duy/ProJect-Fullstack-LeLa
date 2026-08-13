package com.lela.tag.domain;

import com.lela.domain.BaseEnity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;


@Getter
@Setter
@Entity
@Table(name = "tags")
// Component: Content - normalized flashcard tag.
public class Tag extends BaseEnity {

    @Column(nullable = false, length = 100)
    private String name; // Tên tag hiển thị.

    @Column(nullable = false, unique = true, length = 120)
    private String slug; // Chuỗi định danh tag dùng trong URL hoặc lọc.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Thời điểm tạo tag.

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true; // Trạng thái hoạt động (xoá mềm).
}
