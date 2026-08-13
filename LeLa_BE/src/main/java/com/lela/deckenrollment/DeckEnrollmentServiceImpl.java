package com.lela.deckenrollment;

import com.lela.common.exception.NotFoundExeception;
import com.lela.deck.domain.Deck;
import com.lela.deckenrollment.domain.DeckEnrollment;
import com.lela.deckenrollment.domain.DeckEnrollmentStatus;
import com.lela.deckenrollment.dto.DeckEnrollmentRequest;
import com.lela.deckenrollment.dto.DeckEnrollmentResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Async;
import com.lela.cardprogress.event.CardProgressEvent;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DeckEnrollmentServiceImpl implements DeckEnrollmentService {

    private final DeckEnrollmentRepository repository;
    private final UsersRepository usersRepository; // Inject để tự lấy ID từ Username
    private final EntityManager entityManager;


    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Bạn cần đăng nhập để thực hiện hành động này.");
        }

        // Nhóm lưu username trong token, ta dùng username để tìm ID trong DB
        String username = auth.getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + username))
                .getId();
    }

    @Override
    @Transactional
    public DeckEnrollmentResponse enrollDeck(DeckEnrollmentRequest request) {
        Long userId = getCurrentUserId();

        // 1. Kiểm tra tồn tại
        DeckEnrollment enrollment = repository.findByUserIdAndDeckId(userId, request.getDeckId())
                .orElse(null);

        // 2. Nếu mới thì tạo, nếu cũ mà bị DROPPED/PAUSED thì kích hoạt lại
        if (enrollment == null) {
            enrollment = new DeckEnrollment();
            enrollment.setUser(entityManager.getReference(Users.class, userId));
            enrollment.setDeck(entityManager.getReference(Deck.class, request.getDeckId()));
            enrollment.setEnrolledAt(LocalDateTime.now());
            enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);

            // Tăng số lượng người học (enrollmentCount)
            entityManager.createQuery("UPDATE Deck d SET d.enrollmentCount = d.enrollmentCount + 1 WHERE d.id = :deckId")
                    .setParameter("deckId", request.getDeckId())
                    .executeUpdate();

            // Khởi tạo tiến độ cho lần học đầu tiên
            initializeCardProgressForEnrolledDeck(userId, request.getDeckId());
        } else if (!DeckEnrollmentStatus.ACTIVE.equals(enrollment.getStatus())) {
            enrollment.setStatus(DeckEnrollmentStatus.ACTIVE);
        }

        return mapToResponse(repository.save(enrollment));
    }

    @Override
    @Transactional
    public DeckEnrollmentResponse updateStatus(DeckEnrollmentRequest request) {
        Long userId = getCurrentUserId();

        DeckEnrollment enrollment = repository.findByUserIdAndDeckId(userId, request.getDeckId())
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy thông tin đăng ký bộ thẻ học này."));

        if (request.getStatus() != null) {
            enrollment.setStatus(request.getStatus());
            switch (request.getStatus()) {
                case PAUSED -> enrollment.setPausedAt(LocalDateTime.now());
                case COMPLETED -> enrollment.setCompletedAt(LocalDateTime.now());
                case DROPPED -> enrollment.setDroppedAt(LocalDateTime.now());
                case ACTIVE -> {}
            }
        }
        return mapToResponse(repository.save(enrollment));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeckEnrollmentResponse> getUserEnrollList(Pageable pageable) {
        return repository.findByUserId(getCurrentUserId(), pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeckEnrollmentResponse> getReviewToday(Pageable pageable) {
        return repository.findByUserIdAndNextReviewAtLessThanEqual(getCurrentUserId(), LocalDateTime.now(), pageable)
                .map(this::mapToResponse);
    }

    private void initializeCardProgressForEnrolledDeck(Long userId, Long deckId) {
        String sql = "INSERT INTO card_progress (user_id, card_id, state, ease_factor, interval_days, repetitions, total_reviews, created_at, updated_at) " +
                "SELECT :userId, f.id, 'NEW', 2.50, 0, 0, 0, NOW(), NOW() " +
                "FROM flashcards f WHERE f.deck_id = :deckId " +
                "ON DUPLICATE KEY UPDATE updated_at = NOW()";

        entityManager.createNativeQuery(sql)
                .setParameter("userId", userId)
                .setParameter("deckId", deckId)
                .executeUpdate();
    }

    private DeckEnrollmentResponse mapToResponse(DeckEnrollment entity) {
        DeckEnrollmentResponse response = new DeckEnrollmentResponse();
        response.setId(entity.getId());
        response.setStatus(entity.getStatus());
        response.setEnrolledAt(entity.getEnrolledAt());
        response.setPausedAt(entity.getPausedAt());
        response.setCompletedAt(entity.getCompletedAt());
        response.setDroppedAt(entity.getDroppedAt());
        response.setLastStudiedAt(entity.getLastStudiedAt());
        response.setNextReviewAt(entity.getNextReviewAt());
        response.setMasteredCards(entity.getMasteredCards());
        response.setNote(entity.getNote());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
        }
        if (entity.getDeck() != null) {
            response.setDeckId(entity.getDeck().getId());
        }
        return response;
    }

    @Async
    @EventListener
    @Transactional
    public void handleCardProgressEvent(CardProgressEvent event) {
        repository.findByUserIdAndDeckId(event.getUserId(), event.getDeckId()).ifPresent(enrollment -> {
            if (!event.isWasMastered() && event.isMastered()) {
                enrollment.setMasteredCards((enrollment.getMasteredCards() != null ? enrollment.getMasteredCards() : 0) + 1);
                repository.save(enrollment);
            } else if (event.isWasMastered() && !event.isMastered()) {
                int current = enrollment.getMasteredCards() != null ? enrollment.getMasteredCards() : 0;
                enrollment.setMasteredCards(Math.max(0, current - 1));
                repository.save(enrollment);
            }
        });
    }
}