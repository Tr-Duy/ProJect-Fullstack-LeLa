package com.lela.QuizAttempt;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttempt.dto.QuizAttemptReponse;
import com.lela.QuizAttempt.dto.QuizAttemptRequest;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
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
public class QuizAttemptServiceImplTest {

    @Mock
    private QuizAttemptRepository repository;
    
    @Mock
    private QuizRepository quizRepository;
    
    @Mock
    private UsersRepository usersRepository;
    
    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizAttemptServiceImpl service;

    private QuizAttempt entity;
    private QuizAttemptReponse response;

    @BeforeEach
    void setUp() {
        entity = new QuizAttempt();
        entity.setId(1L);

        response = new QuizAttemptReponse();
        response.setPublicId("123");
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<QuizAttempt> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findAll(pageable)).thenReturn(page);
        when(mapper.map(entity, QuizAttemptReponse.class)).thenReturn(response);

        Page<QuizAttemptReponse> result = service.findAll(pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void create_Success() {
        QuizAttemptRequest request = new QuizAttemptRequest();
        request.setQuizId(2L);
        request.setUserId(3L);

        Quiz quiz = new Quiz();
        quiz.setId(2L);
        
        Users user = new Users();
        user.setId(3L);

        when(quizRepository.findById(2L)).thenReturn(Optional.of(quiz));
        when(usersRepository.findById(3L)).thenReturn(Optional.of(user));
        when(mapper.map(request, QuizAttempt.class)).thenReturn(entity);
        when(repository.save(any(QuizAttempt.class))).thenReturn(entity);
        when(mapper.map(entity, QuizAttemptReponse.class)).thenReturn(response);

        QuizAttemptReponse result = service.create(request);

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
