package com.lela.typinggame;

import com.lela.typinggame.domain.TypingGameMode;
import com.lela.typinggame.dto.CompleteStageRequest;
import com.lela.typinggame.dto.FinishTypingRunRequest;
import com.lela.typinggame.dto.StartTypingRunRequest;
import com.lela.typinggame.dto.TypingGameDeckDto;
import com.lela.typinggame.dto.TypingLeaderboardEntryDto;
import com.lela.typinggame.dto.TypingRunResponse;
import com.lela.typinggame.dto.TypingRunResultResponse;

import java.util.List;

public interface TypingGameService {

    List<TypingGameDeckDto> getDecks();

    TypingRunResponse startRun(StartTypingRunRequest request);

    TypingRunResponse getRun(String publicId);

    TypingRunResponse completeStage(String publicId, Integer stageNo, CompleteStageRequest request);

    TypingRunResultResponse finishRun(String publicId, FinishTypingRunRequest request);

    void abandonRun(String publicId);

    List<TypingLeaderboardEntryDto> getHighScores(Long deckId, TypingGameMode mode);
}
