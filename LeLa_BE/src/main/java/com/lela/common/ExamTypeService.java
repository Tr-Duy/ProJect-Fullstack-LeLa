package com.lela.common;

import com.lela.common.dto.ExamTypeDTO;
import com.lela.common.domain.ExamType;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamTypeService {
    private final ExamTypeRepository examTypeRepository;
    private final ModelMapper mapper;

    public List<ExamTypeDTO> findAll() {
        return examTypeRepository.findAll().stream()
                .map(e -> mapper.map(e, ExamTypeDTO.class))
                .collect(Collectors.toList());
    }
}
