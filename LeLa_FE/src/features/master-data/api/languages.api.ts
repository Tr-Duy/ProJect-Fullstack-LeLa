import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, LanguageResponse } from '../../../shared/types/lela';

export const languagesApi = {
  getAll: async (): Promise<ApiResponse<LanguageResponse[]>> => {
    const res = await apiClient.get<ApiResponse<LanguageResponse[]>>('/languages');
    return res.data;
  },
  getById: async (id: number): Promise<ApiResponse<LanguageResponse>> => {
    const res = await apiClient.get<ApiResponse<LanguageResponse>>(`/languages/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<ApiResponse<LanguageResponse>> => {
    const res = await apiClient.post<ApiResponse<LanguageResponse>>('/languages', data);
    return res.data;
  },
  update: async (id: number, data: any): Promise<ApiResponse<LanguageResponse>> => {
    const res = await apiClient.patch<ApiResponse<LanguageResponse>>(`/languages/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/languages/${id}`);
    return res.data;
  },
};
