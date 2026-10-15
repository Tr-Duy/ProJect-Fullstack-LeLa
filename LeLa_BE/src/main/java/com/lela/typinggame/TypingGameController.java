package com.lela.typinggame;

import com.lela.common.ApiResponse;
import com.lela.typinggame.domain.TypingGameMode;
import com.lela.typinggame.dto.CompleteStageRequest;
import com.lela.typinggame.dto.FinishTypingRunRequest;
import com.lela.typinggame.dto.StartTypingRunRequest;
import com.lela.typinggame.dto.TypingGameDeckDto;
import com.lela.typinggame.dto.TypingLeaderboardEntryDto;
import com.lela.typinggame.dto.TypingRunResponse;
import com.lela.typinggame.dto.TypingRunResultResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/typing-game")
@RequiredArgsConstructor
public class TypingGameController {

    private final TypingGameService typingGameService;

    @GetMapping("/decks")
    public ResponseEntity<ApiResponse<List<TypingGameDeckDto>>> getDecks() {
        List<TypingGameDeckDto> response = typingGameService.getDecks();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/runs")
    public ResponseEntity<ApiResponse<TypingRunResponse>> startRun(
            @Valid @RequestBody StartTypingRunRequest request
    ) {
        TypingRunResponse response = typingGameService.startRun(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Bắt đầu lượt chơi thành công"));
    }

    @GetMapping("/runs/{publicId}")
    public ResponseEntity<ApiResponse<TypingRunResponse>> getRun(
            @PathVariable("publicId") String publicId
    ) {
        TypingRunResponse response = typingGameService.getRun(publicId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/runs/{publicId}/stages/{stageNo}/complete")
    public ResponseEntity<ApiResponse<TypingRunResponse>> completeStage(
            @PathVariable("publicId") String publicId,
            @PathVariable("stageNo") Integer stageNo,
            @Valid @RequestBody CompleteStageRequest request
    ) {
        TypingRunResponse response = typingGameService.completeStage(publicId, stageNo, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Hoàn thành mốc thành công"));
    }

    @PostMapping("/runs/{publicId}/finish")
    public ResponseEntity<ApiResponse<TypingRunResultResponse>> finishRun(
            @PathVariable("publicId") String publicId,
            @Valid @RequestBody FinishTypingRunRequest request
    ) {
        TypingRunResultResponse response = typingGameService.finishRun(publicId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Kết thúc lượt chơi thành công"));
    }

    @PostMapping("/runs/{publicId}/abandon")
    public ResponseEntity<ApiResponse<Void>> abandonRun(
            @PathVariable("publicId") String publicId
    ) {
        typingGameService.abandonRun(publicId);
        return ResponseEntity.ok(ApiResponse.successMessage("Đã hủy lượt chơi"));
    }

    @GetMapping("/high-scores")
    public ResponseEntity<ApiResponse<List<TypingLeaderboardEntryDto>>> getHighScores(
            @RequestParam("deckId") Long deckId,
            @RequestParam("mode") TypingGameMode mode
    ) {
        List<TypingLeaderboardEntryDto> response = typingGameService.getHighScores(deckId, mode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
