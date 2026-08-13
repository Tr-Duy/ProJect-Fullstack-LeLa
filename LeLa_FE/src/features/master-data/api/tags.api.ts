import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, TagResponse, Page } from '../../../shared/types/lela';

export const tagsApi = {
  getAll: async (params?: { page?: number; size?: number; sortBy?: string; direction?: string }): Promise<ApiResponse<Page<TagResponse>>> => {
    const res = await apiClient.get<ApiResponse<Page<TagResponse>>>('/tags', { params });
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<TagResponse>> => {
    const res = await apiClient.get<ApiResponse<TagResponse>>(`/tags/${id}`);
    return res.data;
  },
  create: async (data: { name: string }): Promise<ApiResponse<TagResponse>> => {
    const res = await apiClient.post<ApiResponse<TagResponse>>('/tags', data);
    return res.data;
  },
  update: async (id: number, data: { name: string }): Promise<ApiResponse<TagResponse>> => {
    const res = await apiClient.patch<ApiResponse<TagResponse>>(`/tags/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/tags/${id}`);
    return res.data;
  },
};
