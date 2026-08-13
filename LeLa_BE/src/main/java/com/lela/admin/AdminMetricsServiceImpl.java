package com.lela.admin;

import com.lela.deck.DeckRepository;
import com.lela.flashcard.FlashcardRepository;
import com.lela.payment.PaymentRepository;
import com.lela.users.UsersRepository;
import com.lela.usersubscription.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class AdminMetricsServiceImpl implements AdminMetricsService {

    private final UsersRepository usersRepository;
    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final PaymentRepository paymentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Override
    public Map<String, Object> getDashboardMetrics() {
        long totalUsers = usersRepository.count();
        long systemDecks = deckRepository.count();
        long totalFlashcards = flashcardRepository.count();
        long totalPayments = paymentRepository.count();

        // 1. Calculate Monthly Revenue (Start of current month)
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        BigDecimal monthlyRevenue = paymentRepository.calculateRevenueSince(startOfMonth);

        // 2. Calculate User Activity (New Users in the last 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minus(6, ChronoUnit.DAYS);
        List<LocalDateTime> registrationDates = usersRepository.findUserRegistrationDatesSince(sevenDaysAgo);
        
        // Group by Date
        Map<String, Long> userActivityMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        // Initialize with 0 for the last 7 days
        for (int i = 6; i >= 0; i--) {
            userActivityMap.put(LocalDateTime.now().minus(i, ChronoUnit.DAYS).format(formatter), 0L);
        }
        
        for (LocalDateTime date : registrationDates) {
            String dateString = date.format(formatter);
            if (userActivityMap.containsKey(dateString)) {
                userActivityMap.put(dateString, userActivityMap.get(dateString) + 1);
            }
        }
        
        List<Map<String, Object>> userActivityList = new ArrayList<>();
        for (Map.Entry<String, Long> entry : userActivityMap.entrySet()) {
            Map<String, Object> activity = new HashMap<>();
            // Frontend expects 'name' for the X-axis label and 'users' for the value
            // We format MM-dd so it looks cleaner on the chart
            activity.put("name", entry.getKey().substring(5)); // e.g., "08-02"
            activity.put("users", entry.getValue());
            userActivityList.add(activity);
        }

        // 3. Subscription Distribution
        List<Object[]> rawDistribution = userSubscriptionRepository.countActiveSubscriptionsGroupedByPlan();
        List<Map<String, Object>> subscriptionDistributionList = new ArrayList<>();
        for (Object[] row : rawDistribution) {
            String planName = (String) row[0];
            Long count = (Long) row[1];
            Map<String, Object> distribution = new HashMap<>();
            distribution.put("name", planName != null ? planName : "Unknown");
            distribution.put("value", count);
            subscriptionDistributionList.add(distribution);
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalUsers", totalUsers);
        metrics.put("systemDecks", systemDecks);
        metrics.put("totalFlashcards", totalFlashcards);
        metrics.put("totalPayments", totalPayments);
        metrics.put("monthlyRevenue", monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO);
        metrics.put("userActivity", userActivityList);
        metrics.put("subscriptionDistribution", subscriptionDistributionList);

        return metrics;
    }
}
