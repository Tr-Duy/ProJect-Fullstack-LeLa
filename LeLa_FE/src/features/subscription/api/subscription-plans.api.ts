import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, SubscriptionPlanResponse } from '../../../shared/types/lela';

export const subscriptionPlansApi = {
  getAll: async (): Promise<ApiResponse<SubscriptionPlanResponse[]>> => {
    const res = await apiClient.get<ApiResponse<SubscriptionPlanResponse[]>>('/subscription-plans');
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<SubscriptionPlanResponse>> => {
    const res = await apiClient.get<ApiResponse<SubscriptionPlanResponse>>(`/subscription-plans/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<ApiResponse<SubscriptionPlanResponse>> => {
    const res = await apiClient.post<ApiResponse<SubscriptionPlanResponse>>('/subscription-plans', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<ApiResponse<SubscriptionPlanResponse>> => {
    const res = await apiClient.patch<ApiResponse<SubscriptionPlanResponse>>(`/subscription-plans/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/subscription-plans/${id}`);
    return res.data;
  }
};
