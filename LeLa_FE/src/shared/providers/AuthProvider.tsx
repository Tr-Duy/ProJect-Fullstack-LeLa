import React, { createContext, useContext } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { AuthResponse, ApiResponse } from '../types/lela';
import { profileApi, type UserResponse } from '../../features/users/api/profile.api';
import { apiClient } from '../lib/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  isInitializingAuth: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const hasTokens = typeof window !== 'undefined' && 
    (!!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken'));

  const {
    data: profileResponse,
    refetch,
    isLoading,
    isFetching,
    isPending,
    isError,
  } = useQuery<ApiResponse<UserResponse>>({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    enabled: hasTokens,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const user = (hasTokens && !isError) ? (profileResponse?.data ?? null) : null;
  const isAuthenticated = !!user && hasTokens;

  // Initializing auth state:
  // If user has stored tokens, auth is initializing until the profile query resolves or errors out.
  const isInitializingAuth = hasTokens && (isPending || (isLoading && !profileResponse && !isError));

  const login = async (data: AuthResponse) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (apiClient.defaults.headers.common) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    }

    // Immediately populate React Query cache with returned user so UI is consistent
    try {
      queryClient.setQueryData<ApiResponse<any>>(['profile'], {
        success: true,
        data: data.user,
        message: 'Profile set from login response',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('setQueryData failed in login', e);
    }

    // Ensure a fresh fetch in background
    try {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refetch();
    } catch (e) {
      console.error('Failed to refetch profile after login', e);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (e) {
        console.warn('Logout endpoint call failed', e);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (apiClient.defaults.headers.common) {
      delete apiClient.defaults.headers.common['Authorization'];
    }

    queryClient.setQueryData(['profile'], null);
    queryClient.removeQueries({ queryKey: ['profile'] });
    queryClient.clear();
  };

  const refreshUser = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refetch();
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user || !isAuthenticated) return false;

    const userRoles = Array.isArray(user.roles)
      ? user.roles
      : (typeof (user as any).role === 'string' ? [(user as any).role] : []);

    if (userRoles.length === 0) return false;

    return userRoles.some((r: string) => roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isProfileLoading: isFetching || isLoading,
        isInitializingAuth,
        login,
        logout,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
