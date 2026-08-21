package com.lela.deck;

import com.lela.deck.dto.DeckRequest;
import com.lela.deck.dto.DeckResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @PostMapping
    public ResponseEntity<DeckResponse> createDeck(@RequestBody DeckRequest request) {
        DeckResponse response = deckService.createDeck(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DeckResponse> updateDeck(@PathVariable Long id, @RequestBody DeckRequest request) {
        DeckResponse response = deckService.updateDeck(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponse> getDeckById(@PathVariable Long id) {
        DeckResponse response = deckService.getDeckById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<DeckResponse>> getAllDecks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long examTypeId,
            @RequestParam(required = false) Long levelId,
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) com.lela.deck.domain.DeckDifficulty difficulty,
            @RequestParam(required = false) com.lela.deck.domain.DeckStatus status,
            @RequestParam(required = false) com.lela.deck.domain.DeckVisibility visibility,
            Pageable pageable) {
        Page<DeckResponse> responses = deckService.getAllDecks(search, examTypeId, levelId, topicId, tagId, difficulty, status, visibility, pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<Page<DeckResponse>> getDecksByOwner(
            @PathVariable Long ownerId,
            @RequestParam(required = false) Long examTypeId,
            @RequestParam(required = false) Long levelId,
            Pageable pageable) {
        Page<DeckResponse> responses = deckService.getDecksByOwner(ownerId, examTypeId, levelId, pageable);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id) {
        deckService.deleteDeck(id);
        return ResponseEntity.noContent().build();
    }
}
