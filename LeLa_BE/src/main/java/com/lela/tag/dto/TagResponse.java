package com.lela.tag.dto;

import com.lela.tag.domain.Tag;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class TagResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Boolean isActive;
    private Long deckCount;
    private Long cardCount;
    private Long usageCount;
    private LocalDateTime createdAt;

    public static TagResponse fromEntity(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .description(tag.getDescription())
                .isActive(tag.isActive())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
