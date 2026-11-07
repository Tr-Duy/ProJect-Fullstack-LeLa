import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '../../../utils/storage';
import { apiClient, ApiResponse } from '../../../api/client';
import { UserInfo, AuthResponse } from '../../../types';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  loginWithAuthResponse: (authData: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch (error) {
      console.warn('[AuthContext] Error sending logout request to backend:', error);
    } finally {
      await storage.clearAll();
      setUser(null);
      setToken(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<UserInfo>>('/profile');
      if (response.data.success && response.data.data) {
        const freshUser = response.data.data;
        setUser(freshUser);
        await storage.saveUserData(freshUser);
      }
    } catch (error: any) {
      console.error('[AuthContext] Error refreshing user profile:', error);
      if (error?.response?.status === 401) {
        await logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await storage.getAccessToken();
        const storedUser = await storage.getUserData<UserInfo>();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }
          // Gọi ngầm cập nhật profile mới nhất từ backend
          try {
            const response = await apiClient.get<ApiResponse<UserInfo>>('/profile');
            if (response.data.success && response.data.data) {
              const freshUser = response.data.data;
              setUser(freshUser);
              await storage.saveUserData(freshUser);
            }
          } catch (syncError: any) {
            if (syncError?.response?.status === 401) {
              await logout();
            }
          }
        }
      } catch (initError) {
        console.error('[AuthContext] Initialization error:', initError);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      usernameOrEmail: usernameOrEmail.trim(),
      password: password.trim(),
    });

    const data = response.data;
    if (data.success && data.data) {
      const { accessToken, refreshToken, user: loggedInUser } = data.data;
      await storage.saveTokens(accessToken, refreshToken);
      await storage.saveUserData(loggedInUser);
      setToken(accessToken);
      setUser(loggedInUser);
    } else {
      throw new Error(data.message || 'Đăng nhập không thành công');
    }
  };

  const loginWithAuthResponse = async (authData: AuthResponse): Promise<void> => {
    const { accessToken, refreshToken, user: loggedInUser } = authData;
    await storage.saveTokens(accessToken, refreshToken);
    await storage.saveUserData(loggedInUser);
    setToken(accessToken);
    setUser(loggedInUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithAuthResponse,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

