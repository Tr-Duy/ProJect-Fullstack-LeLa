import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page } from '../../../shared/types/lela';

export interface UserSubscriptionResponse {
  id: number;
  userId: number;
  planId: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscriptionRequest {
  userId?: number;
  planId: number;
  status?: string;
  autoRenew?: boolean;
  startedAt?: string;
  expiresAt?: string;
}

export const userSubscriptionsApi = {
  getAll: async (params?: any): Promise<ApiResponse<Page<UserSubscriptionResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<UserSubscriptionResponse>>>('/user-subscriptions', { params });
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<UserSubscriptionResponse>> => {
    const res = await apiClient.get<ApiResponse<UserSubscriptionResponse>>(`/user-subscriptions/${id}`);
    return res.data;
  },
  create: async (data: UserSubscriptionRequest): Promise<ApiResponse<UserSubscriptionResponse>> => {
    const res = await apiClient.post<ApiResponse<UserSubscriptionResponse>>('/user-subscriptions', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<ApiResponse<UserSubscriptionResponse>> => {
    const res = await apiClient.patch<ApiResponse<UserSubscriptionResponse>>(`/user-subscriptions/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/user-subscriptions/${id}`);
    return res.data;
  }
};
