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
    { id: 'chat', label: '💬 Trò chuyện AI', icon: <MessageOutlined /> },
    { id: 'translation', label: '🌐 Dịch tiếng Anh', icon: <TranslationOutlined /> },
    { id: 'vocabulary', label: '📚 Từ vựng', icon: <BookOutlined /> },
    { id: 'sentence', label: '✍️ Sửa lỗi câu', icon: <CheckCircleOutlined /> },
    { id: 'grammar', label: '🧠 Ngữ pháp', icon: <FormOutlined /> },
    { id: 'conversation', label: '🗣️ Luyện hội thoại', icon: <CommentOutlined /> },
    { id: 'support', label: '🛠️ Hỗ trợ LeLa', icon: <CustomerServiceOutlined /> },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id as AiMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm whitespace-nowrap border-[2px] border-black transition-all ${
              isActive
                ? 'bg-[#F05A4A] text-white shadow-[2px_2px_0px_0px_#000] scale-102 font-black'
                : 'bg-white text-[#1D2A3A] hover:bg-gray-100'
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
