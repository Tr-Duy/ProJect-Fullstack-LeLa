package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.users.domain.Users;
import com.lela.voice.domain.UserConversationLevel;
import com.lela.voice.repository.ConversationLevelHistoryRepository;
import com.lela.voice.repository.UserConversationLevelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationLevelServiceTest {

    @Mock
    private UserConversationLevelRepository levelRepository;

    @Mock
    private ConversationLevelHistoryRepository historyRepository;

    @Mock
    private CardProgressRepository cardProgressRepository;

    @Mock
    private com.lela.users.UsersRepository usersRepository;

    private ConversationLevelService levelService;

    @BeforeEach
    void setUp() {
        levelService = new ConversationLevelService(levelRepository, historyRepository, cardProgressRepository, usersRepository);
    }

    @Test
    @DisplayName("Verify fixed floors: A1=100, A2=100, B1=300, B2=450, C1=650")
    void testFloorLevels() {
        assertEquals(100, levelService.getFloorLevel(100)); // A1
        assertEquals(100, levelService.getFloorLevel(250)); // A2
        assertEquals(100, levelService.getFloorLevel(300)); // A2
        assertEquals(300, levelService.getFloorLevel(450)); // B1
        assertEquals(450, levelService.getFloorLevel(650)); // B2
        assertEquals(650, levelService.getFloorLevel(850)); // C1
    }

    @Test
    @DisplayName("Verify vocabCap calculation")
    void testVocabCap() {
        assertEquals(250, levelService.calculateVocabCap(40));
        assertEquals(400, levelService.calculateVocabCap(100));
        assertEquals(600, levelService.calculateVocabCap(200));
        assertEquals(800, levelService.calculateVocabCap(500));
        assertEquals(1000, levelService.calculateVocabCap(700));
    }

    @Test
    @DisplayName("Block EASY if overallScore < 50")
    void testBlockEasyWhenScoreLow() {
        Users user = new Users();
        user.setId(1L);

        UserConversationLevel userLvl = UserConversationLevel.builder()
                .userId(1L)
                .user(user)
                .currentLevel(300)
                .initialBandMin(300)
                .highestLevel(300)
                .totalSessions(0)
                .consecutiveHardCount(0)
                .build();

        when(cardProgressRepository.countByUserId(1L)).thenReturn(200L); // Cap 600

        int newLevel = levelService.applySessionLevelAdjustment(userLvl, "EASY", 45, 101L);
        // Điểm < 50 -> delta = 0, giữ nguyên 300
        assertEquals(300, newLevel);
        assertEquals(300, userLvl.getCurrentLevel());
    }

    @Test
    @DisplayName("Apply HARD -50 but respect floor")
    void testApplyHardRespectFloor() {
        Users user = new Users();
        user.setId(1L);

        // User A2 floor 100, currentLevel 100
        UserConversationLevel userLvl = UserConversationLevel.builder()
                .userId(1L)
                .user(user)
                .currentLevel(100)
                .initialBandMin(300) // floor 100
                .highestLevel(300)
                .totalSessions(0)
                .consecutiveHardCount(0)
                .build();

        when(cardProgressRepository.countByUserId(1L)).thenReturn(200L);

        int newLevel = levelService.applySessionLevelAdjustment(userLvl, "HARD", 30, 102L);
        // 100 - 50 = 50, but floor is 100 -> clamped to 100
        assertEquals(100, newLevel);
        assertEquals(1, userLvl.getConsecutiveHardCount());
    }
}
