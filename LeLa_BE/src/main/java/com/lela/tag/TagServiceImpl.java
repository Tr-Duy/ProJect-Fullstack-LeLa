package com.lela.tag;

import com.lela.common.exception.ConflictException;
import com.lela.common.exception.NotFoundExeception;
import com.lela.tag.domain.Tag;
import com.lela.tag.dto.TagRequest;
import com.lela.tag.dto.TagResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Transactional
    @Override
    @CacheEvict(value = "tags", allEntries = true)
    public TagResponse createTag(TagRequest request) {
        String slug = generateSlug(request.getName());

        if (tagRepository.existsBySlug(slug)) {
            throw new ConflictException("Tag với tên này đã tồn tại");
        }

        Tag tag = new Tag();
        tag.setName(request.getName());
        tag.setSlug(slug);

        Tag savedTag = tagRepository.save(tag);
        return TagResponse.fromEntity(savedTag);
    }

    @Transactional
    @Override
    @CacheEvict(value = "tags", allEntries = true)
    public TagResponse updateTag(Long id, TagRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy Tag với id: " + id));

        String newSlug = generateSlug(request.getName());
        if (!tag.getSlug().equals(newSlug) && tagRepository.existsBySlug(newSlug)) {
            throw new ConflictException("Tag với tên này đã tồn tại");
        }

        tag.setName(request.getName());
        tag.setSlug(newSlug);

        Tag updatedTag = tagRepository.save(tag);
        return TagResponse.fromEntity(updatedTag);
    }

    @Transactional(readOnly = true)
    @Override
    public TagResponse getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy Tag với id: " + id));
        return TagResponse.fromEntity(tag);
    }

    @Transactional(readOnly = true)
    @Override
    @Cacheable("tags")
    public Page<TagResponse> getAllTags(Pageable pageable) {
        return tagRepository.findAll(pageable).map(TagResponse::fromEntity);
    }

    @Transactional
    @Override
    @CacheEvict(value = "tags", allEntries = true)
    public void deleteTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy Tag với id: " + id));
        // Xoá mềm (soft delete), tạm thời chưa check các ràng buộc với Flashcard/Quiz
        tag.setActive(false);
        tagRepository.save(tag);
    }

    private String generateSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }
}
