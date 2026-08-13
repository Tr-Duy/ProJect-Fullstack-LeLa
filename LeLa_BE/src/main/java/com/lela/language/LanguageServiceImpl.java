package com.lela.language;

import com.lela.common.exception.NotFoundExeception;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.lela.language.domain.Language;
import com.lela.language.dto.LanguageCreateRequest;
import com.lela.language.dto.LanguagePatchRequest;
import com.lela.language.dto.LanguageResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class LanguageServiceImpl implements LanguageService {
    private final LanguageRepository repository;
    private final ModelMapper modelMapper;

    @Override
    @Cacheable("languages")
    public List<LanguageResponse> findAll() {
        // Lấy toàn bộ danh sách ngôn ngữ và chuyển đổi sang DTO phản hồi
        return repository.findAll().stream()
                .map(e -> modelMapper.map(e, LanguageResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<LanguageResponse> findById(Long id) {
        // Tìm ngôn ngữ theo ID, nếu có thì ánh xạ sang DTO
        return repository.findById(id)
                .map(entity -> modelMapper.map(entity, LanguageResponse.class));
    }

    @Override
    @CacheEvict(value = "languages", allEntries = true)
    public LanguageResponse create(LanguageCreateRequest request) {
        // Ánh xạ dữ liệu từ request tạo mới sang thực thể Language
        Language entity = modelMapper.map(request, Language.class);
        entity = repository.save(entity);
        return modelMapper.map(entity, LanguageResponse.class);
    }

    @Override
    @CacheEvict(value = "languages", allEntries = true)
    public LanguageResponse patch(Long id, LanguagePatchRequest request) {
        // Tìm ngôn ngữ hiện tại theo ID, ném lỗi nếu không tồn tại
        Language entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Not found Language with id " + id));

        // Cập nhật từng trường thông tin nếu giá trị gửi lên khác null (Null-safe
        // partial update)
        if (request.getLanguageCode() != null)
            entity.setLanguageCode(request.getLanguageCode());
        if (request.getName() != null)
            entity.setName(request.getName());
        if (request.getNativeName() != null)
            entity.setNativeName(request.getNativeName());
        if (request.getFlagUrl() != null)
            entity.setFlagUrl(request.getFlagUrl());
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());

        entity = repository.save(entity);
        return modelMapper.map(entity, LanguageResponse.class);
    }

    @Override
    @CacheEvict(value = "languages", allEntries = true)
    public void deleteById(Long id) {
        // Xóa ngôn ngữ khỏi DB theo ID
        repository.deleteById(id);
    }
}
