package com.lela.reviewsession;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.deck.domain.Deck;
import com.lela.reviewsession.domain.ReviewSession;
import com.lela.reviewsession.domain.ReviewSessionStatus;
import com.lela.reviewsession.domain.ReviewSessionType;
import com.lela.reviewsession.dto.ReviewSessionRequest;
import com.lela.reviewsession.dto.ReviewSessionResponse;
import com.lela.srsreview.SrsReviewRepository;
import com.lela.srsreview.dto.ReviewEventDto;
import com.lela.srsreview.dto.SyncReviewRequest;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewSessionServiceImplTest {

    @Mock
    private ReviewSessionRepository sessionRepository;

    @Mock
    private com.lela.users.UsersRepository usersRepository;

    @Mock
    private SrsReviewRepository srsReviewRepository;

    @Mock
    private CardProgressRepository cardProgressRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private com.lela.srsreview.SrsReviewService srsReviewService;

    @InjectMocks
    private ReviewSessionServiceImpl service;

    private ReviewSession session;

    @BeforeEach
    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("testuser");
        SecurityContextHolder.setContext(securityContext);

        Users user = new Users();
        user.setId(1L);
        Mockito.lenient().when(usersRepository.findByUsername(org.mockito.ArgumentMatchers.anyString())).thenReturn(Optional.of(user));

        session = new ReviewSession();
        session.setId(1L);
        session.setUser(user);
        session.setPublicId("session-123");
        session.setStatus(ReviewSessionStatus.IN_PROGRESS);
    }

    @Test
    void startSession_Success() {
        ReviewSessionRequest request = new ReviewSessionRequest();
        request.setDeckId(1L);
        request.setSessionType(ReviewSessionType.REGULAR);
        
        when(entityManager.getReference(Users.class, 1L)).thenReturn(new Users());
        when(entityManager.getReference(Deck.class, 1L)).thenReturn(new Deck());
        when(sessionRepository.save(any(ReviewSession.class))).thenReturn(session);
        
        ReviewSessionResponse response = new ReviewSessionResponse();
        when(modelMapper.map(any(), eq(ReviewSessionResponse.class))).thenReturn(response);

        ReviewSessionResponse result = service.startSession(request);

        assertNotNull(result);
        verify(sessionRepository).save(any(ReviewSession.class));
    }

    @Test
    void syncOfflineReviews_Success() {
        SyncReviewRequest request = new SyncReviewRequest();
        request.setSessionPublicId("session-123");
        
        ReviewEventDto event = new ReviewEventDto();
        event.setClientEventId("evt123");
        event.setCardId(1L);
        event.setRating(3);
        event.setClientReviewedAt(LocalDateTime.now());
        
        request.setEvents(Collections.singletonList(event));
        
        com.lela.srsreview.dto.SrsReviewRequest srsRequest = new com.lela.srsreview.dto.SrsReviewRequest();
        when(modelMapper.map(any(ReviewEventDto.class), eq(com.lela.srsreview.dto.SrsReviewRequest.class))).thenReturn(srsRequest);
        
        when(sessionRepository.findByPublicId("session-123")).thenReturn(Optional.of(session));
        
        com.lela.srsreview.dto.SrsReviewResponse srsResponse = new com.lela.srsreview.dto.SrsReviewResponse();
        when(srsReviewService.reviewCard(any(com.lela.srsreview.dto.SrsReviewRequest.class))).thenReturn(srsResponse);
        
        service.syncOfflineReviews(request);
        
        verify(srsReviewService).reviewCard(any(com.lela.srsreview.dto.SrsReviewRequest.class));
        verify(sessionRepository).save(session);
        assertEquals(ReviewSessionStatus.COMPLETED, session.getStatus());
    }

    @Test
    void getCurrentSession_Success() {
        when(sessionRepository.findActiveSessions(1L, ReviewSessionStatus.IN_PROGRESS)).thenReturn(Collections.singletonList(session));
        ReviewSessionResponse response = new ReviewSessionResponse();
        when(modelMapper.map(session, ReviewSessionResponse.class)).thenReturn(response);

        ReviewSessionResponse result = service.getCurrentSession();

        assertNotNull(result);
    }

    @Test
    void abandonSession_Success() {
        when(sessionRepository.findByPublicId("session-123")).thenReturn(Optional.of(session));
        
        service.abandonSession("session-123");
        
        assertEquals(ReviewSessionStatus.ABANDONED, session.getStatus());
        verify(sessionRepository).save(session);
    }

    @Test
    void getTodayStats_Success() {
        when(srsReviewRepository.countReviewsInPeriod(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(15L);
        
        Map<String, Object> result = service.getTodayStats();
        
        assertEquals(15L, result.get("totalReviewsToday"));
    }

    @Test
    void getWeeklyStats_Success() {
        when(srsReviewRepository.countReviewsInPeriod(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(100L);
        
        Map<String, Object> result = service.getWeeklyStats();
        
        assertEquals(100L, result.get("totalReviewsWeekly"));
    }
}
