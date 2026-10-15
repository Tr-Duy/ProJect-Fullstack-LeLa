import { ConfigProvider } from 'antd';
import React from 'react';

export const friendlyClassroomTheme = {
  token: {
    colorPrimary: '#F97316',
    colorLink: '#C2410C',
    colorLinkHover: '#EA580C',
    colorLinkActive: '#9A3412',
    colorInfo: '#C2410C',
    colorSuccess: '#2DA44E',
    colorError: '#E5484D',
    colorWarning: '#F59E0B',
    colorText: '#2B1B0E',
    colorTextSecondary: '#6B5642',
    colorTextPlaceholder: '#9A8268',
    colorBorder: '#F1E2CC',
    colorBgLayout: '#FFF8EE',
    colorBgContainer: '#FFFFFF',
    borderRadius: 12,
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    controlOutline: 'rgba(249,115,22,.25)',
    colorPrimaryBorder: '#EA580C',
    colorPrimaryHover: '#EA580C',
  },
  components: {
    Button: {
      controlHeight: 42,
      fontWeight: '600',
      borderRadius: 12,
      primaryColor: '#2A1300',
      primaryShadow: '0 2px 6px rgba(249, 115, 22, 0.2)',
    },
    Input: {
      controlHeight: 42,
      borderRadius: 12,
      colorBorder: '#F1E2CC',
    },
    Select: {
      controlHeight: 42,
      borderRadius: 12,
    },
    Card: {
      borderRadiusLG: 20,
      colorBorderSecondary: '#F1E2CC',
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Drawer: {
      borderRadiusLG: 20,
    },
  },
};

export function LearnerThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={friendlyClassroomTheme}>
      {children}
    </ConfigProvider>
  );
}
