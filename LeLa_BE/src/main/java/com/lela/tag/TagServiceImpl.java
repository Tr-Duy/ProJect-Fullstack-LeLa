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
        String slug = (request.getSlug() != null && !request.getSlug().isBlank()) 
                ? request.getSlug() : generateSlug(request.getName());

        if (tagRepository.existsBySlug(slug)) {
            throw new ConflictException("Tag với slug này đã tồn tại: " + slug);
        }

        Tag tag = new Tag();
        tag.setName(request.getName());
        tag.setSlug(slug);
        tag.setDescription(request.getDescription());
        tag.setActive(request.getIsActive() != null ? request.getIsActive() : true);

        Tag savedTag = tagRepository.save(tag);
        return mapToResponse(savedTag);
    }

    @Transactional
    @Override
    @CacheEvict(value = "tags", allEntries = true)
    public TagResponse updateTag(Long id, TagRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy Tag với id: " + id));

        String newSlug = (request.getSlug() != null && !request.getSlug().isBlank()) 
                ? request.getSlug() : generateSlug(request.getName());
        if (!tag.getSlug().equals(newSlug) && tagRepository.existsBySlug(newSlug)) {
            throw new ConflictException("Tag với slug này đã tồn tại: " + newSlug);
        }

        tag.setName(request.getName());
        tag.setSlug(newSlug);
        if (request.getDescription() != null) {
            tag.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            tag.setActive(request.getIsActive());
        }

        Tag updatedTag = tagRepository.save(tag);
        return mapToResponse(updatedTag);
    }

    @Transactional(readOnly = true)
    @Override
    public TagResponse getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy Tag với id: " + id));
        return mapToResponse(tag);
    }

    @Transactional(readOnly = true)
    @Override
    @Cacheable("tags")
    public Page<TagResponse> getAllTags(Pageable pageable) {
        return tagRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional
    @Override
    @CacheEvict(value = "tags", allEntries = true)
    public void deleteTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy Tag với id: " + id));
        tag.setActive(false);
        tagRepository.save(tag);
    }

    private TagResponse mapToResponse(Tag tag) {
        TagResponse res = TagResponse.fromEntity(tag);
        long deckCount = tagRepository.countDecksByTagId(tag.getId());
        long cardCount = tagRepository.countCardsByTagId(tag.getId());
        res.setDeckCount(deckCount);
        res.setCardCount(cardCount);
        res.setUsageCount(deckCount + cardCount);
        return res;
    }

    private String generateSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }
}
