import React from 'react';
import { Book, CheckCircle, MessageCircle, FileText } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (action: string) => void;
}

const actions = [
  {
    label: '📚 Giải thích từ vựng',
    icon: Book,
    prompt: 'Hãy giải thích nghĩa, cách dùng và cho ví dụ của một từ vựng khó trong tiếng Anh.',
  },
  {
    label: '✍️ Sửa câu tiếng Anh',
    icon: CheckCircle,
    prompt: 'Hãy kiểm tra và sửa lỗi ngữ pháp/từ vựng giúp tôi trong câu sau: ',
  },
  {
    label: '🧠 Luyện ngữ pháp',
    icon: FileText,
    prompt: 'Hãy giải thích một điểm ngữ pháp tiếng Anh quan trọng và cho 3 câu ví dụ.',
  },
  {
    label: '💬 Luyện hội thoại',
    icon: MessageCircle,
    prompt: 'Chúng ta hãy đóng vai luyện tập hội thoại tiếng Anh theo chủ đề giao tiếp hàng ngày nhé.',
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onSelectAction(action.prompt)}
          className="flex items-center gap-2 px-3 py-2 bg-white border-[2px] border-black rounded-lg text-xs font-bold text-[#1D2A3A] hover:bg-[#2A8B9D] hover:text-white transition-all shadow-[2px_2px_0px_0px_#000] text-left"
        >
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};
