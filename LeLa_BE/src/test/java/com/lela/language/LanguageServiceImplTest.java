package com.lela.language;

import com.lela.common.exception.NotFoundExeception;
import com.lela.language.domain.Language;
import com.lela.language.dto.LanguageCreateRequest;
import com.lela.language.dto.LanguagePatchRequest;
import com.lela.language.dto.LanguageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class LanguageServiceImplTest {

    @Mock
    private LanguageRepository repository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private LanguageServiceImpl languageService;

    private Language languageEntity;
    private LanguageResponse languageResponse;

    @BeforeEach
    void setUp() {
        languageEntity = new Language();
        languageEntity.setId(1L);
        languageEntity.setLanguageCode("vi");
        languageEntity.setName("Vietnamese");

        languageResponse = new LanguageResponse();
        languageResponse.setId(1L);
        languageResponse.setLanguageCode("vi");
        languageResponse.setName("Vietnamese");
    }

    @Test
    void findAll_Success() {
        when(repository.findAll()).thenReturn(Arrays.asList(languageEntity));
        when(modelMapper.map(languageEntity, LanguageResponse.class)).thenReturn(languageResponse);

        List<LanguageResponse> result = languageService.findAll();

        assertEquals(1, result.size());
        assertEquals("vi", result.get(0).getLanguageCode());
        verify(repository).findAll();
    }

    @Test
    void findById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(languageEntity));
        when(modelMapper.map(languageEntity, LanguageResponse.class)).thenReturn(languageResponse);

        Optional<LanguageResponse> result = languageService.findById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        verify(repository).findById(1L);
    }

    @Test
    void findById_NotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        Optional<LanguageResponse> result = languageService.findById(99L);

        assertFalse(result.isPresent());
        verify(repository).findById(99L);
    }

    @Test
    void create_Success() {
        LanguageCreateRequest request = new LanguageCreateRequest();
        request.setLanguageCode("en");
        request.setName("English");

        Language newEntity = new Language();
        newEntity.setId(2L);
        newEntity.setLanguageCode("en");

        LanguageResponse newResponse = new LanguageResponse();
        newResponse.setId(2L);
        newResponse.setLanguageCode("en");

        when(modelMapper.map(request, Language.class)).thenReturn(newEntity);
        when(repository.save(any(Language.class))).thenReturn(newEntity);
        when(modelMapper.map(newEntity, LanguageResponse.class)).thenReturn(newResponse);

        LanguageResponse result = languageService.create(request);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("en", result.getLanguageCode());
        verify(repository).save(newEntity);
    }

    @Test
    void patch_Success() {
        LanguagePatchRequest request = new LanguagePatchRequest();
        request.setName("Vietnamese Updated");

        when(repository.findById(1L)).thenReturn(Optional.of(languageEntity));
        when(repository.save(languageEntity)).thenReturn(languageEntity);
        
        LanguageResponse updatedResponse = new LanguageResponse();
        updatedResponse.setId(1L);
        updatedResponse.setName("Vietnamese Updated");
        when(modelMapper.map(languageEntity, LanguageResponse.class)).thenReturn(updatedResponse);

        LanguageResponse result = languageService.patch(1L, request);

        assertNotNull(result);
        assertEquals("Vietnamese Updated", result.getName());
        verify(repository).save(languageEntity);
    }

    @Test
    void patch_LanguageNotFound_ThrowsException() {
        LanguagePatchRequest request = new LanguagePatchRequest();
        when(repository.findById(99L)).thenReturn(Optional.empty());

        NotFoundExeception exception = assertThrows(NotFoundExeception.class, () -> {
            languageService.patch(99L, request);
        });

        assertTrue(exception.getMessage().contains("Not found Language with id 99"));
        verify(repository, Mockito.never()).save(any());
    }

    @Test
    void deleteById_Success() {
        languageService.deleteById(1L);

        verify(repository).deleteById(1L);
    }
}
