import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Keyboard,
  Mic,
  Sparkles,
  Trophy,
  Award,
  BarChart3,
  Home,
} from 'lucide-react';

export interface NavItemConfig {
  key: string;
  label: string;
  to: string;
  path?: string; // alias of to
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: 'AI';
  exact?: boolean;
}

export interface NavGroupConfig {
  key: string;
  label: string;
  groupKey?: string; // alias of key
  groupLabel?: string; // alias of label
  items: NavItemConfig[];
}

// Mục độc lập đầu tiên (Header Navigation)
export const DASHBOARD_NAV_ITEM: NavItemConfig = {
  key: 'dashboard',
  label: 'Tổng quan',
  to: '/dashboard',
  path: '/dashboard',
  icon: LayoutDashboard,
  exact: true,
};

export const LEARNER_NAV_GROUPS: NavGroupConfig[] = [
  {
    key: 'vocabulary',
    label: 'TỪ VỰNG & BỘ THẺ',
    groupKey: 'vocabulary',
    groupLabel: 'TỪ VỰNG & BỘ THẺ',
    items: [
      {
        key: 'explore-decks',
        label: 'Khám phá bộ thẻ',
        to: '/decks',
        path: '/decks',
        icon: Compass,
      },
      {
        key: 'my-decks',
        label: 'Bộ thẻ của tôi',
        to: '/my-decks',
        path: '/my-decks',
        icon: BookOpen,
      },
    ],
  },
  {
    key: 'practice',
    label: 'LUYỆN TẬP',
    groupKey: 'practice',
    groupLabel: 'LUYỆN TẬP',
    items: [
      {
        key: 'typing-game',
        label: 'Luyện gõ từ',
        to: '/typing-game',
        path: '/typing-game',
        icon: Keyboard,
      },
      {
        key: 'voice-conversation',
        label: 'Hội thoại AI',
        to: '/voice-conversation',
        path: '/voice-conversation',
        icon: Mic,
        badge: 'AI',
      },
      {
        key: 'ai-chat',
        label: 'AI Tutor',
        to: '/ai-chat',
        path: '/ai-chat',
        icon: Sparkles,
        badge: 'AI',
      },
    ],
  },
  {
    key: 'assessment',
    label: 'ĐÁNH GIÁ & THI',
    groupKey: 'assessment',
    groupLabel: 'ĐÁNH GIÁ & THI',
    items: [
      {
        key: 'quizzes',
        label: 'Lộ trình & Thi kết thúc cấp',
        to: '/quizzes?category=LEVEL_UP',
        path: '/quizzes?category=LEVEL_UP',
        icon: Trophy,
      },
    ],
  },
  {
    key: 'community',
    label: 'CỘNG ĐỒNG',
    groupKey: 'community',
    groupLabel: 'CỘNG ĐỒNG',
    items: [
      {
        key: 'achievements',
        label: 'Thành tích cá nhân',
        to: '/achievements',
        path: '/achievements',
        icon: Award,
      },
      {
        key: 'leaderboard',
        label: 'Bảng xếp hạng',
        to: '/leaderboard',
        path: '/leaderboard',
        icon: BarChart3,
      },
    ],
  },
];

export interface MobileBottomTabConfig {
  key: string;
  label: string;
  to: string;
  path?: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }> | null;
}

export const MOBILE_BOTTOM_TABS: MobileBottomTabConfig[] = [
  {
    key: 'today',
    label: 'Hôm nay',
    to: '/dashboard',
    path: '/dashboard',
    icon: Home,
  },
  {
    key: 'learn',
    label: 'Học',
    to: '/decks',
    path: '/decks',
    icon: Compass,
  },
  {
    key: 'study-action',
    label: 'Ôn ngay',
    to: '/decks',
    path: '/decks',
    icon: null,
  },
  {
    key: 'practice',
    label: 'Luyện',
    to: '/voice-conversation',
    path: '/voice-conversation',
    icon: Mic,
  },
  {
    key: 'profile',
    label: 'Tôi',
    to: '/profile',
    path: '/profile',
    icon: Award,
  },
];
