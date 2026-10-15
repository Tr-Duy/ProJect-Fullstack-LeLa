import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse } from '../../../shared/types/lela';

export const studyApi = {
  getStudyCards: async (deckId: number, mode?: string | null): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get<ApiResponse<any[]>>(`/study/decks/${deckId}/cards`, {
      params: mode ? { mode } : undefined,
    });
    return res.data;
  },
};
