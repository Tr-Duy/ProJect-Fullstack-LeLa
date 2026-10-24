package com.lela.admin.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTargetWordDto {
    private Long id;
    private Long flashcardId;
    private String wordText;
    private Integer usedCount;
    private Boolean usedCorrectly;
    private String status;
}
