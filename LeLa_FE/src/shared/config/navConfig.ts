import React from 'react';
import {
  BookOutlined,
  CompassOutlined,
  FolderOpenOutlined,
  EditOutlined,
  AudioOutlined,
  RobotOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

export interface NavItemConfig {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'ai' | 'due' | 'new';
  exact?: boolean;
}

export interface NavGroupConfig {
  groupKey: string;
  groupLabel: string; // HỌC, LUYỆN, THI, CỘNG ĐỒNG
  items: NavItemConfig[];
}

export const LEARNER_NAV_GROUPS: NavGroupConfig[] = [
  {
    groupKey: 'learn',
    groupLabel: 'HỌC',
    items: [
      {
        key: 'dashboard',
        label: 'Hôm nay',
        path: '/dashboard',
        icon: React.createElement(BookOutlined, { style: { fontSize: 18 } }),
        exact: true,
      },
      {
        key: 'explore-decks',
        label: 'Khám phá bộ thẻ',
        path: '/decks',
        icon: React.createElement(CompassOutlined, { style: { fontSize: 18 } }),
      },
      {
        key: 'my-decks',
        label: 'Bộ thẻ của tôi',
        path: '/my-decks',
        icon: React.createElement(FolderOpenOutlined, { style: { fontSize: 18 } }),
      },
    ],
  },
  {
    groupKey: 'practice',
    groupLabel: 'LUYỆN',
    items: [
      {
        key: 'typing-game',
        label: 'Luyện gõ',
        path: '/typing-game',
        icon: React.createElement(EditOutlined, { style: { fontSize: 18 } }),
      },
      {
        key: 'voice-conversation',
        label: 'Hội thoại AI',
        path: '/voice-conversation',
        icon: React.createElement(AudioOutlined, { style: { fontSize: 18 } }),
        badge: 'AI',
        badgeType: 'ai',
      },
      {
        key: 'ai-chat',
        label: 'AI Tutor',
        path: '/ai-chat',
        icon: React.createElement(RobotOutlined, { style: { fontSize: 18 } }),
        badge: 'AI',
        badgeType: 'ai',
      },
    ],
  },
  {
    groupKey: 'test',
    groupLabel: 'THI',
    items: [
      {
        key: 'quizzes',
        label: 'Lộ trình & Thi',
        path: '/quizzes',
        icon: React.createElement(SafetyCertificateOutlined, { style: { fontSize: 18 } }),
      },
    ],
  },
  {
    groupKey: 'community',
    groupLabel: 'CỘNG ĐỒNG',
    items: [
      {
        key: 'achievements',
        label: 'Thành tích',
        path: '/achievements',
        icon: React.createElement(TrophyOutlined, { style: { fontSize: 18 } }),
      },
      {
        key: 'leaderboard',
        label: 'Bảng xếp hạng',
        path: '/leaderboard',
        icon: React.createElement(BarChartOutlined, { style: { fontSize: 18 } }),
      },
    ],
  },
];

export const MOBILE_BOTTOM_TABS: NavItemConfig[] = [
  {
    key: 'today',
    label: 'Hôm nay',
    path: '/dashboard',
    icon: React.createElement(BookOutlined, { style: { fontSize: 20 } }),
  },
  {
    key: 'study',
    label: 'Học',
    path: '/decks',
    icon: React.createElement(CompassOutlined, { style: { fontSize: 20 } }),
  },
  // Nút tròn nổi giữa "Ôn ngay" (Study SM-2)
  {
    key: 'practice',
    label: 'Luyện',
    path: '/voice-conversation',
    icon: React.createElement(AudioOutlined, { style: { fontSize: 20 } }),
  },
  {
    key: 'test',
    label: 'Thi',
    path: '/quizzes',
    icon: React.createElement(SafetyCertificateOutlined, { style: { fontSize: 20 } }),
  },
  {
    key: 'profile',
    label: 'Tôi',
    path: '/profile',
    icon: React.createElement(TrophyOutlined, { style: { fontSize: 20 } }),
  },
];
