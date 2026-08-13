import React, { useState } from 'react';
import { Button } from 'antd';
import { MessageOutlined, PlayCircleOutlined } from '@ant-design/icons';

interface ConversationPracticeToolProps {
  onStartRoleplay: (prompt: string) => void;
}

const topics = [
  { id: 'coffee', label: '☕ Ordering Coffee', desc: 'Gọi đồ uống tại quán cà phê' },
  { id: 'airport', label: '✈️ At the Airport', desc: 'Check-in và làm thủ tục sân bay' },
  { id: 'hotel', label: '🏨 Hotel Check-in', desc: 'Đặt phòng và hỏi thông tin khách sạn' },
  { id: 'interview', label: '💼 Job Interview', desc: 'Phỏng vấn xin việc bằng tiếng Anh' },
  { id: 'shopping', label: '🛍 Shopping & Asking Price', desc: 'Mua sắm và hỏi giá cả hàng hóa' },
  { id: 'daily', label: '💬 Daily Conversation', desc: 'Hội thoại giao tiếp hàng ngày tự do' },
];

const levels = [
  { id: 'basic', label: 'Cơ bản (A1 - A2)' },
  { id: 'intermediate', label: 'Trung bình (B1 - B2)' },
  { id: 'advanced', label: 'Khá - Giỏi (C1 - C2)' },
];

export const ConversationPracticeTool: React.FC<ConversationPracticeToolProps> = ({
  onStartRoleplay,
}) => {
  const [selectedTopic, setSelectedTopic] = useState('coffee');
  const [selectedLevel, setSelectedLevel] = useState('basic');

  const handleStart = () => {
    const topicObj = topics.find((t) => t.id === selectedTopic);
    const levelObj = levels.find((l) => l.id === selectedLevel);

    const prompt = `Chúng ta hãy bắt đầu một phiên LUYỆN HỘI THOẠI TIẾNG ANH (ROLEPLAY).

Thông tin kịch bản:
- Chủ đề: ${topicObj?.label} (${topicObj?.desc})
- Trình độ mong muốn: ${levelObj?.label}

Quy tắc đối thoại:
1. Bạn hãy đóng vai nhân vật đối thoại (ví dụ: nhân viên phục vụ / người phỏng vấn).
2. Mỗị lần tôi trả lời, hãy nhận xét ngắn về câu của tôi (diễn đạt có tự nhiên không, có lỗi ngữ pháp không) rồi gửi câu tiếp theo.
3. Hãy bắt đầu ngay bây giờ bằng 1 câu chào và đặt 1 câu hỏi đầu tiên!`;

    onStartRoleplay(prompt);
  };

  return (
    <div className="bg-white brutal-card brutal-shadow p-6 border-[3px] border-black rounded-2xl">
      <div className="flex items-center gap-2 border-b-[3px] border-black pb-3 mb-6">
        <MessageOutlined className="text-2xl text-[#F05A4A]" />
        <h2 className="text-xl font-black uppercase text-[#1D2A3A] m-0">
          LUYỆN HỘI THOẠI TƯƠNG TÁC (ROLEPLAY TUTOR)
        </h2>
      </div>

      <div className="space-y-6">
        {/* Topic Selection */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 block mb-3">
            1. CHỌN CHỦ ĐỀ HỘI THOẠI:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topics.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`p-4 rounded-xl border-[2px] border-black cursor-pointer transition-all ${
                  selectedTopic === t.id
                    ? 'bg-[#FFD700] shadow-[3px_3px_0px_0px_#000] scale-102'
                    : 'bg-[#F4F3EE] hover:bg-gray-100'
                }`}
              >
                <div className="font-black text-[#1D2A3A] text-base mb-1">{t.label}</div>
                <div className="text-xs font-medium text-gray-600">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Level Selection */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 block mb-3">
            2. CHỌN TRÌNH ĐỘ ĐỐI THOẠI:
          </label>
          <div className="flex flex-wrap gap-3">
            {levels.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedLevel(l.id)}
                className={`px-5 py-2.5 rounded-full border-[2px] border-black font-bold text-sm transition-all ${
                  selectedLevel === l.id
                    ? 'bg-[#2A8B9D] text-white shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-[#F4F3EE] text-[#1D2A3A] hover:bg-gray-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <Button
            onClick={handleStart}
            icon={<PlayCircleOutlined />}
            className="w-full brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-14 text-lg shadow-[4px_4px_0px_0px_#000] flex items-center justify-center gap-2"
          >
            ▶ BẮT ĐẦU HỘI THOẠI VỚI AI TUTOR
          </Button>
        </div>
      </div>
    </div>
  );
};
