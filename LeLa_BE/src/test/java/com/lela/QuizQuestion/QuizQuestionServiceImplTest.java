package com.lela.QuizQuestion;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestion.dto.QuizQuestionResponse;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
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
public class QuizQuestionServiceImplTest {

    @Mock
    private QuizQuestionRepository repository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private FlashcardRepository flashcardRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizQuestionServiceImpl service;

    private QuizQuestion entity;
    private QuizQuestionResponse response;

    @BeforeEach
    void setUp() {
        entity = new QuizQuestion();
        entity.setId(1L);

        response = new QuizQuestionResponse();
        response.setId(1L);
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizQuestion> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.map(entity, QuizQuestionResponse.class)).thenReturn(response);

        Page<QuizQuestionResponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repository).findAll(pageable);
    }

    @Test
    void findById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(mapper.map(entity, QuizQuestionResponse.class)).thenReturn(response);

        QuizQuestionResponse result = service.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void create_Success() {
        QuizQuestionRequest request = new QuizQuestionRequest();
        request.setQuizId(2L);
        request.setSourceCardId(3L);

        Quiz quiz = new Quiz();
        quiz.setId(2L);
        
        Flashcard card = new Flashcard();
        card.setId(3L);

        when(quizRepository.findById(2L)).thenReturn(Optional.of(quiz));
        when(mapper.map(request, QuizQuestion.class)).thenReturn(entity);
        when(flashcardRepository.findById(3L)).thenReturn(Optional.of(card));
        when(repository.save(any(QuizQuestion.class))).thenReturn(entity);
        when(mapper.map(entity, QuizQuestionResponse.class)).thenReturn(response);

        QuizQuestionResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void update_Success() {
        QuizQuestionRequest request = new QuizQuestionRequest();
        request.setQuizId(2L);

        Quiz quiz = new Quiz();
        quiz.setId(2L);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(quizRepository.findById(2L)).thenReturn(Optional.of(quiz));
        when(repository.saveAndFlush(entity)).thenReturn(entity);
        Mockito.lenient().when(mapper.map(entity, QuizQuestionResponse.class)).thenReturn(response);

        QuizQuestionResponse result = service.update(1L, request);

        assertNotNull(result);
        verify(repository).saveAndFlush(entity);
    }

    @Test
    void delete_Success() {
        when(repository.existsById(1L)).thenReturn(true);

        service.delete(1L);

        verify(repository).deleteById(1L);
    }
}
