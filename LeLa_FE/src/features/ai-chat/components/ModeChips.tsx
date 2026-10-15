import React from 'react';
import { motion } from 'framer-motion';
import { Dropdown, type MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Mic,
  Headphones,
  MessageSquare,
  Languages,
  BookOpen,
  PenLine,
  GraduationCap,
} from 'lucide-react';
import type { AiMode } from './AiTutorNavigationTabs';

interface ModeChipsProps {
  activeMode: AiMode;
  onModeChange: (mode: AiMode) => void;
}

const PRIMARY_MODES: { id: AiMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chat', label: 'Trò chuyện', icon: MessageSquare },
  { id: 'translation', label: 'Dịch', icon: Languages },
  { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen },
  { id: 'sentence', label: 'Sửa câu', icon: PenLine },
  { id: 'grammar', label: 'Ngữ pháp', icon: GraduationCap },
];

export const ModeChips: React.FC<ModeChipsProps> = ({
  activeMode,
  onModeChange,
}) => {
  const navigate = useNavigate();

  const handleOpenLiveSupport = () => {
    window.dispatchEvent(new CustomEvent('open-lela-support'));
  };

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'conversation',
      label: (
        <div className="flex items-center justify-between gap-3 py-1 text-[13px] font-medium">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[var(--brand)]" />
            <span>Luyện hội thoại</span>
          </div>
          <span className="text-[10px] font-semibold text-[var(--brand-700)] bg-[var(--brand-50)] px-1.5 py-0.5 rounded border border-[var(--brand-100)]">
            Giọng nói
          </span>
        </div>
      ),
      onClick: () => {
        navigate('/voice-conversation');
      },
    },
    {
      key: 'support',
      label: (
        <div className="flex items-center gap-2 py-1 text-[13px] font-medium">
          <Headphones className="w-4 h-4 text-[var(--teal)]" />
          <span>Hỗ trợ LeLa</span>
        </div>
      ),
      onClick: handleOpenLiveSupport,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Chế độ học tập AI Tutor"
      className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1.5 pt-0.5 select-none"
    >
      {PRIMARY_MODES.map((mode) => {
        const isActive = activeMode === mode.id;
        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onModeChange(mode.id)}
            className={`relative flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
              isActive
                ? 'text-[#2A1300] font-semibold'
                : 'text-[var(--text-2)] hover:text-[var(--text)] bg-[var(--surface-2)]/70 hover:bg-[var(--surface-2)]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="tutor-mode"
                className="absolute inset-0 rounded-full bg-[var(--brand)] shadow-sm -z-0"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
            </span>
          </button>
        );
      })}

      {/* "Khác ▾" dropdown button */}
      <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="topRight">
        <button
          type="button"
          className="flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-medium text-[var(--text-2)] bg-[var(--surface-2)]/70 hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors whitespace-nowrap"
        >
          <span>Khác</span>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-3)]" />
        </button>
      </Dropdown>
    </div>
  );
};
