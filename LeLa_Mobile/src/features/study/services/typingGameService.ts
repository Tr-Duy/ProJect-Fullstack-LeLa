import { apiClient, ApiResponse } from '../../../api/client';
import {
  TypingGameDeckDto,
  StartTypingRunRequest,
  TypingRunResponse,
  TypingWordEventDto,
  FinishTypingRunRequest,
  TypingRunResultResponse,
  TypingLeaderboardEntryDto,
  TypingGameMode,
} from '../../../types';

export interface FinishRunPayload {
  events?: TypingWordEventDto[];
  reason?: 'LIVES_DEPLETED' | 'VICTORY' | 'USER_QUIT' | string;
  totalTimeSeconds?: number;
  correctWords?: number;
  totalKeystrokes?: number;
}

export const typingGameService = {
  /**
   * Lấy danh sách bộ thẻ hỗ trợ chơi gõ chữ
   */
  getTypingDecks: async (): Promise<TypingGameDeckDto[]> => {
    try {
      const response = await apiClient.get<ApiResponse<TypingGameDeckDto[]>>('/typing-game/decks');
      return response.data?.data || [];
    } catch (error) {
      console.error('[typingGameService] getTypingDecks error:', error);
      throw error;
    }
  },

  /**
   * Khởi tạo lượt chơi mới
   * @param deckId ID của bộ thẻ
   * @param mode Chế độ chơi 'EASY' hoặc 'HARD' (mặc định 'EASY')
   */
  startRun: async (deckId: number, mode: string = 'EASY'): Promise<TypingRunResponse> => {
    try {
      const normalizedMode: TypingGameMode = mode === 'HARD' ? 'HARD' : 'EASY';
      const request: StartTypingRunRequest = {
        deckId,
        mode: normalizedMode,
        forceRestart: true,
        expandedChallenge: false,
      };

      const response = await apiClient.post<ApiResponse<TypingRunResponse>>(
        '/typing-game/runs',
        request
      );
      return response.data.data;
    } catch (error) {
      console.error('[typingGameService] startRun error:', error);
      throw error;
    }
  },

  /**
   * Lấy trạng thái lượt chơi theo mã publicId
   */
  getRunStatus: async (publicId: string): Promise<TypingRunResponse> => {
    try {
      const response = await apiClient.get<ApiResponse<TypingRunResponse>>(
        `/typing-game/runs/${publicId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('[typingGameService] getRunStatus error:', error);
      throw error;
    }
  },

  /**
   * Xác nhận hoàn thành mốc / màn (Stage)
   */
  completeStage: async (
    publicId: string,
    stageNo: number,
    events: TypingWordEventDto[] = []
  ): Promise<TypingRunResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<TypingRunResponse>>(
        `/typing-game/runs/${publicId}/stages/${stageNo}/complete`,
        { events }
      );
      return response.data.data;
    } catch (error) {
      console.error('[typingGameService] completeStage error:', error);
      throw error;
    }
  },

  /**
   * Nộp kết quả tổng kết lượt chơi (tính WPM, độ chính xác %, XP)
   */
  finishRun: async (
    publicId: string,
    payload: FinishRunPayload
  ): Promise<TypingRunResultResponse> => {
    try {
      const body: FinishTypingRunRequest = {
        events: payload.events || [],
        reason:
          payload.reason ||
          (payload.correctWords && payload.correctWords > 0 ? 'VICTORY' : 'LIVES_DEPLETED'),
      };

      const response = await apiClient.post<ApiResponse<TypingRunResultResponse>>(
        `/typing-game/runs/${publicId}/finish`,
        body
      );
      return response.data.data;
    } catch (error) {
      console.error('[typingGameService] finishRun error:', error);
      throw error;
    }
  },

  /**
   * Hủy lượt chơi giữa chừng khi người dùng thoát game
   */
  abandonRun: async (publicId: string): Promise<void> => {
    try {
      await apiClient.post<ApiResponse<void>>(`/typing-game/runs/${publicId}/abandon`);
    } catch (error) {
      console.warn('[typingGameService] abandonRun warning:', error);
    }
  },

  /**
   * Lấy bảng xếp hạng điểm cao
   */
  getHighScores: async (
    deckId?: number,
    mode: TypingGameMode = 'EASY'
  ): Promise<TypingLeaderboardEntryDto[]> => {
    try {
      const response = await apiClient.get<ApiResponse<TypingLeaderboardEntryDto[]>>(
        '/typing-game/high-scores',
        {
          params: { deckId: deckId || 1, mode },
        }
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('[typingGameService] getHighScores error:', error);
      return [];
    }
  },
};

