package com.lela.language.domain;

import com.lela.domain.AuditableEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "languages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Language extends AuditableEntity {
    // Mã ngôn ngữ (ví dụ: en, vi, ja)
    private String languageCode;

    // Tên tiếng Anh của ngôn ngữ (ví dụ: Vietnamese, English)
    private String name;

    // Tên ngôn ngữ theo tiếng bản địa (ví dụ: Tiếng Việt, English, 日本語)
    private String nativeName;

    // Đường dẫn ảnh lá cờ quốc gia đại diện
    private String flagUrl;

    // Trạng thái hoạt động của ngôn ngữ (true: khả dụng, false: tạm khóa)
    private Boolean isActive;
}
