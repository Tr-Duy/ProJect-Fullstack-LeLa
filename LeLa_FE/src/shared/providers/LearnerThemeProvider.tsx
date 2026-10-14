import { ConfigProvider } from 'antd';
import React from 'react';

export const editorialJournalTheme = {
  token: {
    colorPrimary: '#1D5CFF', // LeLa Brand Blue
    colorSuccess: '#00C896', // Mint
    colorWarning: '#FFD60A', // Sun Yellow
    colorError: '#FF5A4E', // Coral Red
    colorInfo: '#1D5CFF',
    colorTextBase: '#0F1729', // Ink
    colorBgBase: '#FFFFFF', // Card White
    colorBgLayout: '#F5F1E8', // Paper
    borderRadius: 10,
    lineWidth: 2,
    colorBorder: '#0F1729', // Ink Border
    fontFamily: '"Be Vietnam Pro", -apple-system, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 44,
      fontWeight: '600',
      defaultBg: '#FFFFFF',
      defaultColor: '#0F1729',
      defaultBorderColor: '#0F1729',
      primaryColor: '#FFFFFF',
    },
    Input: {
      controlHeight: 44,
    },
    Select: {
      controlHeight: 44,
    },
  },
};

export function LearnerThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={editorialJournalTheme} wave={{ disabled: true }}>
      {children}
    </ConfigProvider>
  );
}
