package com.lela.cardprogress;

import com.lela.cardprogress.dto.CardProgressResponse;
import com.lela.cardprogress.dto.CardProgressSummaryRepponse; // Import DTO mới
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/card-progress")
@RequiredArgsConstructor
public class CardProgressController {

    private final CardProgressService cardProgressService;
    @GetMapping("/{cardId}")
    public ResponseEntity<CardProgressResponse> getProgressDetail(@PathVariable Long cardId) {
        return ResponseEntity.ok(cardProgressService.getProgressDetail(cardId));
    }
    @GetMapping("/deck/{deckId}")
    public ResponseEntity<Page<CardProgressSummaryRepponse>> getProgressByDeck(@PathVariable Long deckId, Pageable pageable) {
        return ResponseEntity.ok(cardProgressService.getProgressByDeck(deckId, pageable));
    }

    @GetMapping("/deck/{deckId}/review")
    public ResponseEntity<Page<CardProgressSummaryRepponse>> getReviewCards(@PathVariable Long deckId, Pageable pageable) {
        return ResponseEntity.ok(cardProgressService.getReviewCards(deckId, pageable));
    }

    @GetMapping("/deck/{deckId}/new")
    public ResponseEntity<Page<CardProgressSummaryRepponse>> getNewCards(@PathVariable Long deckId, Pageable pageable) {
        return ResponseEntity.ok(cardProgressService.getNewCards(deckId, pageable));
    }

    @PostMapping("/suspend/{cardId}")
    public ResponseEntity<Void> suspendCard(@PathVariable Long cardId) {
        cardProgressService.suspendCard(cardId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset/{cardId}")
    public ResponseEntity<Void> resetProgress(@PathVariable Long cardId) {
        cardProgressService.resetProgress(cardId);
        return ResponseEntity.ok().build();
    }
}