import { apiClient } from '../../../api/client';
import { storage } from '../../../utils/storage';
import { ApiResponse, UserInfo } from '../../../types';

export interface UpdateProfilePayload {
  fullName?: string;
  targetLanguage?: string;
  targetLanguageId?: number;
  dailyGoalCards?: number;
  timezone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface AppSettingsState {
  darkMode: boolean;
  soundEffects: boolean;
  autoPronounce: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettingsState = {
  darkMode: false,
  soundEffects: true,
  autoPronounce: true,
  hapticFeedback: true,
};

const APP_SETTINGS_STORAGE_KEY = 'lela_app_settings';

export const profileService = {
  /**
   * Lấy thông tin cá nhân hiện tại từ Backend
   */
  async getProfile(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<ApiResponse<UserInfo>>('/profile');
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return (response.data as unknown) as UserInfo;
    } catch {
      // Fallback endpoint nếu cần
      const fallback = await apiClient.get<ApiResponse<UserInfo>>('/auth/profile');
      return fallback.data.data;
    }
  },

  /**
   * Cập nhật thông tin hồ sơ cá nhân (Họ tên, Mục tiêu học, Ngôn ngữ mục tiêu)
   * Hỗ trợ cả PUT /profile và PATCH /profile
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<UserInfo> {
    const requestData: Record<string, unknown> = {
      fullName: payload.fullName,
      dailyGoalCards: payload.dailyGoalCards,
      timezone: payload.timezone,
      avatarUrl: payload.avatarUrl,
    };

    if (payload.targetLanguageId) {
      requestData.targetLanguageId = payload.targetLanguageId;
    }

    try {
      // Thử gọi PUT /profile theo đúng đặc tả REST API
      const response = await apiClient.put<ApiResponse<UserInfo>>('/profile', requestData);
      return response.data.data || ((response.data as unknown) as UserInfo);
    } catch (putError) {
      // Fallback thử gọi PATCH /profile hoặc PATCH /auth/profile
      try {
        const patchRes = await apiClient.patch<ApiResponse<UserInfo>>('/profile', requestData);
        return patchRes.data.data || ((patchRes.data as unknown) as UserInfo);
      } catch {
        const authPatch = await apiClient.patch<ApiResponse<UserInfo>>('/auth/profile', requestData);
        return authPatch.data.data || ((authPatch.data as unknown) as UserInfo);
      }
    }
  },

  /**
   * Đổi mật khẩu tài khoản bảo mật
   * Gọi PUT /auth/change-password với body { oldPassword, newPassword }
   */
  async changePassword(payload: ChangePasswordPayload): Promise<string> {
    try {
      const response = await apiClient.put<ApiResponse<void>>('/auth/change-password', {
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      });
      return response.data?.message || 'Đổi mật khẩu thành công';
    } catch (err: any) {
      // Trích xuất thông báo lỗi chính xác từ Backend nếu có
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      throw new Error(serverMessage);
    }
  },

  /**
   * Lấy danh sách ngôn ngữ được hỗ trợ từ Backend
   */
  async getLanguages(): Promise<{ id: number; code: string; name: string }[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ id: number; code: string; name: string }[]>>('/languages');
      if (response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch (e) {
      console.warn('[profileService] Lỗi lấy danh sách ngôn ngữ từ server:', e);
    }
    return [
      { id: 1, code: 'en', name: 'Tiếng Anh (English)' },
      { id: 2, code: 'ja', name: 'Tiếng Nhật (Japanese)' },
      { id: 3, code: 'ko', name: 'Tiếng Hàn (Korean)' },
      { id: 4, code: 'zh', name: 'Tiếng Trung (Chinese)' },
    ];
  },

  /**
   * Lấy cấu hình ứng dụng từ bộ nhớ thiết bị (Dark mode, Sound Effects...)
   */
  async getAppSettings(): Promise<AppSettingsState> {
    try {
      const json = await storage.getItem(APP_SETTINGS_STORAGE_KEY);
      if (json) {
        return {
          ...DEFAULT_APP_SETTINGS,
          ...JSON.parse(json),
        };
      }
    } catch (e) {
      console.warn('[profileService] Lỗi đọc cài đặt ứng dụng:', e);
    }
    return DEFAULT_APP_SETTINGS;
  },

  /**
   * Lưu cấu hình ứng dụng vào bộ nhớ thiết bị
   */
  async saveAppSettings(settings: AppSettingsState): Promise<void> {
    try {
      await storage.saveItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('[profileService] Lỗi lưu cài đặt ứng dụng:', e);
      throw e;
    }
  },
};

export default profileService;
