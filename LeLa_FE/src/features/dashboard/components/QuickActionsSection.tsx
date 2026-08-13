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
      textColor: 'text-[#1D2A3A]',
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
      textColor: 'text-[#1D2A3A]',
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
      bg: 'bg-[#1D2A3A]',
      textColor: 'text-[#FFD700]',
    },
  ];

  return (
    <div className="brutal-card brutal-shadow bg-white p-6 md:p-8 mb-8 border-[3px] border-black">
      <h2 className="text-2xl font-black mb-6 uppercase border-b-[3px] border-black pb-3 text-[#1D2A3A]">
        LỐI TẮT NHANH
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((act) => (
          <Button
            key={act.path}
            onClick={() => navigate(act.path)}
            className={`brutal-card h-14 font-black text-base flex items-center justify-center gap-2 px-4 ${act.bg} ${act.textColor} hover:-translate-y-1 transition-transform border-[2px] border-black shadow-[2px_2px_0px_0px_#000]`}
          >
            {act.icon}
            <span>{act.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
