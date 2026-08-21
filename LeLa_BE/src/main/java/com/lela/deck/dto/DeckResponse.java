package com.lela.deck.dto;

import com.lela.deck.domain.Deck;
import com.lela.deck.domain.DeckDifficulty;
import com.lela.deck.domain.DeckDisplayMode;
import com.lela.deck.domain.DeckStatus;
import com.lela.deck.domain.DeckVisibility;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeckResponse {
    private Long id; // Khóa chính của bảng decks.
    private String deckCode; // Mã định danh deck.
    private String slug; // Chuỗi URL thân thiện của deck.
    private String title; // Tiêu đề deck.
    private String description; // Mô tả nội dung deck.
    private String coverImageUrl; // Đường dẫn ảnh bìa deck.
    private Long ownerId; // ID Người sở hữu hoặc tạo deck.
    private Long languageId; // ID Ngôn ngữ chính của deck.
    private TopicDTO topic; // Nhóm chủ đề của deck.
    private Long examTypeId; // ID Hệ thi.
    private Long levelId; // ID Cấp độ.
    private String levelName; // Tên cấp độ.
    private String levelCode; // Mã cấp độ.
    private java.util.List<com.lela.tag.dto.TagResponse> tags; // Danh sách thẻ.
    private DeckDifficulty difficulty; // Độ khó của deck.
    private DeckVisibility visibility; // Phạm vi hiển thị deck.
    private DeckStatus status; // Trạng thái kiểm duyệt deck.
    private Boolean isActive; // Trạng thái hoạt động (xoá mềm).
    private Boolean isFeatured; // Deck có được gắn nổi bật hay không.
    private DeckDisplayMode displayMode; // Lựa chọn hiển thị (FRONT, BACK, RANDOM)
    private Integer totalCards; // Tổng số flashcard trong deck.
    private Long viewCount; // Tổng số lượt xem deck.
    private Long enrollmentCount; // Tổng số lượt đăng ký học deck.
    private LocalDateTime submittedAt; // Thời điểm gửi kiểm duyệt.
    private Long reviewedById; // ID Người kiểm duyệt deck.
    private LocalDateTime reviewedAt; // Thời điểm kiểm duyệt.
    private String rejectionReason; // Lý do từ chối deck.
    private LocalDateTime publishedAt; // Thời điểm xuất bản deck.
    private LocalDateTime deletedAt; // Thời điểm xóa mềm deck.
    private Long version; // Phiên bản dùng cho optimistic locking.

    // Hàm tiện ích để map từ Entity sang DTO
    public static DeckResponse fromEntity(Deck deck) {
        if (deck == null) return null;
        
        DeckResponse response = new DeckResponse();
        response.setId(deck.getId());
        response.setDeckCode(deck.getDeckCode());
        response.setSlug(deck.getSlug());
        response.setTitle(deck.getTitle());
        response.setDescription(deck.getDescription());
        response.setCoverImageUrl(deck.getCoverImageUrl());
        
        if (deck.getOwner() != null) {
            response.setOwnerId(deck.getOwner().getId());
        }
        if (deck.getLanguage() != null) {
            response.setLanguageId(deck.getLanguage().getId());
        }
        
        if (deck.getTopic() != null) {
            TopicDTO topicDTO = new TopicDTO();
            topicDTO.setId(deck.getTopic().getId());
            topicDTO.setName(deck.getTopic().getName());
            topicDTO.setSlug(deck.getTopic().getSlug());
            topicDTO.setIconUrl(deck.getTopic().getIconUrl());
            response.setTopic(topicDTO);
        }
        if (deck.getExamType() != null) {
            response.setExamTypeId(deck.getExamType().getId());
        }
        if (deck.getLevel() != null) {
            response.setLevelId(deck.getLevel().getId());
            response.setLevelName(deck.getLevel().getName());
            response.setLevelCode(deck.getLevel().getCode());
        }
        if (deck.getTags() != null && !deck.getTags().isEmpty()) {
            response.setTags(deck.getTags().stream().map(com.lela.tag.dto.TagResponse::fromEntity).collect(java.util.stream.Collectors.toList()));
        }
        response.setDifficulty(deck.getDifficulty());
        response.setVisibility(deck.getVisibility());
        response.setStatus(deck.getStatus());
        response.setIsActive(deck.isActive);
        response.setIsFeatured(deck.getIsFeatured());
        response.setDisplayMode(deck.getDisplayMode());
        response.setTotalCards(deck.getTotalCards());
        response.setViewCount(deck.getViewCount());
        response.setEnrollmentCount(deck.getEnrollmentCount());
        response.setSubmittedAt(deck.getSubmittedAt());
        
        if (deck.getReviewedBy() != null) {
            response.setReviewedById(deck.getReviewedBy().getId());
        }
        
        response.setReviewedAt(deck.getReviewedAt());
        response.setRejectionReason(deck.getRejectionReason());
        response.setPublishedAt(deck.getPublishedAt());
        response.setDeletedAt(deck.getDeletedAt());
        response.setVersion(deck.getVersion());
        
        return response;
    }
}
