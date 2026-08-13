package com.lela.QuizQuestionOption;

import com.lela.QuizQuestion.QuizQuestionRepository;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
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
public class QuizQuestionOptionServiceImplTest {

    @Mock
    private QuizQuestionOptionRepository repository;

    @Mock
    private QuizQuestionRepository questionRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizQuestionOptionServiceImpl service;

    private QuizQuestionOption entity;
    private QuizQuestionOptionResponse response;

    @BeforeEach
    void setUp() {
        entity = new QuizQuestionOption();
        entity.setId(1L);

        response = new QuizQuestionOptionResponse();
        response.setId(1L);
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizQuestionOption> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.map(entity, QuizQuestionOptionResponse.class)).thenReturn(response);

        Page<QuizQuestionOptionResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(mapper.map(entity, QuizQuestionOptionResponse.class)).thenReturn(response);

        QuizQuestionOptionResponse result = service.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void create_Success() {
        QuizQuestionOptionRequest request = new QuizQuestionOptionRequest();
        request.setQuestionId(2L);

        QuizQuestion question = new QuizQuestion();
        question.setId(2L);

        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));
        when(mapper.map(request, QuizQuestionOption.class)).thenReturn(entity);
        when(repository.save(any(QuizQuestionOption.class))).thenReturn(entity);
        when(mapper.map(entity, QuizQuestionOptionResponse.class)).thenReturn(response);

        QuizQuestionOptionResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void update_Success() {
        QuizQuestionOptionRequest request = new QuizQuestionOptionRequest();
        request.setQuestionId(2L);

        QuizQuestion question = new QuizQuestion();
        question.setId(2L);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));
        when(repository.save(entity)).thenReturn(entity);
        Mockito.lenient().when(mapper.map(entity, QuizQuestionOptionResponse.class)).thenReturn(response);

        QuizQuestionOptionResponse result = service.update(1L, request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void delete_Success() {
        when(repository.existsById(1L)).thenReturn(true);
        service.delete(1L);
        verify(repository).deleteById(1L);
    }
}
