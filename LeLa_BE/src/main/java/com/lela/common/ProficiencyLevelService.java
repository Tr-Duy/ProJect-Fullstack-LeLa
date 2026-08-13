package com.lela.common;

import com.lela.common.dto.ProficiencyLevelDTO;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProficiencyLevelService {
    private final ProficiencyLevelRepository levelRepository;
    private final ModelMapper mapper;

    public List<ProficiencyLevelDTO> findByExamType(Long examTypeId) {
        return levelRepository.findByExamTypeIdOrderByDisplayOrderAsc(examTypeId).stream()
                .map(l -> mapper.map(l, ProficiencyLevelDTO.class))
                .collect(Collectors.toList());
    }
}
