package com.lela.QuizAttemptQuestion;

import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizQuestion.QuizQuestionRepository;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionRequest;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse;
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
public class QuizAttemptQuestionServiceImplTest {

    @Mock
    private QuizAttemptQuestionRepository repository;

    @Mock
    private QuizAttemptRepository attemptRepository;

    @Mock
    private QuizQuestionRepository questionRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizAttemptQuestionServiceImpl service;

    private QuizAttemptQuestion entity;
    private QuizAttemptQuestionResponse response;

    @BeforeEach
    void setUp() {
        entity = new QuizAttemptQuestion();
        entity.setId(1L);

        response = new QuizAttemptQuestionResponse();
        response.setId(1L);
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizAttemptQuestion> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.map(entity, QuizAttemptQuestionResponse.class)).thenReturn(response);

        Page<QuizAttemptQuestionResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void create_Success() {
        QuizAttemptQuestionRequest request = new QuizAttemptQuestionRequest();
        request.setAttemptId(2L);
        request.setSourceQuestionId(3L);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(2L);
        
        QuizQuestion question = new QuizQuestion();
        question.setId(3L);

        when(attemptRepository.findById(2L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findById(3L)).thenReturn(Optional.of(question));
        when(mapper.map(request, QuizAttemptQuestion.class)).thenReturn(entity);
        when(repository.save(any(QuizAttemptQuestion.class))).thenReturn(entity);
        when(mapper.map(entity, QuizAttemptQuestionResponse.class)).thenReturn(response);

        QuizAttemptQuestionResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void update_Success() {
        QuizAttemptQuestionRequest request = new QuizAttemptQuestionRequest();
        request.setAttemptId(2L);
        request.setSourceQuestionId(3L);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(2L);
        
        QuizQuestion question = new QuizQuestion();
        question.setId(3L);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(attemptRepository.findById(2L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findById(3L)).thenReturn(Optional.of(question));
        when(repository.save(entity)).thenReturn(entity);
        Mockito.lenient().when(mapper.map(entity, QuizAttemptQuestionResponse.class)).thenReturn(response);

        QuizAttemptQuestionResponse result = service.update(1L, request);

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
