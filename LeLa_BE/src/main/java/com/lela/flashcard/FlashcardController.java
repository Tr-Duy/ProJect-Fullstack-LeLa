package com.lela.flashcard;

import com.lela.flashcard.dto.FlashcardRequest;
import com.lela.flashcard.dto.FlashcardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @PostMapping
    public ResponseEntity<FlashcardResponse> createFlashcard(@RequestBody FlashcardRequest request) {
        FlashcardResponse response = flashcardService.createFlashcard(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/bulk")
    public ResponseEntity<java.util.List<FlashcardResponse>> bulkCreateFlashcards(@RequestBody java.util.List<FlashcardRequest> requests) {
        java.util.List<FlashcardResponse> responses = flashcardService.bulkCreateFlashcards(requests);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FlashcardResponse> updateFlashcard(@PathVariable Long id, @RequestBody FlashcardRequest request) {
        FlashcardResponse response = flashcardService.updateFlashcard(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlashcardResponse> getFlashcardById(@PathVariable Long id) {
        FlashcardResponse response = flashcardService.getFlashcardById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/deck/{deckId}")
    public ResponseEntity<Page<FlashcardResponse>> getFlashcardsByDeck(@PathVariable Long deckId, Pageable pageable) {
        Page<FlashcardResponse> responses = flashcardService.getFlashcardsByDeck(deckId, pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/tag/{tagId}")
    public ResponseEntity<Page<FlashcardResponse>> getFlashcardsByTag(@PathVariable Long tagId, Pageable pageable) {
        Page<FlashcardResponse> responses = flashcardService.getFlashcardsByTag(tagId, pageable);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long id) {
        flashcardService.deleteFlashcard(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/deck/{deckId}/reorder")
    public ResponseEntity<?> reorderFlashcards(@PathVariable Long deckId, @RequestBody java.util.List<Long> flashcardIds) {
        try {
            flashcardService.reorderFlashcards(deckId, flashcardIds);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            try {
                java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("error.log", true));
                pw.println("--- ERROR LOG ---");
                e.printStackTrace(pw);
                pw.close();
            } catch (Exception ignored) {}
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : e.toString(), "trace", java.util.Arrays.toString(e.getStackTrace())));
        }
    }
}
