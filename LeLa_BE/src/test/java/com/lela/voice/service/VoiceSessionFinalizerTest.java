package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.voice.config.VoiceConfigurationProperties;
import com.lela.voice.domain.*;
import com.lela.voice.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoiceSessionFinalizerTest {

    @Mock
    private ConversationSessionRepository sessionRepository;
    @Mock
    private ConversationTurnRepository turnRepository;
    @Mock
    private ConversationTargetWordRepository targetWordRepository;
    @Mock
    private UserConversationLevelRepository levelRepository;
    @Mock
    private ConversationLevelService levelService;
    @Mock
    private CardProgressRepository cardProgressRepository;
    @Mock
    private DailyLearningActivityService dailyLearningActivityService;
    @Mock
    private UsersRepository usersRepository;
    @Mock
    private com.lela.voice.repository.UsageLedgerRepository usageLedgerRepository;

    private VoiceConfigurationProperties props;
    private VoiceSessionFinalizer finalizer;

    private Users testUser;
    private ConversationSession inProgressSession;

    @BeforeEach
    void setUp() {
        props = new VoiceConfigurationProperties();
        props.setTimezone("Asia/Ho_Chi_Minh");
        props.setDailyXpCap(150);
        props.setXpPerCompletedSession(50);

        finalizer = new VoiceSessionFinalizer(
                sessionRepository,
                turnRepository,
                targetWordRepository,
                levelRepository,
                levelService,
                cardProgressRepository,
                dailyLearningActivityService,
                usersRepository,
                props,
                usageLedgerRepository
        );

        testUser = new Users();
        testUser.setId(10L);

        inProgressSession = ConversationSession.builder()
                .id(1L)
                .publicId("sess-finish-1")
                .user(testUser)
                .status("IN_PROGRESS")
                .validTurnCount(4)
                .durationSeconds(180)
                .build();
    }

    @Test
    @DisplayName("Idempotent Finalize: Gọi lần 2 trên session đã COMPLETED không chạy lại logic cộng điểm")
    void testFinalizeIsIdempotent() {
        ConversationSession alreadyCompleted = ConversationSession.builder()
                .id(2L)
                .publicId("sess-completed")
                .user(testUser)
                .status("COMPLETED")
                .overallScore(85)
                .build();

        when(sessionRepository.findByPublicId("sess-completed")).thenReturn(Optional.of(alreadyCompleted));

        ConversationSession result = finalizer.finalizeSession("sess-completed", 10L, "COMFORTABLE");

        assertEquals("COMPLETED", result.getStatus());
        assertEquals(85, result.getOverallScore());
        // Không lưu lại hoặc cộng XP lần nữa
        verify(dailyLearningActivityService, never()).logActivity(any());
    }

    @Test
    @DisplayName("Hoàn thành hợp lệ: Cộng 50 XP, gọi dailyLearningActivityService.logActivity với voiceSessionCount = 1")
    void testFinalizeAwardsXpAndIncrementsVoiceSessionCount() {
        when(sessionRepository.findByPublicId("sess-finish-1")).thenReturn(Optional.of(inProgressSession));

        Flashcard fc1 = new Flashcard(); fc1.setId(101L);
        Flashcard fc2 = new Flashcard(); fc2.setId(102L);

        ConversationTargetWord tw1 = ConversationTargetWord.builder()
                .flashcard(fc1).wordText("coffee").usedCorrectly(true).status("USED_CORRECT").build();
        ConversationTargetWord tw2 = ConversationTargetWord.builder()
                .flashcard(fc2).wordText("water").usedCorrectly(true).status("USED_CORRECT").build();

        when(targetWordRepository.findBySessionId(1L)).thenReturn(List.of(tw1, tw2));
        when(turnRepository.findBySessionIdOrderByTurnNumberAsc(1L)).thenReturn(Collections.emptyList());
        when(sessionRepository.sumDailyXpAwarded(eq(10L), any(LocalDate.class))).thenReturn(0);
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(inv -> inv.getArgument(0));

        finalizer.finalizeSession("sess-finish-1", 10L, "COMFORTABLE");

        assertEquals("COMPLETED", inProgressSession.getStatus());
        assertEquals(50, inProgressSession.getXpAwarded());

        ArgumentCaptor<DailyLearningActivityRequest> captor = ArgumentCaptor.forClass(DailyLearningActivityRequest.class);
        verify(dailyLearningActivityService).logActivity(captor.capture());

        DailyLearningActivityRequest captured = captor.getValue();
        assertEquals(50, captured.getXpEarned());
        assertEquals(1, captured.getVoiceSessionCount());
    }
}
