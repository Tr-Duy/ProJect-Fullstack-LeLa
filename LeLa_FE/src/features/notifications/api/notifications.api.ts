import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, Page } from '../../../shared/types/lela';

export type NotificationResponse = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  status: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
};

export const notificationsApi = {
  getAll: async (params?: any): Promise<ApiResponse<Page<NotificationResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<NotificationResponse>>>('/notifications', { params });
    return res.data;
  },
  
  getAllAdmin: async (params?: any): Promise<ApiResponse<Page<NotificationResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<NotificationResponse>>>('/notifications/admin', { params });
    return res.data;
  },
  
  getUnread: async (params?: any): Promise<ApiResponse<Page<NotificationResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<NotificationResponse>>>('/notifications/unread', { params });
    return res.data;
  },
  
  markAsRead: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.patch<ApiResponse<void>>(`/notifications/${id}/read`);
    return res.data;
  },
  
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.patch<ApiResponse<void>>('/notifications/read-all');
    return res.data;
  },

  broadcast: async (data: { title: string; message: string; type?: string }): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/notifications/broadcast', data);
    return res.data;
  }
};
