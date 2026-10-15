package com.lela.study;

import com.lela.common.ApiResponse;
import com.lela.flashcard.dto.FlashcardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    @GetMapping("/decks/{deckId}/cards")
    public ApiResponse<List<FlashcardResponse>> getStudyCards(
            @PathVariable Long deckId,
            @RequestParam(required = false, defaultValue = "srs") String mode) {
        List<FlashcardResponse> cards = studyService.getStudyCards(deckId, mode);
        return ApiResponse.success(cards, "Tải danh sách thẻ học thành công");
    }
}
