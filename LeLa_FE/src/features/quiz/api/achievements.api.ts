import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, AchievementResponse, UserAchievementProgressResponse } from '../../../shared/types/lela';

export const achievementsApi = {
  getMyProgress: async (): Promise<ApiResponse<UserAchievementProgressResponse[]>> => {
    const res = await apiClient.get<ApiResponse<UserAchievementProgressResponse[]>>('/achievements/my-progress');
    return res.data;
  },

  getAllAdmin: async (): Promise<ApiResponse<AchievementResponse[]>> => {
    const res = await apiClient.get<ApiResponse<AchievementResponse[]>>('/admin/achievements');
    return res.data;
  },

  createAdmin: async (data: {
    code: string;
    title: string;
    description?: string;
    iconUrl?: string;
    category: string;
    conditionType: string;
    conditionValue: number;
    xpReward: number;
    isActive?: boolean;
  }): Promise<ApiResponse<AchievementResponse>> => {
    const res = await apiClient.post<ApiResponse<AchievementResponse>>('/admin/achievements', data);
    return res.data;
  },

  updateAdmin: async (id: number, data: {
    code: string;
    title: string;
    description?: string;
    iconUrl?: string;
    category: string;
    conditionType: string;
    conditionValue: number;
    xpReward: number;
    isActive?: boolean;
  }): Promise<ApiResponse<AchievementResponse>> => {
    const res = await apiClient.put<ApiResponse<AchievementResponse>>(`/admin/achievements/${id}`, data);
    return res.data;
  },

  toggleActiveAdmin: async (id: number): Promise<ApiResponse<AchievementResponse>> => {
    const res = await apiClient.patch<ApiResponse<AchievementResponse>>(`/admin/achievements/${id}/toggle-active`);
    return res.data;
  },
};
