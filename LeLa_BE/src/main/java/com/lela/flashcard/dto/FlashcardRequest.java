package com.lela.flashcard.dto;

import lombok.Data;
import java.util.List;

@Data
public class FlashcardRequest {
    private Long deckId; // ID của Deck chứa flashcard
    private String frontText; // Nội dung mặt trước
    private String backText; // Nội dung mặt sau
    private String phonetic; // Phiên âm hoặc cách đọc
    private String exampleText; // Câu ví dụ minh họa
    private String hint; // Gợi ý khi học thẻ
    private String note; // Ghi chú bổ sung
    private String frontImageUrl; // Đường dẫn ảnh mặt trước
    private String backImageUrl; // Đường dẫn ảnh mặt sau
    private String frontAudioUrl; // Đường dẫn âm thanh mặt trước
    private String backAudioUrl; // Đường dẫn âm thanh mặt sau
    private Integer cardOrder; // Thứ tự thẻ trong deck
    private String cardColor; // Màu sắc thẻ
    private Boolean isActive; // Trạng thái hoạt động (xoá mềm)
    
    // Tạm thời nhận createdById từ request để test
    private Long createdById; 
    
    // Danh sách tag gán cho flashcard
    private List<Long> tagIds;
}
