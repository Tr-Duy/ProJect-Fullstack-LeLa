import { apiClient } from '../../../api/client';
import { ApiResponse, FlashcardResponse, SrsReviewRequest, SrsReviewResponse } from '../../../types';

export const studyService = {
  getStudyCards: async (deckId: number, mode = 'srs'): Promise<FlashcardResponse[]> => {
    const res = await apiClient.get<ApiResponse<FlashcardResponse[]>>(`/study/decks/${deckId}/cards`, {
      params: { mode },
    });
    return res.data?.data || [];
  },

  submitReview: async (request: SrsReviewRequest): Promise<SrsReviewResponse> => {
    const res = await apiClient.post<ApiResponse<SrsReviewResponse>>('/srs-reviews', request);
    return res.data.data;
  },

  getReviewStatistics: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/srs-reviews/statistics');
    return res.data?.data;
  },
};

