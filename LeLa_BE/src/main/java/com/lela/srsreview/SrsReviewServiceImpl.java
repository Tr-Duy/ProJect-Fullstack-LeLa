package com.lela.srsreview;

import com.lela.cardprogress.CardProgressRepository;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.cardprogress.event.CardProgressEvent;
import com.lela.dailylearningactivity.DailyLearningActivityService;
import com.lela.dailylearningactivity.dto.DailyLearningActivityRequest;
import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import com.lela.reviewsession.ReviewSessionRepository;
import com.lela.reviewsession.domain.ReviewSession;
import com.lela.srsreview.domain.SrsReview;
import com.lela.cardprogress.domain.ReviewableCardState;
import com.lela.srsreview.dto.ReviewStatsResponse;
import com.lela.srsreview.dto.SrsReviewRequest;
import com.lela.srsreview.dto.SrsReviewResponse;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SrsReviewServiceImpl implements SrsReviewService {

    private final SrsReviewRepository srsReviewRepository;
    private final ReviewSessionRepository reviewSessionRepository;
    private final UsersRepository usersRepository;
    private final FlashcardRepository flashcardRepository;
    private final CardProgressRepository cardProgressRepository;
    private final ModelMapper modelMapper;
    private final DailyLearningActivityService dailyLearningActivityService;
    private final SrsAlgorithmStrategy srsAlgorithmStrategy;
    private final ApplicationEventPublisher eventPublisher;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Override
    @Transactional
    public SrsReviewResponse reviewCard(SrsReviewRequest request) {
        if (request.getClientEventId() != null && srsReviewRepository.existsByClientEventId(request.getClientEventId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Review event already processed");
        }

        ReviewSession session = null;
        if (request.getReviewSessionId() != null) {
            session = reviewSessionRepository.findById(request.getReviewSessionId())
                    .orElse(null);
        }

        Long userId = getCurrentUserId();
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Flashcard card = flashcardRepository.findById(request.getCardId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flashcard not found"));

        LocalDateTime now = LocalDateTime.now();

        // 1. Determine existing mastery state before update
        boolean wasMastered = cardProgressRepository.findByUserIdAndCardId(user.getId(), card.getId())
                .map(cp -> cp.getState() == CardProgressState.REVIEW)
                .orElse(false);

        // 2. Calculate new SRS metrics using SM-2
        CardProgress progress = updateCardProgress(user, card, request, now);

        // 3. Log the review event
        SrsReview review = new SrsReview();
        review.setReviewSession(session);
        review.setUser(user);
        review.setCard(card);
        review.setClientEventId(request.getClientEventId() != null ? request.getClientEventId() : java.util.UUID.randomUUID().toString());
        review.setRating(request.getRating());
        review.setResponseMs(request.getResponseMs());
        
        review.setPreviousState(request.getPreviousState());
        review.setNewState(progress.getState() == CardProgressState.NEW || progress.getState() == CardProgressState.LEARNING ? ReviewableCardState.LEARNING : ReviewableCardState.REVIEW);
        review.setEaseBefore(request.getEaseBefore());
        review.setEaseAfter(progress.getEaseFactor());
        review.setIntervalBefore(request.getIntervalBefore());
        review.setIntervalAfter(progress.getIntervalDays());
        review.setDueBefore(request.getDueBefore());
        review.setDueAfter(progress.getDueAt());
        review.setAlgorithmVersion("SM2_ADVANCED");
        review.setXpAwarded(request.getXpAwarded() != null ? request.getXpAwarded() : calculateXp(request.getRating()));
        review.setClientReviewedAt(request.getClientReviewedAt() != null ? request.getClientReviewedAt() : now);
        review.setServerReceivedAt(now);
        review.setReviewedAt(now);

        SrsReview saved = srsReviewRepository.save(review);

        // 4. Publish Event for async syncing (e.g. update masteredCards in DeckEnrollment)
        boolean isMastered = progress.getState() == CardProgressState.REVIEW;
        eventPublisher.publishEvent(new CardProgressEvent(this, user.getId(), card.getDeck().getId(), wasMastered, isMastered));

        // 5. Update daily xp
        DailyLearningActivityRequest activityRequest = new DailyLearningActivityRequest();
        activityRequest.setReviewCount(1);
        activityRequest.setXpEarned(saved.getXpAwarded());
        activityRequest.setActivityDate(LocalDate.now());
        dailyLearningActivityService.logActivity(activityRequest);

        SrsReviewResponse response = modelMapper.map(saved, SrsReviewResponse.class);
        if (session != null) response.setReviewSessionId(session.getId());
        response.setUserId(user.getId());
        response.setCardId(card.getId());
        return response;
    }

    private int calculateXp(Integer rating) {
        if (rating == null || rating == 1) return 2;
        if (rating == 2) return 5;
        if (rating == 3) return 10;
        return 15; // EASY
    }

    private CardProgress updateCardProgress(Users user, Flashcard card, SrsReviewRequest request, LocalDateTime now) {
        CardProgress progress = cardProgressRepository
                .findByUserIdAndCardId(user.getId(), card.getId())
                .orElseGet(() -> {
                    CardProgress cp = new CardProgress();
                    cp.setUser(user);
                    cp.setCard(card);
                    cp.setEaseFactor(new BigDecimal("2.50"));
                    cp.setIntervalDays(0);
                    cp.setRepetitions(0);
                    cp.setLearningStep(0);
                    cp.setState(CardProgressState.NEW);
                    return cp;
                });

        int rating = request.getRating() != null ? request.getRating() : 1; // 1: AGAIN, 2: HARD, 3: GOOD, 4: EASY
        
        srsAlgorithmStrategy.applySm2(progress, rating, now);

        return cardProgressRepository.save(progress);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SrsReviewResponse> getReviewHistory(Long userId, Pageable pageable) {
        Long targetUserId = (userId != null) ? userId : getCurrentUserId();

        return srsReviewRepository.findAllByUserId(targetUserId, pageable).map(r -> {
            SrsReviewResponse resp = modelMapper.map(r, SrsReviewResponse.class);
            if (r.getReviewSession() != null)
                resp.setReviewSessionId(r.getReviewSession().getId());
            if (r.getUser() != null)
                resp.setUserId(r.getUser().getId());
            if (r.getCard() != null)
                resp.setCardId(r.getCard().getId());
            return resp;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewStatsResponse getReviewStatistics(Long userId) {
        Long targetId = (userId != null) ? userId : getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();

        long todayCount = srsReviewRepository.countReviewsInPeriod(targetId, now.toLocalDate().atStartOfDay(), now);
        long weekCount = srsReviewRepository.countReviewsInPeriod(targetId, now.minusDays(7), now);

        long totalCardsLearned = cardProgressRepository.countByUserId(targetId);
        long masteredCards = cardProgressRepository.countByUserIdAndState(targetId, CardProgressState.REVIEW);

        ReviewStatsResponse stats = new ReviewStatsResponse();
        stats.setTodayReviews(todayCount);
        stats.setLast7DaysReviews(weekCount);
        stats.setTotalCardsLearned(totalCardsLearned);
        stats.setMasteredCards(masteredCards);
        
        int percentage = 0;
        if (totalCardsLearned > 0) {
            percentage = (int) Math.round((double) masteredCards / totalCardsLearned * 100);
        }
        stats.setMasteryPercentage(percentage);

        return stats;
    }
}