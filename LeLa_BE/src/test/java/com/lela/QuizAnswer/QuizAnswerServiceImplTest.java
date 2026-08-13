package com.lela.QuizAnswer;

import com.lela.QuizAnswer.domain.QuizAnswer;
import com.lela.QuizAnswer.dto.QuizAnswerRequest;
import com.lela.QuizAnswer.dto.QuizAnswerResponse;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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
public class QuizAnswerServiceImplTest {

    @Mock
    private QuizAnswerRepository repository;

    @Mock
    private QuizAttemptRepository attemptRepository;

    @Mock
    private QuizAttemptQuestionRepository attemptQuestionRepository;

    @Mock
    private QuizAttemptOptionRepository attemptOptionRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizAnswerServiceImpl service;

    private QuizAnswer entity;
    private QuizAnswerResponse response;

    @BeforeEach
    void setUp() {
        entity = new QuizAnswer();
        entity.setId(1L);

        response = new QuizAnswerResponse();
        response.setId(1L);
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizAnswer> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.map(entity, QuizAnswerResponse.class)).thenReturn(response);

        Page<QuizAnswerResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void create_Success() {
        QuizAnswerRequest request = new QuizAnswerRequest();
        request.setAttemptId(2L);
        request.setAttemptQuestionId(3L);
        request.setSelectedAttemptOptionId(4L);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(2L);

        QuizAttemptQuestion attemptQuestion = new QuizAttemptQuestion();
        attemptQuestion.setId(3L);

        QuizAttemptOption attemptOption = new QuizAttemptOption();
        attemptOption.setId(4L);

        when(attemptRepository.findById(2L)).thenReturn(Optional.of(attempt));
        when(attemptQuestionRepository.findById(3L)).thenReturn(Optional.of(attemptQuestion));
        when(attemptOptionRepository.findById(4L)).thenReturn(Optional.of(attemptOption));

        when(mapper.map(request, QuizAnswer.class)).thenReturn(entity);
        when(repository.save(any(QuizAnswer.class))).thenReturn(entity);
        when(mapper.map(entity, QuizAnswerResponse.class)).thenReturn(response);

        QuizAnswerResponse result = service.create(request);

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
