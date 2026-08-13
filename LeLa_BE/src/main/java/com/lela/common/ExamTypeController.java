package com.lela.common;

import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.dto.ProficiencyLevelDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/exam-types")
@RequiredArgsConstructor
public class ExamTypeController {
    private final ExamTypeService examTypeService;
    private final ProficiencyLevelService proficiencyLevelService;

    @GetMapping
    public ResponseEntity<List<ExamTypeDTO>> getAllExamTypes() {
        return ResponseEntity.ok(examTypeService.findAll());
    }

    @GetMapping("/{id}/levels")
    public ResponseEntity<List<ProficiencyLevelDTO>> getLevelsByExamType(@PathVariable Long id) {
        return ResponseEntity.ok(proficiencyLevelService.findByExamType(id));
    }
}
