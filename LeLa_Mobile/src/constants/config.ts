import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api/v1',
  ios: 'http://localhost:8080/api/v1',
  default: 'http://localhost:8080/api/v1',
});

// Ưu tiên đọc biến môi trường từ .env (Expo SDK 49+)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEV_API_URL;

export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'lela_mobile_access_token',
  REFRESH_TOKEN: 'lela_mobile_refresh_token',
  USER_DATA: 'lela_mobile_user_data',
} as const;

