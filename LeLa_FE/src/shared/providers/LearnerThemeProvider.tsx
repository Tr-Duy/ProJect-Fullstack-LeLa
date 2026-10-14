import { ConfigProvider } from 'antd';
import React from 'react';

export const friendlyClassroomTheme = {
  token: {
    colorPrimary: '#1F5BFF',
    colorSuccess: '#12B76A',
    colorWarning: '#F79009',
    colorError: '#F04438',
    colorInfo: '#1F5BFF',
    colorTextBase: '#101828',
    colorBgBase: '#FFFFFF',
    colorBgLayout: '#F6F8FC',
    borderRadius: 12,
    lineWidth: 1,
    colorBorder: '#E4E9F2',
    fontFamily: '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 42,
      fontWeight: '500',
      borderRadius: 12,
    },
    Input: {
      controlHeight: 42,
      borderRadius: 12,
    },
    Select: {
      controlHeight: 42,
      borderRadius: 12,
    },
    Card: {
      borderRadiusLG: 20,
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
