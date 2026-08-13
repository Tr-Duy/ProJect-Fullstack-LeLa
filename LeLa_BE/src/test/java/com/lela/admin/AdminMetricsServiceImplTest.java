package com.lela.admin;

import com.lela.deck.DeckRepository;
import com.lela.flashcard.FlashcardRepository;
import com.lela.payment.PaymentRepository;
import com.lela.users.UsersRepository;
import com.lela.usersubscription.UserSubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Disabled;
@Disabled
@ExtendWith(MockitoExtension.class)
public class AdminMetricsServiceImplTest {

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private FlashcardRepository flashcardRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @InjectMocks
    private AdminMetricsServiceImpl adminMetricsService;

    @Test
    void getDashboardMetrics_Success() {
        when(usersRepository.count()).thenReturn(100L);
        when(deckRepository.count()).thenReturn(50L);
        when(flashcardRepository.count()).thenReturn(2000L);
        when(paymentRepository.count()).thenReturn(150L);

        when(paymentRepository.calculateRevenueSince(any(LocalDateTime.class))).thenReturn(new BigDecimal("1000.00"));

        List<LocalDateTime> regDates = Arrays.asList(LocalDateTime.now(), LocalDateTime.now().minusDays(1));
        when(usersRepository.findUserRegistrationDatesSince(any(LocalDateTime.class))).thenReturn(regDates);

        Object[] plan1 = new Object[]{"Premium", 10L};
        Object[] plan2 = new Object[]{"Pro", 5L};
        when(userSubscriptionRepository.countActiveSubscriptionsGroupedByPlan()).thenReturn(Arrays.asList(plan1, plan2));

        Map<String, Object> metrics = adminMetricsService.getDashboardMetrics();

        assertEquals(100L, metrics.get("totalUsers"));
        assertEquals(50L, metrics.get("systemDecks"));
        assertEquals(2000L, metrics.get("totalFlashcards"));
        assertEquals(150L, metrics.get("totalPayments"));
        assertEquals(new BigDecimal("1000.00"), metrics.get("monthlyRevenue"));

        List<?> userActivity = (List<?>) metrics.get("userActivity");
        assertNotNull(userActivity);
        assertTrue(userActivity.size() >= 30); // Should initialize 30 days

        List<?> subscriptionDistribution = (List<?>) metrics.get("subscriptionDistribution");
        assertEquals(2, subscriptionDistribution.size());
    }

    @Test
    void getDashboardMetrics_NullRevenue_Success() {
        when(paymentRepository.calculateRevenueSince(any(LocalDateTime.class))).thenReturn(null);
        when(userSubscriptionRepository.countActiveSubscriptionsGroupedByPlan()).thenReturn(Collections.emptyList());
        when(usersRepository.findUserRegistrationDatesSince(any(LocalDateTime.class))).thenReturn(Collections.emptyList());

        Map<String, Object> metrics = adminMetricsService.getDashboardMetrics();

        assertEquals(BigDecimal.ZERO, metrics.get("monthlyRevenue"));
        List<?> subscriptionDistribution = (List<?>) metrics.get("subscriptionDistribution");
        assertTrue(subscriptionDistribution.isEmpty());
    }
}
