import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page } from '../../../shared/types/lela';

export const leaderboardsApi = {
  getTop: async (params?: any): Promise<ApiResponse<Page<any>>> => {
    const res = await apiClient.get<ApiResponse<Page<any>>>('/leaderboards/top', { params });
    return res.data;
  },
  getDaily: async (params?: any): Promise<ApiResponse<Page<any>>> => {
    const res = await apiClient.get<ApiResponse<Page<any>>>('/leaderboards/daily', { params });
    return res.data;
  },
  getWeekly: async (params?: any): Promise<ApiResponse<Page<any>>> => {
    const res = await apiClient.get<ApiResponse<Page<any>>>('/leaderboards/weekly', { params });
    return res.data;
  },
  getMonthly: async (params?: any): Promise<ApiResponse<Page<any>>> => {
    const res = await apiClient.get<ApiResponse<Page<any>>>('/leaderboards/monthly', { params });
    return res.data;
  },
  getMe: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/leaderboards/me');
    return res.data;
  },
};
