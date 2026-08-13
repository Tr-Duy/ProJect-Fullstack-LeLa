package com.lela.cardprogress;

import com.lela.auth.JwtService;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.cardprogress.dto.CardProgressResponse;
import com.lela.cardprogress.dto.CardProgressSummaryRepponse;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.domain.Users;
import jakarta.servlet.http.HttpServletRequest;
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
import io.jsonwebtoken.Claims;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CardProgressServiceImplTest {

    @Mock
    private CardProgressRepository repository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private JwtService jwtService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private CardProgressServiceImpl service;

    private CardProgress entity;

    @BeforeEach
    void setUp() {
        when(request.getHeader("Authorization")).thenReturn("Bearer token");
        Claims claims = mock(Claims.class);
        when(claims.get("userId", Long.class)).thenReturn(1L);
        when(jwtService.parseClaims("token")).thenReturn(claims);

        Users user = new Users();
        user.setId(1L);

        Flashcard card = new Flashcard();
        card.setId(1L);

        entity = new CardProgress();
        entity.setId(1L);
        entity.setUser(user);
        entity.setCard(card);
        entity.setState(CardProgressState.NEW);
    }

    @Test
    void getProgressByDeck_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<CardProgress> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findByUserIdAndDeckId(eq(1L), eq(2L), eq(pageable))).thenReturn(page);

        Page<CardProgressSummaryRepponse> result = service.getProgressByDeck(2L, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getReviewCards_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<CardProgress> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findReviewCards(eq(1L), eq(2L), any(LocalDateTime.class), eq(pageable))).thenReturn(page);

        Page<CardProgressSummaryRepponse> result = service.getReviewCards(2L, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getNewCards_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<CardProgress> page = new PageImpl<>(Arrays.asList(entity));

        when(repository.findNewCards(eq(1L), eq(2L), eq(CardProgressState.NEW), eq(pageable))).thenReturn(page);

        Page<CardProgressSummaryRepponse> result = service.getNewCards(2L, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getProgressDetail_Success() {
        when(repository.findByUserIdAndCardId(1L, 1L)).thenReturn(Optional.of(entity));
        
        CardProgressResponse response = new CardProgressResponse();
        response.setId(1L);
        when(modelMapper.map(entity, CardProgressResponse.class)).thenReturn(response);

        CardProgressResponse result = service.getProgressDetail(1L);

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals(1L, result.getCardId());
    }

    @Test
    void suspendCard_Success() {
        when(repository.findByUserIdAndCardId(1L, 1L)).thenReturn(Optional.of(entity));
        
        service.suspendCard(1L);

        assertEquals(CardProgressState.SUSPENDED, entity.getState());
        verify(repository).save(entity);
    }

    @Test
    void resetProgress_Success() {
        when(repository.findByUserIdAndCardId(1L, 1L)).thenReturn(Optional.of(entity));
        
        service.resetProgress(1L);

        assertEquals(CardProgressState.NEW, entity.getState());
        assertEquals(0, entity.getRepetitions());
        verify(repository).save(entity);
    }
}
