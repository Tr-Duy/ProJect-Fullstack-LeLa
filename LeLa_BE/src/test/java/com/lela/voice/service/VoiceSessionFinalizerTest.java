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
    @Mock private com.lela.dailylearningactivity.DailyXpBudget dailyXpBudget;
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
                usageLedgerRepository,
                dailyXpBudget
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
    void exhaustedCapStillRecordsActivityOnceAndExcludesAssistantAndUnrelatedWords() {
        inProgressSession.setValidTurnCount(3);
        when(sessionRepository.findByPublicIdForUpdate("sess-finish-1")).thenReturn(Optional.of(inProgressSession));
        var userTurn = ConversationTurn.builder().role("USER").isValid(true).grammarErrorsJson("[]").build();
        var assistant = ConversationTurn.builder().role("ASSISTANT").isValid(true).build();
        when(turnRepository.findBySessionIdOrderByTurnNumberAsc(1L)).thenReturn(List.of(userTurn, userTurn, userTurn, assistant, assistant));
        var unrelated = ConversationTargetWord.builder().flashcard(new Flashcard()).usedCorrectly(true).build();
        when(targetWordRepository.findBySessionId(1L)).thenReturn(List.of(unrelated));
        when(dailyXpBudget.remaining(eq(10L), any(), eq(150))).thenReturn(0);
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        finalizer.finalizeSession("sess-finish-1", 10L, null);
        finalizer.finalizeSession("sess-finish-1", 10L, null);
        var activity = ArgumentCaptor.forClass(DailyLearningActivityRequest.class);
        verify(dailyLearningActivityService, times(1)).logActivity(activity.capture());
        assertEquals(0, activity.getValue().getXpEarned());
        assertEquals(1, activity.getValue().getVoiceSessionCount());
        assertNull(inProgressSession.getVocabularyScore());
        assertEquals(88, inProgressSession.getOverallScore()); // (100*.4 + 65*.2)/.6
    }

    @Test
    void assistantTurnsDoNotQualifyForXpOrInflateVocabularyBonus() {
        var topic = new com.lela.deck.domain.Topic(); topic.setId(4L);
        var deck = new com.lela.deck.domain.Deck(); deck.setTopic(topic);
        var card = new Flashcard(); card.setDeck(deck);
        inProgressSession.setScenario(ConversationScenario.builder().topic(topic).build());
        when(sessionRepository.findByPublicIdForUpdate("sess-finish-1")).thenReturn(Optional.of(inProgressSession));
        when(targetWordRepository.findBySessionId(1L)).thenReturn(List.of(
                ConversationTargetWord.builder().flashcard(card).usedCorrectly(false).build()));
        var userTurn = ConversationTurn.builder().role("USER").isValid(true).grammarErrorsJson("[]").build();
        var assistant = ConversationTurn.builder().role("ASSISTANT").isValid(true).build();
        when(turnRepository.findBySessionIdOrderByTurnNumberAsc(1L)).thenReturn(List.of(userTurn, assistant, assistant, assistant, assistant));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        finalizer.finalizeSession("sess-finish-1", 10L, null);
        assertEquals(6, inProgressSession.getVocabularyScore());
        verify(dailyLearningActivityService, never()).logActivity(any());
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

        when(sessionRepository.findByPublicIdForUpdate("sess-completed")).thenReturn(Optional.of(alreadyCompleted));

        ConversationSession result = finalizer.finalizeSession("sess-completed", 10L, "COMFORTABLE");

        assertEquals("COMPLETED", result.getStatus());
        assertEquals(85, result.getOverallScore());
        // Không lưu lại hoặc cộng XP lần nữa
        verify(dailyLearningActivityService, never()).logActivity(any());
    }

    @Test
    @DisplayName("Hoàn thành hợp lệ: Tính đúng XP theo công thức mới, gọi dailyLearningActivityService.logActivity với voiceSessionCount = 1")
    void testFinalizeAwardsXpAndIncrementsVoiceSessionCount() {
        when(sessionRepository.findByPublicIdForUpdate("sess-finish-1")).thenReturn(Optional.of(inProgressSession));

        Flashcard fc1 = new Flashcard(); fc1.setId(101L);
        Flashcard fc2 = new Flashcard(); fc2.setId(102L);
        var topic = new com.lela.deck.domain.Topic(); topic.setId(1L);
        var deck = new com.lela.deck.domain.Deck(); deck.setTopic(topic);
        fc1.setDeck(deck); fc2.setDeck(deck);
        inProgressSession.setScenario(ConversationScenario.builder().topic(topic).build());

        ConversationTargetWord tw1 = ConversationTargetWord.builder()
                .flashcard(fc1).wordText("coffee").usedCorrectly(true).status("USED_CORRECT").build();
        ConversationTargetWord tw2 = ConversationTargetWord.builder()
                .flashcard(fc2).wordText("water").usedCorrectly(true).status("USED_CORRECT").build();

        when(targetWordRepository.findBySessionId(1L)).thenReturn(List.of(tw1, tw2));
        when(turnRepository.findBySessionIdOrderByTurnNumberAsc(1L)).thenReturn(java.util.stream.IntStream.range(0, 4)
                .mapToObj(i -> ConversationTurn.builder().role("USER").isValid(true).grammarErrorsJson("[]").build()).toList());
        when(dailyXpBudget.remaining(eq(10L), any(LocalDate.class), eq(150))).thenReturn(150);
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(inv -> inv.getArgument(0));

        finalizer.finalizeSession("sess-finish-1", 10L, "COMFORTABLE");

        assertEquals("COMPLETED", inProgressSession.getStatus());
        // XP: 4 turns * 2 = 8, score 65 / 10 = 7, 2 target words * 3 = 6 -> Total = 21 XP
        assertEquals(23, inProgressSession.getXpAwarded());

        ArgumentCaptor<DailyLearningActivityRequest> captor = ArgumentCaptor.forClass(DailyLearningActivityRequest.class);
        verify(dailyLearningActivityService).logActivity(captor.capture());

        DailyLearningActivityRequest captured = captor.getValue();
        assertEquals(23, captured.getXpEarned());
        assertEquals(1, captured.getVoiceSessionCount());
    }

    @Test
    @DisplayName("Dưới 3 lượt nói hợp lệ: Nhận 0 XP và không gọi logActivity")
    void testFinalizeUnderMinValidTurnsYieldsZeroXp() {
        ConversationSession shortSession = ConversationSession.builder()
                .id(3L)
                .publicId("sess-short")
                .user(testUser)
                .status("IN_PROGRESS")
                .validTurnCount(2)
                .durationSeconds(60)
                .build();

        when(sessionRepository.findByPublicIdForUpdate("sess-short")).thenReturn(Optional.of(shortSession));
        when(targetWordRepository.findBySessionId(3L)).thenReturn(Collections.emptyList());
        when(turnRepository.findBySessionIdOrderByTurnNumberAsc(3L)).thenReturn(Collections.emptyList());
        when(sessionRepository.save(any(ConversationSession.class))).thenAnswer(inv -> inv.getArgument(0));

        finalizer.finalizeSession("sess-short", 10L, null);

        assertEquals("COMPLETED", shortSession.getStatus());
        assertEquals(0, shortSession.getXpAwarded());
        verify(dailyLearningActivityService, never()).logActivity(any());
    }
}
