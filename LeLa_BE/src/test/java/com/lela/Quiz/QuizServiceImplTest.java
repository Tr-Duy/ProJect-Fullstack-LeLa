package com.lela.Quiz;

import com.lela.Quiz.domain.Quiz;
import com.lela.Quiz.dto.QuizRequest;
import com.lela.Quiz.dto.QuizResponse;
import com.lela.common.exception.NotFoundExeception;
import com.lela.deck.DeckRepository;
import com.lela.deck.domain.Deck;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Disabled;

@Disabled
@ExtendWith(MockitoExtension.class)
public class QuizServiceImplTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private QuizServiceImpl quizService;

    private Quiz quizEntity;
    private QuizResponse quizResponse;

    @BeforeEach
    void setUp() {
        quizEntity = new Quiz();
        quizEntity.setId(1L);
        quizEntity.setTitle("Test Quiz");

        quizResponse = new QuizResponse();
        quizResponse.setId(1L);
        quizResponse.setTitle("Test Quiz");
    }

    @Test
    void findAll_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Quiz> page = new PageImpl<>(Arrays.asList(quizEntity));

        when(quizRepository.findAll(pageable)).thenReturn(page);
        when(mapper.map(quizEntity, QuizResponse.class)).thenReturn(quizResponse);

        // call with additional parameters (category, examTypeId, levelId) as null
        Page<QuizResponse> result = quizService.findAll(pageable, null, null, null);

        assertEquals(1, result.getTotalElements());
        verify(quizRepository).findAll(pageable);
    }

    @Test
    void findById_Success() {
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quizEntity));
        when(mapper.map(quizEntity, QuizResponse.class)).thenReturn(quizResponse);

        QuizResponse result = quizService.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(quizRepository).findById(1L);
    }

    @Test
    void findById_NotFound_ThrowsException() {
        when(quizRepository.findById(99L)).thenReturn(Optional.empty());

        NotFoundExeception exception = assertThrows(NotFoundExeception.class, () -> {
            quizService.findById(99L);
        });
        assertTrue(exception.getMessage().contains("Quiz not found"));
    }

    @Test
    void create_Success() {
        QuizRequest request = new QuizRequest();
        request.setDeckId(2L);
        request.setCreatedById(3L);
        request.setTitle("New Quiz");

        Deck deck = new Deck();
        deck.setId(2L);

        Users user = new Users();
        user.setId(3L);

        when(deckRepository.findById(2L)).thenReturn(Optional.of(deck));
        when(usersRepository.findById(3L)).thenReturn(Optional.of(user));
        when(mapper.map(request, Quiz.class)).thenReturn(quizEntity);
        when(quizRepository.save(any(Quiz.class))).thenReturn(quizEntity);
        when(mapper.map(quizEntity, QuizResponse.class)).thenReturn(quizResponse);

        QuizResponse result = quizService.create(request);

        assertNotNull(result);
        verify(deckRepository).findById(2L);
        verify(usersRepository).findById(3L);
        verify(quizRepository).save(any(Quiz.class));
    }

    @Test
    void update_Success() {
        QuizRequest request = new QuizRequest();
        request.setDeckId(2L);

        Deck deck = new Deck();
        deck.setId(2L);

        when(quizRepository.findById(1L)).thenReturn(Optional.of(quizEntity));
        when(deckRepository.findById(2L)).thenReturn(Optional.of(deck));
        when(quizRepository.save(quizEntity)).thenReturn(quizEntity);
        Mockito.lenient().when(mapper.map(quizEntity, QuizResponse.class)).thenReturn(quizResponse);

        QuizResponse result = quizService.update(1L, request);

        assertNotNull(result);
        verify(quizRepository).save(quizEntity);
    }

    @Test
    void delete_Success() {
        when(quizRepository.existsById(1L)).thenReturn(true);

        quizService.delete(1L);

        verify(quizRepository).deleteById(1L);
    }
}
