package com.lela.cardprogress;

import com.lela.auth.JwtService;
import com.lela.cardprogress.domain.CardProgress;
import com.lela.cardprogress.domain.CardProgressState;
import com.lela.cardprogress.domain.ReviewableCardState;
import com.lela.cardprogress.dto.CardProgressResponse;
import com.lela.cardprogress.dto.CardProgressSummaryRepponse;
import com.lela.common.exception.NotFoundExeception;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CardProgressServiceImpl implements CardProgressService {

    private final CardProgressRepository repository;
    private final ModelMapper modelMapper;
    private final JwtService jwtService;
    private final HttpServletRequest request;

    private Long getCurrentUserId() {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtService.parseClaims(token).get("userId", Long.class);
        }
        throw new IllegalStateException("Không tìm thấy thông tin xác thực");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CardProgressSummaryRepponse> getProgressByDeck(Long deckId, Pageable pageable) {
        return repository.findByUserIdAndDeckId(getCurrentUserId(), deckId, pageable)
                .map(this::mapToSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CardProgressSummaryRepponse> getReviewCards(Long deckId, Pageable pageable) {
        return repository.findReviewCards(getCurrentUserId(), deckId, LocalDateTime.now(), pageable)
                .map(this::mapToSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CardProgressSummaryRepponse> getNewCards(Long deckId, Pageable pageable) {
        return repository.findNewCards(getCurrentUserId(), deckId, CardProgressState.NEW, pageable)
                .map(this::mapToSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public CardProgressResponse getProgressDetail(Long cardId) {
        CardProgress progress = getProgressOrThrow(cardId);
        return mapToResponse(progress);
    }

    @Override
    @Transactional
    public void suspendCard(Long cardId) {
        CardProgress progress = getProgressOrThrow(cardId);
        try {
            progress.setSuspendedFromState(ReviewableCardState.valueOf(progress.getState().name()));
        } catch (IllegalArgumentException e) {
            progress.setSuspendedFromState(ReviewableCardState.REVIEW);
        }
        progress.setState(CardProgressState.SUSPENDED);
        progress.setIntervalDays(CardProgressConstants.SUSPENDED_INTERVAL_DAYS);
        repository.save(progress);
    }

    @Override
    @Transactional
    public void resetProgress(Long cardId) {
        CardProgress progress = getProgressOrThrow(cardId);
        progress.setState(CardProgressState.NEW);
        progress.setEaseFactor(CardProgressConstants.DEFAULT_EASE_FACTOR);
        progress.setIntervalDays(0);
        progress.setRepetitions(0);
        progress.setLapseCount(0);
        progress.setLearningStep(0);
        progress.setScheduledDays(0);
        progress.setElapsedDays(0);
        progress.setDueAt(null);
        progress.setLastReviewedAt(null);
        progress.setLastRating(null);
        progress.setTotalReviews(0);
        progress.setCorrectCount(0);
        progress.setAgainCount(0);
        progress.setHardCount(0);
        progress.setGoodCount(0);
        progress.setEasyCount(0);
        progress.setAlgorithmVersion(CardProgressConstants.DEFAULT_ALGORITHM_VERSION);
        repository.save(progress);
    }

    private CardProgress getProgressOrThrow(Long cardId) {
        return repository.findByUserIdAndCardId(getCurrentUserId(), cardId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy dữ liệu tiến độ thẻ bài."));
    }

    private CardProgressSummaryRepponse mapToSummary(CardProgress entity) {
        return new CardProgressSummaryRepponse(
                entity.getId(),
                entity.getCard() != null ? entity.getCard().getId() : null,
                entity.getState(),
                entity.getDueAt(),
                entity.getUpdatedAt()
        );
    }

    private CardProgressResponse mapToResponse(CardProgress entity) {
        CardProgressResponse response = modelMapper.map(entity, CardProgressResponse.class);
        if (entity.getUser() != null) response.setUserId(entity.getUser().getId());
        if (entity.getCard() != null) response.setCardId(entity.getCard().getId());
        return response;
    }
}