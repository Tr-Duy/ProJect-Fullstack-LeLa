import React from 'react';
import { Dropdown, type MenuProps } from 'antd';
import { Plus, PanelRight, MoreHorizontal, Trash2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Lela } from '../../../shared/components/ui/Lela';

interface TutorHeaderProps {
  currentLevelName?: string;
  isGenerating?: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNewChat: () => void;
  onClearChat: () => void;
  onOpenContext: () => void;
}

export const TutorHeader: React.FC<TutorHeaderProps> = ({
  currentLevelName,
  isGenerating = false,
  soundEnabled,
  onToggleSound,
  onNewChat,
  onClearChat,
  onOpenContext,
}) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'sound',
      label: (
        <div className="flex items-center gap-2 py-1 text-[13px] font-medium">
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-[var(--brand)]" />
              <span>Âm thanh: <strong>Bật</strong></span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-[var(--text-3)]" />
              <span>Âm thanh: <strong>Tắt</strong></span>
            </>
          )}
        </div>
      ),
      onClick: onToggleSound,
    },
    {
      type: 'divider',
    },
    {
      key: 'clear',
      danger: true,
      label: (
        <div className="flex items-center gap-2 py-1 text-[13px] font-medium text-red-600">
          <Trash2 className="w-4 h-4" />
          <span>Xóa cuộc trò chuyện</span>
        </div>
      ),
      onClick: onClearChat,
    },
  ];

  return (
    <header className="h-14 min-h-[56px] border-b border-[var(--border)] px-4 flex items-center justify-between bg-white shrink-0">
      {/* Left section: Mascot + Title + Level Chip */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0 flex items-center justify-center">
          <Lela
            mood={isGenerating ? 'thinking' : 'happy'}
            size={36}
            className="transition-transform duration-200"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-heading font-semibold text-[16px] text-[var(--text)] tracking-tight truncate">
            AI Tutor
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--teal)] bg-[var(--teal-50)] px-1.5 py-0.5 rounded-full border border-[var(--teal)]/20">
            <Sparkles className="w-2.5 h-2.5" />
            AI
          </span>
        </div>

        {currentLevelName && (
          <div className="truncate max-w-[150px] sm:max-w-none px-2.5 py-0.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-[12px] font-semibold border border-[var(--brand-100)]">
            {currentLevelName}
          </div>
        )}
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--brand)] transition-all shadow-[var(--shadow-sm)] active:scale-95"
          title="Bắt đầu cuộc trò chuyện mới"
        >
          <Plus className="w-4 h-4 text-[var(--brand)]" />
          <span className="hidden sm:inline">Trò chuyện mới</span>
        </button>

        {/* Drawer button for screens < 1280px */}
        <button
          type="button"
          onClick={onOpenContext}
          className="xl:hidden flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border)] bg-white text-[13px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--brand)] transition-all shadow-[var(--shadow-sm)] active:scale-95"
          title="Xem bối cảnh học tập"
        >
          <PanelRight className="w-4 h-4 text-[var(--brand)]" />
          <span className="hidden md:inline">Bối cảnh</span>
        </button>

        {/* Options Menu */}
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors shadow-[var(--shadow-sm)] active:scale-95"
            aria-label="Tùy chọn"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
};
