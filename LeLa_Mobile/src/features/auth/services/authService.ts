import * as WebBrowser from 'expo-web-browser';
import { apiClient, ApiResponse } from '../../../api/client';
import { API_BASE_URL } from '../../../constants/config';
import { AuthResponse } from '../../../types';

// Hoàn tất phiên WebBrowser nếu có redirect dang dở
WebBrowser.maybeCompleteAuthSession();

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  timezone?: string;
  nativeLanguageId?: number;
  targetLanguageId?: number;
  dailyGoalCards?: number;
}

export const authService = {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/auth/register', {
      username: payload.username.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      fullName: payload.fullName?.trim() || payload.username.trim(),
      timezone: payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
      nativeLanguageId: payload.nativeLanguageId || 2, // Tiếng Việt
      targetLanguageId: payload.targetLanguageId || 1, // Tiếng Anh
      dailyGoalCards: payload.dailyGoalCards || 20,
    });
    return res.data;
  },

  /**
   * Kiểm tra trùng lặp Tên đăng nhập
   */
  async checkUsername(username: string): Promise<boolean> {
    try {
      const res = await apiClient.get<ApiResponse<boolean>>(
        `/auth/check-username?username=${encodeURIComponent(username.trim())}`
      );
      return Boolean(res.data?.data);
    } catch {
      return false;
    }
  },

  /**
   * Kiểm tra trùng lặp Email
   */
  async checkEmail(email: string): Promise<boolean> {
    try {
      const res = await apiClient.get<ApiResponse<boolean>>(
        `/auth/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
      return Boolean(res.data?.data);
    } catch {
      return false;
    }
  },

  /**
   * Đổi mã ủy quyền OAuth2 một lần lấy token & thông tin tài khoản
   */
  async exchangeOAuth2Code(code: string): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/oauth2/exchange', { code });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Không thể đổi mã xác thực Google OAuth2');
  },

  /**
   * Luồng đăng nhập nhanh bằng Google qua WebBrowser & OAuth2 Backend
   */
  async loginWithGoogle(): Promise<AuthResponse | null> {
    const redirectUri = 'com.lela.mobile://auth/callback';
    
    // Tạo URL ủy quyền Google từ Backend
    const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    // Ưu tiên endpoint mobile chuyên dụng để gắn redirect_uri vào session
    const authUrl = `${cleanBaseUrl}/auth/oauth2/mobile/google?redirectUri=${encodeURIComponent(redirectUri)}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Trích xuất mã xác thực một lần code từ Callback URL
        const urlMatch = result.url.match(/[?&]code=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
          const code = decodeURIComponent(urlMatch[1]);
          return await this.exchangeOAuth2Code(code);
        }
        throw new Error('Không tìm thấy mã xác thực trả về từ máy chủ Google');
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return null; // Người dùng chủ động đóng popup
      }

      return null;
    } catch (error: any) {
      console.error('[authService] Lỗi xác thực Google OAuth2:', error);
      throw error;
    }
  },
};

export default authService;

