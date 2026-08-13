package com.lela.tag;

import com.lela.tag.dto.TagRequest;
import com.lela.tag.dto.TagResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TagService {
    TagResponse createTag(TagRequest request);
    TagResponse updateTag(Long id, TagRequest request);
    TagResponse getTagById(Long id);
    Page<TagResponse> getAllTags(Pageable pageable);
    void deleteTag(Long id);
}
