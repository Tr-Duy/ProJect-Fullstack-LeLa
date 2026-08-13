package com.lela.deck.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TopicDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
