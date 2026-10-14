import React from 'react';
import {
  MessageOutlined,
  TranslationOutlined,
  BookOutlined,
  CheckCircleOutlined,
  FormOutlined,
  CustomerServiceOutlined,
  CommentOutlined,
} from '@ant-design/icons';

export type AiMode =
  | 'chat'
  | 'translation'
  | 'vocabulary'
  | 'sentence'
  | 'grammar'
  | 'conversation'
  | 'support';

interface AiTutorNavigationTabsProps {
  activeMode: AiMode;
  onModeChange: (mode: AiMode) => void;
}

export const AiTutorNavigationTabs: React.FC<AiTutorNavigationTabsProps> = ({
  activeMode,
  onModeChange,
}) => {
  const tabs = [
    { id: 'chat', label: 'Trò chuyện AI', icon: <MessageOutlined /> },
    { id: 'translation', label: 'Dịch tiếng Anh', icon: <TranslationOutlined /> },
    { id: 'vocabulary', label: 'Từ vựng', icon: <BookOutlined /> },
    { id: 'sentence', label: 'Sửa lỗi câu', icon: <CheckCircleOutlined /> },
    { id: 'grammar', label: 'Ngữ pháp', icon: <FormOutlined /> },
    { id: 'conversation', label: 'Luyện hội thoại', icon: <CommentOutlined /> },
    { id: 'support', label: 'Hỗ trợ LeLa', icon: <CustomerServiceOutlined /> },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeMode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onModeChange(tab.id as AiMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap border transition-all cursor-pointer ${
              isActive
                ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                : 'bg-white text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
