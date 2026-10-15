import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse } from '../../../shared/types/lela';
import type {
  TypingGameDeckDto,
  StartTypingRunRequest,
  TypingRunResponse,
  CompleteStageRequest,
  FinishTypingRunRequest,
  TypingRunResultResponse,
  TypingLeaderboardEntryDto,
  TypingGameMode,
} from '../types/typingGame.types';

export const typingGameApi = {
  getDecks: async (): Promise<ApiResponse<TypingGameDeckDto[]>> => {
    const res = await apiClient.get<ApiResponse<TypingGameDeckDto[]>>('/typing-game/decks');
    return res.data;
  },

  startRun: async (data: StartTypingRunRequest): Promise<ApiResponse<TypingRunResponse>> => {
    const res = await apiClient.post<ApiResponse<TypingRunResponse>>('/typing-game/runs', data);
    return res.data;
  },

  getRun: async (publicId: string): Promise<ApiResponse<TypingRunResponse>> => {
    const res = await apiClient.get<ApiResponse<TypingRunResponse>>(`/typing-game/runs/${publicId}`);
    return res.data;
  },

  completeStage: async (
    publicId: string,
    stageNo: number,
    data: CompleteStageRequest
  ): Promise<ApiResponse<TypingRunResponse>> => {
    const res = await apiClient.post<ApiResponse<TypingRunResponse>>(
      `/typing-game/runs/${publicId}/stages/${stageNo}/complete`,
      data
    );
    return res.data;
  },

  finishRun: async (
    publicId: string,
    data: FinishTypingRunRequest
  ): Promise<ApiResponse<TypingRunResultResponse>> => {
    const res = await apiClient.post<ApiResponse<TypingRunResultResponse>>(
      `/typing-game/runs/${publicId}/finish`,
      data
    );
    return res.data;
  },

  abandonRun: async (publicId: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>(`/typing-game/runs/${publicId}/abandon`);
    return res.data;
  },

  getHighScores: async (
    deckId: number,
    mode: TypingGameMode
  ): Promise<ApiResponse<TypingLeaderboardEntryDto[]>> => {
    const res = await apiClient.get<ApiResponse<TypingLeaderboardEntryDto[]>>(
      `/typing-game/high-scores`,
      { params: { deckId, mode } }
    );
    return res.data;
  },
};
