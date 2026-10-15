import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BookOutlined,
  CompassOutlined,
  HistoryOutlined,
  TrophyOutlined,
  RobotOutlined,
} from '@ant-design/icons';

export const QuickActionsSection: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Bộ thẻ của tôi',
      icon: <BookOutlined />,
      path: '/my-decks',
      bg: 'bg-[#F4F3EE]',
      textColor: 'text-[#2B1B0E]',
    },
    {
      label: 'Khám phá',
      icon: <CompassOutlined />,
      path: '/decks',
      bg: 'bg-white',
      textColor: 'text-[#2A8B9D]',
    },
    {
      label: 'Lịch sử bài kiểm tra',
      icon: <HistoryOutlined />,
      path: '/my-quiz-attempts',
      bg: 'bg-[#F4F3EE]',
      textColor: 'text-[#2B1B0E]',
    },
    {
      label: 'Bảng xếp hạng',
      icon: <TrophyOutlined />,
      path: '/leaderboard',
      bg: 'bg-white',
      textColor: 'text-[#F05A4A]',
    },
    {
      label: 'AI Tutor',
      icon: <RobotOutlined />,
      path: '/ai-chat',
      bg: 'bg-[#2B1B0E]',
      textColor: 'text-[#FFD700]',
    },
  ];

  return (
    <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white p-6 md:p-8 mb-8 border border-[var(--border)]">
      <h2 className="text-2xl font-black mb-6  border-b-[3px] border-[var(--border)] pb-3 text-[#2B1B0E]">
        LỐI TẮT NHANH
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((act) => (
          <Button
            key={act.path}
            onClick={() => navigate(act.path)}
            className={`rounded-[var(--radius-card)] h-14 font-black text-base flex items-center justify-center gap-2 px-4 ${act.bg} ${act.textColor} hover:-translate-y-1 transition-transform border border-[var(--border)] shadow-[var(--shadow-sm)]`}
          >
            {act.icon}
            <span>{act.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
