package com.lela.reviewsession;

import com.lela.common.exception.NotFoundExeception;
import com.lela.deck.domain.Deck;
import com.lela.reviewsession.domain.ReviewSession;
import com.lela.reviewsession.domain.ReviewSessionStatus;
import com.lela.reviewsession.domain.ReviewSessionType;
import com.lela.reviewsession.dto.ReviewSessionRequest;
import com.lela.reviewsession.dto.ReviewSessionResponse;
import com.lela.srsreview.SrsReviewRepository;
import com.lela.srsreview.SrsReviewService;
import com.lela.srsreview.dto.ReviewEventDto;
import com.lela.srsreview.dto.SrsReviewRequest;
import com.lela.srsreview.dto.SyncReviewRequest;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewSessionServiceImpl implements ReviewSessionService {

    private final ReviewSessionRepository sessionRepository;
    private final SrsReviewRepository srsReviewRepository;
    private final EntityManager entityManager;
    private final ModelMapper modelMapper;
    private final UsersRepository usersRepository;
    private final SrsReviewService  srsReviewService;
    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional
    public ReviewSessionResponse startSession(ReviewSessionRequest request) {
        Long userId = getCurrentUserId();

        var activeSessions = sessionRepository.findActiveSessions(userId, ReviewSessionStatus.IN_PROGRESS);
        if (!activeSessions.isEmpty()) {
            throw new IllegalStateException("Bạn đang có một phiên học chưa hoàn thành!");
        }

        ReviewSession session = new ReviewSession();
        session.setPublicId(UUID.randomUUID().toString());
        session.setUser(entityManager.getReference(Users.class, userId));
        session.setDeck(entityManager.getReference(Deck.class, request.getDeckId()));

        session.setSessionType(request.getSessionType() != null ? request.getSessionType() : ReviewSessionType.REGULAR);
        session.setStatus(ReviewSessionStatus.IN_PROGRESS);
        session.setDeviceId(request.getDeviceId());
        session.setOfflineMode(request.getOfflineMode() != null ? request.getOfflineMode() : false);
        session.setStartedAt(LocalDateTime.now());

        ReviewSession savedSession = sessionRepository.save(session);
        ReviewSessionResponse response = modelMapper.map(savedSession, ReviewSessionResponse.class);

        response.setUserId(userId);
        response.setDeckId(request.getDeckId());

        return response;
    }

    @Override
    @Transactional
    public void syncOfflineReviews(SyncReviewRequest request) {
        ReviewSession session = sessionRepository.findByPublicId(request.getSessionPublicId())
                .orElseThrow(() -> new NotFoundExeception("Session không tồn tại."));

        if (!session.getUser().getId().equals(getCurrentUserId())) {
            throw new SecurityException("Không có quyền truy cập phiên này.");
        }

        for (ReviewEventDto event : request.getEvents()) {
            SrsReviewRequest srsRequest = modelMapper.map(event, SrsReviewRequest.class);
            srsRequest.setReviewSessionId(session.getId());
            srsRequest.setUserId(session.getUser().getId());

            srsReviewService.reviewCard(srsRequest);
        }

        session.setStatus(ReviewSessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSessionResponse getCurrentSession() {
        return sessionRepository.findActiveSessions(getCurrentUserId(), ReviewSessionStatus.IN_PROGRESS)
                .stream().findFirst()
                .map(s -> modelMapper.map(s, ReviewSessionResponse.class))
                .orElseThrow(() -> new NotFoundExeception("Không có phiên học đang diễn ra."));
    }

    @Override
    @Transactional
    public void abandonSession(String publicId) {
        ReviewSession session = sessionRepository.findByPublicId(publicId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy phiên."));

        if (!session.getUser().getId().equals(getCurrentUserId())) {
            throw new SecurityException("Truy cập bị từ chối.");
        }

        session.setStatus(ReviewSessionStatus.ABANDONED);
        session.setAbandonedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTodayStats() {
        LocalDateTime start = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = LocalDateTime.now();
        return Map.of("totalReviewsToday", srsReviewRepository.countReviewsInPeriod(getCurrentUserId(), start, end));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getWeeklyStats() {
        LocalDateTime start = LocalDateTime.now().minusDays(7).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = LocalDateTime.now();
        return Map.of("totalReviewsWeekly", srsReviewRepository.countReviewsInPeriod(getCurrentUserId(), start, end));
    }
}