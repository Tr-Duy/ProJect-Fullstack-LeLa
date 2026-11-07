import * as SecureStore from 'expo-secure-store';
import { TOKEN_STORAGE_KEYS } from '../constants/config';

export const storage = {
  saveItem: async (key: string, value: string): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`[SecureStore] Error saving key "${key}":`, error);
      return false;
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] Error reading key "${key}":`, error);
      return null;
    }
  },

  deleteItem: async (key: string): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`[SecureStore] Error deleting key "${key}":`, error);
      return false;
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken: async (token: string): Promise<boolean> => {
    return await storage.saveItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await storage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: async (token: string): Promise<boolean> => {
    return await storage.saveItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  saveTokens: async (accessToken: string, refreshToken?: string): Promise<boolean> => {
    const accessOk = await storage.setAccessToken(accessToken);
    let refreshOk = true;
    if (refreshToken) {
      refreshOk = await storage.setRefreshToken(refreshToken);
    }
    return accessOk && refreshOk;
  },

  clearTokens: async (): Promise<void> => {
    await storage.deleteItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    await storage.deleteItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  },

  saveUserData: async (userData: unknown): Promise<boolean> => {
    try {
      const jsonValue = JSON.stringify(userData);
      return await storage.saveItem(TOKEN_STORAGE_KEYS.USER_DATA, jsonValue);
    } catch (error) {
      console.error('[SecureStore] Error serializing user data:', error);
      return false;
    }
  },

  getUserData: async <T>(): Promise<T | null> => {
    try {
      const raw = await storage.getItem(TOKEN_STORAGE_KEYS.USER_DATA);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error('[SecureStore] Error parsing user data:', error);
      return null;
    }
  },

  clearAll: async (): Promise<void> => {
    await storage.clearTokens();
    await storage.deleteItem(TOKEN_STORAGE_KEYS.USER_DATA);
  },

  // Generic helpers used by ThemeContext / other settings
  getString: async (key: string): Promise<string | null> => {
    return await storage.getItem(key);
  },

  setString: async (key: string, value: string): Promise<boolean> => {
    return await storage.saveItem(key, value);
  },
};

