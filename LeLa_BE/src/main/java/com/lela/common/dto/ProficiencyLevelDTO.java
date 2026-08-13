package com.lela.common.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProficiencyLevelDTO {
    private Long id;
    private Long examTypeId;
    private String code;
    private String name;
    private BigDecimal minScore;
    private BigDecimal maxScore;
    private Integer displayOrder;
}
