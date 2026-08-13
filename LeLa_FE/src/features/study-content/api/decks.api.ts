import { apiClient } from '../../../shared/lib/api';
import type { DeckResponse, Page } from '../../../shared/types/lela';

export const decksApi = {
  getAll: async (params?: { page?: number; size?: number; sortBy?: string; direction?: string; examTypeId?: number; levelId?: number }): Promise<Page<DeckResponse>> => {
    const apiParams: any = { ...params };
    if (params?.sortBy) {
      apiParams.sort = `${params.sortBy},${params.direction || 'asc'}`;
      delete apiParams.sortBy;
      delete apiParams.direction;
    }
    const res = await apiClient.get<Page<DeckResponse>>('/decks', { params: apiParams });
    return res.data;
  },
  getById: async (id: number): Promise<DeckResponse> => {
    const res = await apiClient.get<DeckResponse>(`/decks/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<DeckResponse> => {
    const res = await apiClient.post<DeckResponse>('/decks', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<DeckResponse> => {
    const res = await apiClient.patch<DeckResponse>(`/decks/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    const res = await apiClient.delete<void>(`/decks/${id}`);
    return res.data;
  },
};
