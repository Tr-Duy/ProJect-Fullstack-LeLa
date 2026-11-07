import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '../utils/storage';

// ─── Color Tokens ──────────────────────────────────────────────────────────────
export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  accent: string;
  accentLight: string;
  inputBg: string;
  tabBar: string;
  tabBorder: string;
  headerGradientFrom: string;
  placeholder: string;
}

const LIGHT_COLORS: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  subtext: '#64748B',
  border: '#E2E8F0',
  accent: '#EA580C',
  accentLight: '#FFEDD5',
  inputBg: '#F8FAFC',
  tabBar: '#FFFFFF',
  tabBorder: '#F1F5F9',
  headerGradientFrom: '#EA580C',
  placeholder: '#94A3B8',
};

const DARK_COLORS: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  text: '#F1F5F9',
  subtext: '#94A3B8',
  border: '#334155',
  accent: '#EA580C',
  accentLight: '#431407',
  inputBg: '#1E293B',
  tabBar: '#1E293B',
  tabBorder: '#334155',
  headerGradientFrom: '#7C2D12',
  placeholder: '#64748B',
};

// ─── Context ───────────────────────────────────────────────────────────────────
interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleDarkMode: () => Promise<void>;
  setDarkMode: (value: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const APP_SETTINGS_KEY = 'lela_app_settings';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Load saved setting on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const raw = await storage.getItem(APP_SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.darkMode === 'boolean') {
            setIsDark(parsed.darkMode);
          }
        }
      } catch {
        // Keep default
      }
    };
    loadTheme();
  }, []);

  const setDarkMode = useCallback(async (value: boolean) => {
    setIsDark(value);
    try {
      const raw = await storage.getItem(APP_SETTINGS_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      await storage.saveItem(APP_SETTINGS_KEY, JSON.stringify({ ...existing, darkMode: value }));
    } catch {
      // Ignore write errors
    }
  }, []);

  const toggleDarkMode = useCallback(async () => {
    setIsDark((prev) => {
      const next = !prev;
      // Fire-and-forget save
      storage.getItem(APP_SETTINGS_KEY).then((raw) => {
        const existing = raw ? JSON.parse(raw) : {};
        storage.saveItem(APP_SETTINGS_KEY, JSON.stringify({ ...existing, darkMode: next })).catch(() => {});
      }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? DARK_COLORS : LIGHT_COLORS,
        toggleDarkMode,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
