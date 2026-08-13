import React from 'react';
import { 
  BookOpen, Type, Languages, Edit3, CheckSquare, Mic, 
  Headphones, Layers, LayoutList, Calendar, LineChart, Target,
  Brain, FileText, AlertTriangle, Medal,
  Clock, CalendarDays, Zap, Repeat, MessageCircle,
  Sun, MessageSquareQuote, SpellCheck, Link, Ear
} from 'lucide-react';

interface AiFeatureSidebarProps {
  onSelectFeature: (prompt: string) => void;
}

const featureCategories = [
  {
    title: 'Trợ giảng (Assistant)',
    features: [
      { name: 'Vocabulary Assistant', icon: BookOpen, prompt: 'Bạn là một Chuyên gia Từ vựng. Hãy giải thích chi tiết, cung cấp IPA, loại từ, từ đồng nghĩa/trái nghĩa, và ví dụ cụ thể cho từ: ' },
      { name: 'Grammar Assistant', icon: Type, prompt: 'Bạn là một Chuyên gia Ngữ pháp. Hãy giải thích cấu trúc ngữ pháp này: ' },
      { name: 'Translation', icon: Languages, prompt: 'Hãy dịch đoạn văn bản sau sang tiếng Việt/tiếng Anh một cách tự nhiên nhất: ' },
      { name: 'Sentence Correction', icon: CheckSquare, prompt: 'Hãy sửa lỗi ngữ pháp, từ vựng và làm cho câu sau tự nhiên hơn, giải thích lý do sửa: ' },
      { name: 'Daily Expressions', icon: Sun, prompt: 'Hãy cung cấp cho tôi 3 mẫu câu giao tiếp tiếng Anh thông dụng dùng trong ngày hôm nay kèm ngữ cảnh sử dụng.' },
      { name: 'Idioms & Phrasal Verbs', icon: MessageSquareQuote, prompt: 'Hãy dạy tôi 2 Idioms và 2 Phrasal Verbs phổ biến kèm theo ví dụ thực tế.' },
      { name: 'Collocations', icon: Link, prompt: 'Hãy liệt kê các collocations (từ kết hợp) thông dụng đi kèm với từ: ' },
      { name: 'Pronunciation Guide', icon: Ear, prompt: 'Hãy hướng dẫn tôi cách phát âm chuẩn (IPA, nối âm, trọng âm) cho câu/từ: ' },
    ]
  },
  {
    title: 'Huấn luyện viên (Coach)',
    features: [
      { name: 'Writing Coach', icon: Edit3, prompt: 'Tôi muốn viết một đoạn văn/email. Hãy đóng vai Writing Coach, hướng dẫn tôi dàn ý và sửa lỗi bài viết của tôi.' },
      { name: 'Speaking Coach', icon: Mic, prompt: 'Hãy đóng vai giám khảo IELTS Speaking. Đặt câu hỏi cho tôi và nhận xét câu trả lời của tôi.' },
      { name: 'Reading Coach', icon: FileText, prompt: 'Tôi sẽ gửi một đoạn văn. Hãy giúp tôi phân tích ý chính, từ vựng khó và đặt câu hỏi đọc hiểu.' },
      { name: 'Listening Coach', icon: Headphones, prompt: 'Hãy gợi ý cho tôi một bài nghe tiếng Anh phù hợp với trình độ của tôi và các bước luyện nghe.' },
      { name: 'Conversation Practice', icon: MessageCircle, prompt: 'Chúng ta hãy đóng vai để luyện tập giao tiếp. Chủ đề là: [Nhập chủ đề bạn muốn]. Bạn bắt đầu trước nhé!' },
      { name: 'Learning Coach', icon: Brain, prompt: 'Tôi đang gặp khó khăn trong việc học tiếng Anh. Hãy đóng vai Learning Coach và cho tôi lời khuyên.' },
    ]
  },
  {
    title: 'Tạo nội dung (Generators)',
    features: [
      { name: 'Quiz Generator', icon: LayoutList, prompt: '/generate-quiz [Nhập chủ đề]' },
      { name: 'Flashcard Generator', icon: Layers, prompt: '/generate-flashcards [Nhập chủ đề]' },
      { name: 'Study Planner', icon: Calendar, prompt: '/generate-study-plan [Mục tiêu của bạn]' },
      { name: 'Review Planner', icon: Repeat, prompt: 'Dựa trên tiến độ học của tôi, hãy lên lịch ôn tập cho tuần tới.' },
    ]
  },
  {
    title: 'Phân tích (Analytics)',
    features: [
      { name: 'Learning Analytics', icon: LineChart, prompt: '/analyze-progress' },
      { name: 'Weak Topic Detection', icon: AlertTriangle, prompt: 'Hãy phân tích dữ liệu học tập của tôi và chỉ ra những điểm yếu cần khắc phục.' },
      { name: 'Mistake Analysis', icon: SpellCheck, prompt: 'Dựa trên các quiz tôi đã làm sai, lỗi sai phổ biến nhất của tôi là gì và cách khắc phục?' },
      { name: 'CEFR Recommendation', icon: Medal, prompt: 'Dựa trên tiến độ hiện tại, bạn đánh giá trình độ CEFR của tôi đang ở mức nào? Cần làm gì để tăng level?' },
      { name: 'Daily Report', icon: Clock, prompt: 'Tóm tắt kết quả học tập tiếng Anh của tôi trong ngày hôm nay.' },
      { name: 'Weekly/Monthly Report', icon: CalendarDays, prompt: 'Hãy lập báo cáo tiến độ học tập chi tiết của tôi trong tuần/tháng qua.' },
      { name: 'Smart Recommendations', icon: Zap, prompt: 'Dựa vào lịch sử học của tôi, hãy gợi ý bài học hoặc từ vựng tiếp theo.' },
      { name: 'Adaptive Learning', icon: Target, prompt: 'Hãy tạo cho tôi một bài tập tùy chỉnh nhắm đúng vào phần tôi yếu nhất.' },
    ]
  }
];

export const AiFeatureSidebar: React.FC<AiFeatureSidebarProps> = ({ onSelectFeature }) => {
  return (
    <div className="w-80 h-full bg-white border-4 border-brand-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl flex flex-col brutal-box overflow-hidden">
      <div className="bg-brand-navy text-white p-4 border-b-4 border-brand-black">
        <h2 className="font-black text-xl flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Tính năng AI
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {featureCategories.map((cat, idx) => (
          <div key={idx}>
            <h3 className="font-bold text-gray-500 uppercase text-xs mb-3 tracking-wider">{cat.title}</h3>
            <div className="space-y-2">
              {cat.features.map((feat, fIdx) => {
                const Icon = feat.icon;
                return (
                  <button
                    key={fIdx}
                    onClick={() => onSelectFeature(feat.prompt)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 border-2 border-transparent rounded-xl hover:border-brand-black hover:bg-brand-yellow/20 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-left group"
                  >
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200 group-hover:border-brand-black group-hover:bg-brand-purple group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-brand-navy text-sm">{feat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
