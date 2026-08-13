import { apiClient } from '../../../shared/lib/api';
import type { ApiResponse, AuthResponse, UserInfo } from '../../../shared/types/lela';

export const authApi = {
  login: async (credentials: any): Promise<ApiResponse<AuthResponse>> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/register', data);
    return res.data;
  },
  logout: async (refreshToken: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/logout', { refreshToken });
    return res.data;
  },
  getProfile: async (): Promise<ApiResponse<UserInfo>> => {
    const res = await apiClient.get<ApiResponse<UserInfo>>('/auth/profile');
    return res.data;
  },
  checkUsername: async (username: string): Promise<boolean> => {
    const res = await apiClient.get<ApiResponse<boolean>>(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return res.data.data;
  },
  checkEmail: async (email: string): Promise<boolean> => {
    const res = await apiClient.get<ApiResponse<boolean>>(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return res.data.data;
  }
};
