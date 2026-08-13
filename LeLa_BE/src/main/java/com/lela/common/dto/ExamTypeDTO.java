package com.lela.common.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ExamTypeDTO {
    private Long id;
    private String code;
    private String name;
    private BigDecimal maxScaleScore;
}
