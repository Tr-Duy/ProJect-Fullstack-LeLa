package com.lela.deck;

import com.lela.common.domain.ExamType;
import com.lela.common.domain.ProficiencyLevel;
import com.lela.deck.domain.Deck;
import com.lela.deck.domain.DeckDifficulty;
import com.lela.deck.domain.DeckStatus;
import com.lela.deckenrollment.DeckEnrollmentRepository;
import com.lela.deckenrollment.DeckEnrollmentServiceImpl;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class MyDecksAndDiscoverTest {

    @Mock
    private DeckEnrollmentRepository deckEnrollmentRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private DeckEnrollmentServiceImpl deckEnrollmentService;

    private Users userA;
    private Users userB;
    private ProficiencyLevel level1;
    private ProficiencyLevel level3;
    private ProficiencyLevel level4;
    private Deck deckFruitLevel1;
    private Deck deckJobLevel3;

    @BeforeEach
    void setUp() {
        ExamType examType = new ExamType();
        examType.setId(1L);

        level1 = new ProficiencyLevel();
        level1.setId(10L);
        level1.setName("Cơ bản");
        level1.setExamType(examType);

        level3 = new ProficiencyLevel();
        level3.setId(30L);
        level3.setName("Khá - Giỏi");
        level3.setExamType(examType);

        level4 = new ProficiencyLevel();
        level4.setId(40L);
        level4.setName("Xuất sắc");
        level4.setExamType(examType);

        userA = new Users();
        userA.setId(100L);
        userA.setUsername("userA");
        userA.setCurrentLevel(level1);

        userB = new Users();
        userB.setId(200L);
        userB.setUsername("userB");
        userB.setCurrentLevel(level1);

        deckFruitLevel1 = new Deck();
        deckFruitLevel1.setId(1000L);
        deckFruitLevel1.setTitle("Trái cây");
        deckFruitLevel1.setLevel(level1);
        deckFruitLevel1.setExamType(examType);

        deckJobLevel3 = new Deck();
        deckJobLevel3.setId(2000L);
        deckJobLevel3.setTitle("Công việc");
        deckJobLevel3.setLevel(level3);
        deckJobLevel3.setExamType(examType);

        mockAuthentication("userA");
    }

    private void mockAuthentication(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(username);
        when(auth.getName()).thenReturn(username);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    // TEST 1: User Level 1 enrolls "Trái cây" Level 1 -> My Decks returns "Trái cây"
    @Test
    void test1_UserLevel1_EnrollsFruit_AppearsInMyDecks() {
        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setId(1L);
        enrollment.setUser(userA);
        enrollment.setDeck(deckFruitLevel1);
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(deckEnrollmentRepository.findByUserId(eq(100L), any()))
                .thenReturn(new PageImpl<>(List.of(enrollment)));

        Page<com.lela.deckenrollment.dto.DeckEnrollmentResponse> myDecks = deckEnrollmentService.getUserEnrollList(PageRequest.of(0, 10));

        assertNotNull(myDecks);
        assertEquals(1, myDecks.getContent().size());
    }

    // TEST 2 & TEST 3: User changes Level 1 -> Level 3 -> My Decks STILL retains "Trái cây" without resetting progress
    @Test
    void test2_3_UserChangesLevel1ToLevel3_MyDecksRetainsFruitAndProgress() {
        // Change level to Level 3
        userA.setCurrentLevel(level3);

        DeckEnrollment enrollment = new DeckEnrollment();
        enrollment.setId(1L);
        enrollment.setUser(userA);
        enrollment.setDeck(deckFruitLevel1);
        enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        enrollment.setMasteredCards(15);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(deckEnrollmentRepository.findByUserId(eq(100L), any()))
                .thenReturn(new PageImpl<>(List.of(enrollment)));

        Page<com.lela.deckenrollment.dto.DeckEnrollmentResponse> myDecks = deckEnrollmentService.getUserEnrollList(PageRequest.of(0, 10));

        assertNotNull(myDecks);
        assertEquals(1, myDecks.getContent().size());
        assertEquals(15, enrollment.getMasteredCards()); // Progress retained!
    }

    // TEST 6 & TEST 7: User enrolls Level 3 "Công việc", then changes Level 3 -> Level 4 -> My Decks retains BOTH "Trái cây" and "Công việc"
    @Test
    void test6_7_UserChangesLevel3ToLevel4_MyDecksRetainsBothDecks() {
        userA.setCurrentLevel(level4);

        DeckEnrollment e1 = new DeckEnrollment();
        e1.setId(1L);
        e1.setUser(userA);
        e1.setDeck(deckFruitLevel1);

        DeckEnrollment e2 = new DeckEnrollment();
        e2.setId(2L);
        e2.setUser(userA);
        e2.setDeck(deckJobLevel3);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(deckEnrollmentRepository.findByUserId(eq(100L), any()))
                .thenReturn(new PageImpl<>(List.of(e1, e2)));

        Page<com.lela.deckenrollment.dto.DeckEnrollmentResponse> myDecks = deckEnrollmentService.getUserEnrollList(PageRequest.of(0, 10));

        assertNotNull(myDecks);
        assertEquals(2, myDecks.getContent().size());
    }

    // TEST 10: User A enrolled "Trái cây", User B has not enrolled -> User A has it, User B does not
    @Test
    void test10_UserAEnrolledFruit_UserBHasNotEnrolled() {
        DeckEnrollment eA = new DeckEnrollment();
        eA.setUser(userA);
        eA.setDeck(deckFruitLevel1);

        when(usersRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(deckEnrollmentRepository.findByUserId(eq(100L), any()))
                .thenReturn(new PageImpl<>(List.of(eA)));

        when(usersRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(deckEnrollmentRepository.findByUserId(eq(200L), any()))
                .thenReturn(Page.empty());

        // Check User A
        Page<com.lela.deckenrollment.dto.DeckEnrollmentResponse> myDecksA = deckEnrollmentService.getUserEnrollList(PageRequest.of(0, 10));
        assertEquals(1, myDecksA.getContent().size());

        // Check User B
        mockAuthentication("userB");
        Page<com.lela.deckenrollment.dto.DeckEnrollmentResponse> myDecksB = deckEnrollmentService.getUserEnrollList(PageRequest.of(0, 10));
        assertEquals(0, myDecksB.getContent().size());
    }
}
