package com.lela.flashcard.domain;

import com.lela.domain.AuditableEntity;
import com.lela.deck.domain.Deck;
import com.lela.users.domain.Users;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter
@Setter
@Entity
@Table(name = "flashcards")
// Component: Content - flashcard item inside a deck.
public class Flashcard extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck; // Deck chứa flashcard.

    @Column(name = "front_text", nullable = false, length = 1000)
    private String frontText; // Nội dung mặt trước của thẻ.

    @Column(name = "back_text", nullable = false, length = 1000)
    private String backText; // Nội dung mặt sau của thẻ.

    @Column(length = 255)
    private String phonetic; // Phiên âm hoặc cách đọc.

    @Column(name = "example_text", length = 1000)
    private String exampleText; // Câu ví dụ minh họa.

    @Column(length = 500)
    private String hint; // Gợi ý khi học thẻ.

    @Column(columnDefinition = "text")
    private String note; // Ghi chú bổ sung cho thẻ.

    @Column(name = "front_image_url", length = 500)
    private String frontImageUrl; // Đường dẫn ảnh mặt trước.

    @Column(name = "back_image_url", length = 500)
    private String backImageUrl; // Đường dẫn ảnh mặt sau.

    @Column(name = "front_audio_url", length = 500)
    private String frontAudioUrl; // Đường dẫn âm thanh mặt trước.

    @Column(name = "back_audio_url", length = 500)
    private String backAudioUrl; // Đường dẫn âm thanh mặt sau.

    @Column(name = "card_order", nullable = false)
    private Integer cardOrder = 0; // Thứ tự thẻ trong deck.

    @Column(name = "card_color", length = 50)
    private String cardColor; // Màu sắc của thẻ (hex code hoặc tailwind class).

    @Column(name = "is_active", nullable = false)
    public boolean isActive = true; // Thẻ còn được sử dụng hay không.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Users createdBy; // Người tạo thẻ.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Users updatedBy; // Người cập nhật thẻ gần nhất.

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // Thời điểm xóa mềm thẻ.

    @Version
    @Column(nullable = false)
    private Long version = 0L; // Phiên bản dùng cho optimistic locking.
}
