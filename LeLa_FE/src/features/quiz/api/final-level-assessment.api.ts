import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, FinalLevelAssessmentResponse } from '../../../shared/types/lela';

export const finalLevelAssessmentApi = {
  getOverview: async (): Promise<ApiResponse<FinalLevelAssessmentResponse>> => {
    const res = await apiClient.get<ApiResponse<FinalLevelAssessmentResponse>>('/final-level-tests');
    return res.data;
  },
  resetCycle: async (): Promise<ApiResponse<FinalLevelAssessmentResponse>> => {
    const res = await apiClient.post<ApiResponse<FinalLevelAssessmentResponse>>('/final-level-tests/reset-cycle');
    return res.data;
  },
  simulateCompleteDeck: async (deckId: number): Promise<ApiResponse<FinalLevelAssessmentResponse>> => {
    const res = await apiClient.post<ApiResponse<FinalLevelAssessmentResponse>>(`/final-level-tests/complete-deck/${deckId}`);
    return res.data;
  }
};
