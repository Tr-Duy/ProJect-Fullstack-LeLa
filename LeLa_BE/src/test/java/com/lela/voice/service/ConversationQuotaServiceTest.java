package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.domain.Users;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.ConversationScenario;
import com.lela.voice.domain.ConversationSession;
import com.lela.voice.domain.UserConversationLevel;
import com.lela.voice.repository.ConversationSessionRepository;
import com.lela.voice.repository.UserConversationLevelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationQuotaServiceTest {

    @Mock
    private ConversationSessionRepository sessionRepository;

    @Mock
    private UserConversationLevelRepository levelRepository;

    @Mock
    private ConversationLevelService levelService;

    @Mock
    private CardProgressRepository cardProgressRepository;

    @Mock
    private com.lela.users.UsersRepository usersRepository;

    private VoiceConfigurationProperties props;

    private ConversationQuotaService quotaService;

    private Users testUser;
    private ConversationScenario testScenario;

    @BeforeEach
    void setUp() {
        props = new VoiceConfigurationProperties();
        props.setTimezone("Asia/Ho_Chi_Minh");
        props.setMaxSessionsPerDay(3);
        props.setIdleTimeoutSeconds(360);

        quotaService = new ConversationQuotaService(
                sessionRepository,
                levelRepository,
                levelService,
                cardProgressRepository,
                usersRepository,
                props
        );

        testUser = new Users();
        testUser.setId(10L);

        testScenario = ConversationScenario.builder()
                .id(1L)
                .slug("order-coffee-shop")
                .title("Coffee Shop")
                .build();
    }

    @Test
    @DisplayName("Hạn mức 3 buổi/ngày: Còn lượt khi đã tiêu thụ 2, Hết lượt khi đã tiêu thụ 3")
    void testDailyQuotaLimit() {
        when(cardProgressRepository.countByUserIdAndState(10L, CardProgressState.REVIEW)).thenReturn(25L);
        when(cardProgressRepository.countByUserIdAndState(10L, CardProgressState.LEARNING)).thenReturn(0L);
        when(cardProgressRepository.countByUserIdAndState(10L, CardProgressState.RELEARNING)).thenReturn(0L);

        // TH1: 2 sessions completed -> remaining = 1
        when(sessionRepository.countCompletedSessionsToday(eq(10L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(2L);
        int remaining = quotaService.getRemainingQuota(10L);
        assertEquals(1, remaining);

        // TH2: 3 sessions completed -> remaining = 0
        when(sessionRepository.countCompletedSessionsToday(eq(10L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(3L);
        assertEquals(0, quotaService.getRemainingQuota(10L));

        when(usersRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testUser));
        when(sessionRepository.findInProgressSessionsForUpdate(10L)).thenReturn(Collections.emptyList());

        // Cố bắt đầu phiên khi đã hết hạn mức -> Ném IllegalStateException
        Flashcard dummyCard = new Flashcard();
        dummyCard.setId(100L);
        assertThrows(IllegalStateException.class, () ->
                quotaService.startSessionWithLock(testUser, testScenario, List.of(dummyCard))
        );
    }

    @Test
    @DisplayName("Quyền sở hữu session: User khác truy cập hoặc hủy -> ResponseStatusException NOT_FOUND (404)")
    void testSessionOwnershipValidation() {
        Users otherUser = new Users();
        otherUser.setId(999L);

        ConversationSession session = ConversationSession.builder()
                .id(100L)
                .publicId("sess-xyz")
                .user(otherUser) // thuộc user 999
                .status("IN_PROGRESS")
                .build();

        when(sessionRepository.findByPublicId("sess-xyz")).thenReturn(Optional.of(session));

        // User 10 cố hủy session của user 999 -> 404 NOT_FOUND
        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> quotaService.abandonSession("sess-xyz", 10L)
        );
        assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("Abandon khi 0 lượt hợp lệ: Session chuyển ABANDONED và giải phóng quota")
    void testAbandonSessionRefundsQuotaWhenZeroValidTurns() {
        ConversationSession session = ConversationSession.builder()
                .id(100L)
                .publicId("sess-abc")
                .user(testUser)
                .validTurnCount(0)
                .status("IN_PROGRESS")
                .build();

        when(sessionRepository.findByPublicId("sess-abc")).thenReturn(Optional.of(session));

        quotaService.abandonSession("sess-abc", 10L);

        assertEquals("ABANDONED", session.getStatus());
        assertNotNull(session.getEndedAt());
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("Scheduled cleanup: Tự động chuyển các phiên IN_PROGRESS quá hạn sang ABANDONED")
    void testCleanupStaleSessions() {
        ConversationSession staleSession = ConversationSession.builder()
                .id(200L)
                .publicId("stale-123")
                .status("IN_PROGRESS")
                .lastActivityAt(LocalDateTime.now().minusSeconds(500))
                .build();

        when(sessionRepository.findStaleInProgressSessions(any(LocalDateTime.class)))
                .thenReturn(List.of(staleSession));

        quotaService.cleanupStaleSessions();

        assertEquals("ABANDONED", staleSession.getStatus());
        assertNotNull(staleSession.getEndedAt());
        verify(sessionRepository).save(staleSession);
    }
}
