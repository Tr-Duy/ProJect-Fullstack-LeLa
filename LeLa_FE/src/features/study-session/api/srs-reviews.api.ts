import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse } from '../../../shared/types/lela';

export const srsReviewsApi = {
  reviewCard: async (data: any): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/srs-reviews', data);
    return res.data;
  },
  getHistory: async (params?: any): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/srs-reviews/history', { params });
    return res.data;
  },
  getStatistics: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/srs-reviews/statistics');
    return res.data;
  },
};
