package com.lela.deck.dto;

import com.lela.deck.domain.DeckDifficulty;
import com.lela.deck.domain.DeckDisplayMode;
import com.lela.deck.domain.DeckVisibility;
import lombok.Data;

@Data
public class DeckRequest {
    private String title; // Tiêu đề deck.
    private String description; // Mô tả nội dung deck.
    private String coverImageUrl; // Đường dẫn ảnh bìa deck.
    private Long languageId; // ID Ngôn ngữ chính của deck.
    private Long topicId; // ID Nhóm chủ đề của deck.
    private Long examTypeId; // ID Hệ thi.
    private Long levelId; // ID Cấp độ.
    private DeckDifficulty difficulty = DeckDifficulty.BEGINNER; // Độ khó của deck.
    private DeckVisibility visibility = DeckVisibility.PUBLIC; // Phạm vi hiển thị deck.
    private DeckDisplayMode displayMode; // Lựa chọn chế độ hiển thị (FRONT, BACK, RANDOM)
    
    // Các trường Admin có thể thao tác
    private Boolean isFeatured; // Bộ thẻ nổi bật
    private com.lela.deck.domain.DeckStatus status; // Trạng thái kiểm duyệt
    private String rejectionReason; // Lý do từ chối
    private Boolean isActive; // Trạng thái hoạt động (xoá mềm)
    
    // Tạm thời nhận ownerId từ request để test vì chưa có logic đăng nhập
    private Long ownerId; 
}
