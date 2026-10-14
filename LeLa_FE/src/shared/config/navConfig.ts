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
  groupLabel: string; // Học, Luyện, Thi, Cộng đồng
  items: NavItemConfig[];
}

export const LEARNER_NAV_GROUPS: NavGroupConfig[] = [
  {
    groupKey: 'learn',
    groupLabel: 'Học',
    items: [
      {
        key: 'dashboard',
        label: 'Hôm nay',
        path: '/dashboard',
        icon: React.createElement(BookOutlined, { style: { fontSize: 20 } }),
        exact: true,
      },
      {
        key: 'explore-decks',
        label: 'Khám phá bộ thẻ',
        path: '/decks',
        icon: React.createElement(CompassOutlined, { style: { fontSize: 20 } }),
      },
      {
        key: 'my-decks',
        label: 'Bộ thẻ của tôi',
        path: '/my-decks',
        icon: React.createElement(FolderOpenOutlined, { style: { fontSize: 20 } }),
      },
    ],
  },
  {
    groupKey: 'practice',
    groupLabel: 'Luyện',
    items: [
      {
        key: 'typing-game',
        label: 'Luyện gõ từ',
        path: '/typing-game',
        icon: React.createElement(EditOutlined, { style: { fontSize: 20 } }),
      },
      {
        key: 'voice-conversation',
        label: 'Hội thoại AI',
        path: '/voice-conversation',
        icon: React.createElement(AudioOutlined, { style: { fontSize: 20 } }),
        badge: 'AI',
        badgeType: 'ai',
      },
      {
        key: 'ai-chat',
        label: 'AI Tutor',
        path: '/ai-chat',
        icon: React.createElement(RobotOutlined, { style: { fontSize: 20 } }),
        badge: 'AI',
        badgeType: 'ai',
      },
    ],
  },
  {
    groupKey: 'test',
    groupLabel: 'Thi',
    items: [
      {
        key: 'quizzes',
        label: 'Lộ trình & Thi',
        path: '/quizzes?category=LEVEL_UP',
        icon: React.createElement(TrophyOutlined, { style: { fontSize: 20 } }),
      },
    ],
  },
  {
    groupKey: 'community',
    groupLabel: 'Cộng đồng',
    items: [
      {
        key: 'achievements',
        label: 'Thành tích',
        path: '/achievements',
        icon: React.createElement(SafetyCertificateOutlined, { style: { fontSize: 20 } }),
      },
      {
        key: 'leaderboard',
        label: 'Bảng xếp hạng',
        path: '/leaderboard',
        icon: React.createElement(BarChartOutlined, { style: { fontSize: 20 } }),
      },
    ],
  },
];

export interface MobileBottomTabConfig {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const MOBILE_BOTTOM_TABS: MobileBottomTabConfig[] = [
  {
    key: 'today',
    label: 'Hôm nay',
    path: '/dashboard',
    icon: React.createElement(BookOutlined),
  },
  {
    key: 'learn',
    label: 'Học',
    path: '/decks',
    icon: React.createElement(CompassOutlined),
  },
  {
    key: 'study-action',
    label: 'Ôn ngay',
    path: '/decks',
    icon: null,
  },
  {
    key: 'practice',
    label: 'Luyện',
    path: '/voice-conversation',
    icon: React.createElement(AudioOutlined),
  },
  {
    key: 'profile',
    label: 'Tôi',
    path: '/profile',
    icon: React.createElement(SafetyCertificateOutlined),
  },
];
