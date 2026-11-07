import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { storage } from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string | null;
}

const resolvedBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || API_BASE_URL;

export const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ==========================================
// 1. REQUEST INTERCEPTOR: Inject Bearer Token
// ==========================================
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublicAuthEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh-token') ||
      config.url?.includes('/auth/check-username') ||
      config.url?.includes('/auth/check-email') ||
      config.url?.includes('/auth/oauth2/exchange') ||
      config.url?.includes('/health');

    if (!isPublicAuthEndpoint) {
      const accessToken = await storage.getAccessToken();
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } else {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ====================================================
// 2. RESPONSE INTERCEPTOR: Handle 401 & Auto-Refresh
// ====================================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh-token') ||
      originalRequest?.url?.includes('/auth/oauth2/exchange');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        await storage.clearTokens();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        const responseData = refreshResponse.data;
        if (responseData.success && responseData.data?.accessToken) {
          const newAccessToken = responseData.data.accessToken;
          await storage.setAccessToken(newAccessToken);

          if (responseData.data.refreshToken) {
            await storage.setRefreshToken(responseData.data.refreshToken);
          }

          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token response invalid');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await storage.clearTokens();
        delete apiClient.defaults.headers.common.Authorization;
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==========================================
// 3. HEALTH CHECK HELPER
// ==========================================
export const checkBackendHealth = async (): Promise<{
  ok: boolean;
  status: number;
  message: string;
  data?: any;
}> => {
  try {
    const startTime = Date.now();
    const response = await apiClient.get<Record<string, string>>('/health');
    const latency = Date.now() - startTime;
    return {
      ok: true,
      status: response.status,
      message: `Kết nối thành công (${latency}ms)`,
      data: response.data,
    };
  } catch (error: any) {
    const status = error.response?.status || 0;
    const msg = error.message || 'Không thể kết nối đến máy chủ';
    return {
      ok: false,
      status,
      message: msg,
    };
  }
};

