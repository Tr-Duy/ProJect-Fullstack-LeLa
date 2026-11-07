import { apiClient } from '../../../api/client';
import { storage } from '../../../utils/storage';
import { ApiResponse, AuthResponse, UserInfo } from '../../../types';

export interface LoginParams {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  nativeLanguageId?: number;
  targetLanguageId?: number;
}

export const authService = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', params);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Đăng nhập thất bại');
    }
    const authData = res.data.data;
    await storage.saveTokens(authData.accessToken, authData.refreshToken);
    await storage.saveUserData(authData.user);
    return authData;
  },

  register: async (params: RegisterParams): Promise<void> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/register', params);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Đăng ký thất bại');
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await storage.clearAll();
    }
  },

  getProfile: async (): Promise<UserInfo> => {
    const res = await apiClient.get<ApiResponse<UserInfo>>('/profile');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể lấy thông tin người dùng');
    }
    const user = res.data.data;
    await storage.saveUserData(user);
    return user;
  },

  checkUsername: async (username: string): Promise<boolean> => {
    const res = await apiClient.get<ApiResponse<boolean>>('/auth/check-username', {
      params: { username },
    });
    return res.data?.data ?? false;
  },

  checkEmail: async (email: string): Promise<boolean> => {
    const res = await apiClient.get<ApiResponse<boolean>>('/auth/check-email', {
      params: { email },
    });
    return res.data?.data ?? false;
  },
};

