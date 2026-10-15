import React, { useState } from 'react';
import { Button, Input, Spin, message as antMessage } from 'antd';
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons';

interface SentenceCorrectionToolProps {
  onCorrect: (prompt: string) => void;
  isLoading: boolean;
  resultText?: string;
}

export const SentenceCorrectionTool: React.FC<SentenceCorrectionToolProps> = ({
  onCorrect,
  isLoading,
  resultText,
}) => {
  const [sentence, setSentence] = useState('');

  const handleCorrectClick = () => {
    if (!sentence.trim()) {
      antMessage.warning('Vui lòng nhập câu tiếng Anh cần kiểm tra và sửa lỗi.');
      return;
    }

    const prompt = `Bạn là Chuyên gia Ngữ pháp & Biên tập Tiếng Anh LeLa. Hãy sửa lỗi cho câu sau:

"${sentence.trim()}"

Yêu cầu định dạng phản hồi:
1. **❌ Câu gốc của bạn:** (Chỉ ra lỗi sai nếu có)
2. **✅ Câu chuẩn ngữ pháp:**
3. **💡 Diễn đạt tự nhiên hơn (Natural Version):**
4. **🧠 Giải thích ngắn gọn lỗi sai & lý do sửa:**`;

    onCorrect(prompt);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    antMessage.success('Đã sao chép câu trả lời!');
  };

  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-md)] p-6 border border-[var(--border)] rounded-2xl">
      <div className="flex items-center gap-2 border-b-[3px] border-[var(--border)] pb-3 mb-6">
        <CheckCircleOutlined className="text-2xl text-[#2A8B9D]" />
        <h2 className="text-xl font-bold text-[#2B1B0E] m-0">
          SỬA LỖI CÂU & PHÂN TÍCH (SENTENCE CORRECTION)
        </h2>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <label className="text-xs font-bold text-gray-500">
          Nhập câu Tiếng Anh bạn vừa viết hoặc nghi ngờ có lỗi:
        </label>
        <Input.TextArea
          rows={3}
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Ví dụ: I am agree with your opinion because it is very clear..."
          className="brutal-input p-4 font-medium text-base rounded-xl border border-[var(--border)] shadow-[var(--shadow-sm)]"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleCorrectClick}
            loading={isLoading}
            className="brutal-pill border border-[var(--border)] font-black text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-11 px-8 text-base shadow-[var(--shadow-sm)]"
          >
            KIỂM TRA & SỬA LỖI
          </Button>
        </div>
      </div>

      {/* Result Display Pane */}
      <div className="p-6 bg-[#F4F3EE] rounded-xl border border-[var(--border)] shadow-[var(--shadow-sm)] min-h-[200px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-36 gap-3">
            <Spin size="large" />
            <span className="font-bold text-xs  text-gray-600">AI đang soi lỗi ngữ pháp và từ vựng...</span>
          </div>
        ) : resultText ? (
          <div>
            <div className="flex justify-between items-center border-b-[2px] border-[var(--border)] pb-2 mb-3">
              <span className="text-xs font-bold text-[#2A8B9D]">Kết quả phân tích từ AI Tutor</span>
              <Button
                type="text"
                onClick={() => handleCopy(resultText)}
                icon={<CopyOutlined />}
                className="font-bold text-xs text-[#2A8B9D]"
              >
                Sao chép kết quả
              </Button>
            </div>
            <div className="prose text-[#2B1B0E] font-medium leading-relaxed whitespace-pre-wrap">
              {resultText}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 font-bold text-center py-14">
            Nhập một câu Tiếng Anh nghi ngờ có lỗi ngữ pháp ở trên để AI chỉ ra câu đúng và gợi ý cách diễn đạt tự nhiên hơn!
          </div>
        )}
      </div>
    </div>
  );
};
