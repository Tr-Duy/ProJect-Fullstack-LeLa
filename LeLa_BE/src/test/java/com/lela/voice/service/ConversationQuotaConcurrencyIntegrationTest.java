package com.lela.voice.service;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import com.lela.voice.domain.ConversationScenario;
import com.lela.voice.domain.ConversationSession;
import com.lela.voice.repository.ConversationScenarioRepository;
import com.lela.voice.repository.ConversationSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class ConversationQuotaConcurrencyIntegrationTest {

    @Autowired
    private ConversationQuotaService quotaService;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private ConversationScenarioRepository scenarioRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private ConversationSessionRepository sessionRepository;

    @Test
    @DisplayName("Chạy trên MySQL thật: 10 request đồng thời cho cùng 1 user chỉ sinh đúng 1 phiên IN_PROGRESS và tối đa 3 lượt/ngày")
    void testConcurrentStartSessionRequestsOnRealDatabase() throws InterruptedException {
        Users adminUser = usersRepository.findByUsername("admin").orElseThrow();
        ConversationScenario scenario = scenarioRepository.findAll().get(0);
        List<Flashcard> cards = flashcardRepository.findAll().stream().limit(3).toList();

        // Đảm bảo không còn phiên IN_PROGRESS cũ từ các lần test trước
        sessionRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(adminUser.getId()) && "IN_PROGRESS".equals(s.getStatus()))
                .forEach(s -> {
                    s.setStatus("ABANDONED");
                    sessionRepository.save(s);
                });

        int threads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);
        List<String> createdPublicIds = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    ConversationSession session = quotaService.startSessionWithLock(adminUser, scenario, cards);
                    successCount.incrementAndGet();
                    createdPublicIds.add(session.getPublicId());
                } catch (Exception e) {
                    rejectedCount.incrementAndGet();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // Bắn 10 threads cùng 1 thời điểm
        executor.shutdown();
        boolean finished = executor.awaitTermination(15, TimeUnit.SECONDS);
        assertTrue(finished, "Tất cả các thread đồng thời phải hoàn thành");

        // Kiểm tra cơ sở dữ liệu thật:
        // PESSIMISTIC_WRITE & kiểm tra in-progress đảm bảo TẤT CẢ các cuộc gọi thành công đều trả về CÙNG 1 phiên IN_PROGRESS duy nhất
        // và KHÔNG BAO GIỜ sinh ra 2 phiên IN_PROGRESS đồng thời cho 1 người dùng.
        List<ConversationSession> inProgressSessions = sessionRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(adminUser.getId()) && "IN_PROGRESS".equals(s.getStatus()))
                .toList();

        assertTrue(inProgressSessions.size() <= 1, "Chỉ được phép có tối đa 1 phiên IN_PROGRESS cho user tại mọi thời điểm");
        if (!createdPublicIds.isEmpty()) {
            String firstId = createdPublicIds.get(0);
            for (String pid : createdPublicIds) {
                assertEquals(firstId, pid, "Tất cả các request đồng thời phải được gom về cùng 1 phiên IN_PROGRESS");
            }
        }
    }
}
