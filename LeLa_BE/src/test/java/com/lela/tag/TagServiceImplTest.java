package com.lela.tag;

import com.lela.common.exception.ConflictException;
import com.lela.tag.domain.Tag;
import com.lela.tag.dto.TagRequest;
import com.lela.tag.dto.TagResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TagServiceImplTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagServiceImpl service;

    private Tag entity;

    @BeforeEach
    void setUp() {
        entity = new Tag();
        entity.setId(1L);
        entity.setName("Test Tag");
        entity.setSlug("test-tag");
        entity.setActive(true);
    }

    @Test
    void createTag_Success() {
        TagRequest request = new TagRequest();
        request.setName("New Tag");

        when(tagRepository.existsBySlug("new-tag")).thenReturn(false);
        when(tagRepository.save(any(Tag.class))).thenAnswer(invocation -> {
            Tag saved = invocation.getArgument(0);
            saved.setId(2L);
            return saved;
        });

        TagResponse result = service.createTag(request);

        assertNotNull(result);
        assertEquals("New Tag", result.getName());
        assertEquals("new-tag", result.getSlug());
    }

    @Test
    void createTag_Conflict() {
        TagRequest request = new TagRequest();
        request.setName("Test Tag");

        when(tagRepository.existsBySlug("test-tag")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.createTag(request));
    }

    @Test
    void updateTag_Success() {
        TagRequest request = new TagRequest();
        request.setName("Updated Tag");

        when(tagRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(tagRepository.existsBySlug("updated-tag")).thenReturn(false);
        when(tagRepository.save(any(Tag.class))).thenReturn(entity);

        TagResponse result = service.updateTag(1L, request);

        assertNotNull(result);
        assertEquals("Updated Tag", result.getName());
        assertEquals("updated-tag", result.getSlug());
    }

    @Test
    void getTagById_Success() {
        when(tagRepository.findById(1L)).thenReturn(Optional.of(entity));

        TagResponse result = service.getTagById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getAllTags_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Tag> page = new PageImpl<>(Arrays.asList(entity));

        when(tagRepository.findAll(pageable)).thenReturn(page);

        Page<TagResponse> result = service.getAllTags(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void deleteTag_Success() {
        when(tagRepository.findById(1L)).thenReturn(Optional.of(entity));

        service.deleteTag(1L);

        assertFalse(entity.isActive());
        verify(tagRepository).save(entity);
    }
}
