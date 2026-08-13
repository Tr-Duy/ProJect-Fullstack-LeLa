import { apiClient } from '../../../shared/lib/api';
import type { Page } from '../../../shared/types/lela';

export const cardProgressApi = {
  getAllProgress: async (deckId: number, params?: any): Promise<Page<any>> => {
    const res = await apiClient.get<Page<any>>(`/card-progress/deck/${deckId}`, { params });
    return res.data;
  },
  getReviewCards: async (deckId: number, params?: any): Promise<Page<any>> => {
    const res = await apiClient.get<Page<any>>(`/card-progress/deck/${deckId}/review`, { params });
    return res.data;
  },
  getNewCards: async (deckId: number, params?: any): Promise<Page<any>> => {
    const res = await apiClient.get<Page<any>>(`/card-progress/deck/${deckId}/new`, { params });
    return res.data;
  }
};
