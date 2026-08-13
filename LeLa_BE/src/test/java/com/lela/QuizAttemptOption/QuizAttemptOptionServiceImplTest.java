package com.lela.QuizAttemptOption;

import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionRequest;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizQuestionOption.QuizQuestionOptionRepository;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
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
public class QuizAttemptOptionServiceImplTest {

    @Mock
    private QuizAttemptOptionRepository repository;

    @Mock
    private QuizAttemptQuestionRepository attemptQuestionRepository;

    @Mock
    private QuizQuestionOptionRepository questionOptionRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizAttemptOptionServiceImpl service;

    private QuizAttemptOption entity;
    private QuizAttemptOptionResponse response;

    @BeforeEach
    void setUp() {
        entity = new QuizAttemptOption();
        entity.setId(1L);

        response = new QuizAttemptOptionResponse();
        response.setId(1L);
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizAttemptOption> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.map(entity, QuizAttemptOptionResponse.class)).thenReturn(response);

        Page<QuizAttemptOptionResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void create_Success() {
        QuizAttemptOptionRequest request = new QuizAttemptOptionRequest();
        request.setAttemptQuestionId(2L);
        request.setSourceOptionId(3L);

        QuizAttemptQuestion attemptQuestion = new QuizAttemptQuestion();
        attemptQuestion.setId(2L);
        
        QuizQuestionOption sourceOption = new QuizQuestionOption();
        sourceOption.setId(3L);

        when(attemptQuestionRepository.findById(2L)).thenReturn(Optional.of(attemptQuestion));
        when(questionOptionRepository.findById(3L)).thenReturn(Optional.of(sourceOption));
        when(mapper.map(request, QuizAttemptOption.class)).thenReturn(entity);
        when(repository.save(any(QuizAttemptOption.class))).thenReturn(entity);
        when(mapper.map(entity, QuizAttemptOptionResponse.class)).thenReturn(response);

        QuizAttemptOptionResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void update_Success() {
        QuizAttemptOptionRequest request = new QuizAttemptOptionRequest();
        request.setAttemptQuestionId(2L);
        request.setSourceOptionId(3L);

        QuizAttemptQuestion attemptQuestion = new QuizAttemptQuestion();
        attemptQuestion.setId(2L);
        
        QuizQuestionOption sourceOption = new QuizQuestionOption();
        sourceOption.setId(3L);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(attemptQuestionRepository.findById(2L)).thenReturn(Optional.of(attemptQuestion));
        when(questionOptionRepository.findById(3L)).thenReturn(Optional.of(sourceOption));
        when(repository.save(entity)).thenReturn(entity);
        Mockito.lenient().when(mapper.map(entity, QuizAttemptOptionResponse.class)).thenReturn(response);

        QuizAttemptOptionResponse result = service.update(1L, request);

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
