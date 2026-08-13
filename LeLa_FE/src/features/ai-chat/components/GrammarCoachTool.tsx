import React, { useState } from 'react';
import { Button, Input, Spin, message as antMessage } from 'antd';
import { FormOutlined, CopyOutlined } from '@ant-design/icons';

interface GrammarCoachToolProps {
  onExplain: (prompt: string) => void;
  isLoading: boolean;
  resultText?: string;
}

export const GrammarCoachTool: React.FC<GrammarCoachToolProps> = ({
  onExplain,
  isLoading,
  resultText,
}) => {
  const [topic, setTopic] = useState('');

  const handleExplainClick = () => {
    if (!topic.trim()) {
      antMessage.warning('Vui lòng nhập chủ đề ngữ pháp hoặc câu cần giải thích.');
      return;
    }

    const prompt = `Bạn là Giảng viên Ngữ pháp Tiếng Anh LeLa. Hãy giải thích chi tiết điểm ngữ pháp hoặc cấu trúc sau:

"${topic.trim()}"

Yêu cầu định dạng phản hồi:
1. **Tên cấu trúc & Công thức tổng quát:** (S + V + O...)
2. **Khi nào sử dụng (Ngữ cảnh chính):**
3. **3 Câu ví dụ minh họa thực tế kèm dịch nghĩa:**
4. **Các lỗi sai thường gặp của người học (Common Pitfalls):**
5. **Mẹo nhớ nhanh:**`;

    onExplain(prompt);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    antMessage.success('Đã sao chép bài giải thích ngữ pháp!');
  };

  return (
    <div className="bg-white brutal-card brutal-shadow p-6 border-[3px] border-black rounded-2xl">
      <div className="flex items-center gap-2 border-b-[3px] border-black pb-3 mb-6">
        <FormOutlined className="text-2xl text-[#1D2A3A]" />
        <h2 className="text-xl font-black uppercase text-[#1D2A3A] m-0">
          HUẤN LUYỆN VIÊN NGỮ PHÁP (GRAMMAR COACH)
        </h2>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <label className="text-xs font-bold uppercase text-gray-500">
          Nhập tên thì/cấu trúc ngữ pháp hoặc câu bạn chưa hiểu (Ví dụ: Present Perfect Continuous, Wish structure, Inversion):
        </label>
        <Input
          size="large"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onPressEnter={handleExplainClick}
          placeholder="Nhập tên thì hoặc cấu trúc ngữ pháp (Ví dụ: Thì hiện tại hoàn thành tiếp diễn)..."
          className="brutal-input text-base font-bold border-[2px] border-black shadow-[2px_2px_0px_0px_#000] rounded-xl"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleExplainClick}
            loading={isLoading}
            className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#1D2A3A] hover:!bg-[#2A8B9D] h-11 px-8 text-base shadow-[2px_2px_0px_0px_#000]"
          >
            GIẢI THÍCH NGỮ PHÁP
          </Button>
        </div>
      </div>

      {/* Result Display Pane */}
      <div className="p-6 bg-[#F4F3EE] rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000] min-h-[220px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Spin size="large" />
            <span className="font-bold text-xs uppercase text-gray-600">AI đang tổng hợp công thức, ví dụ và lỗi sai thường gặp...</span>
          </div>
        ) : resultText ? (
          <div>
            <div className="flex justify-between items-center border-b-[2px] border-black pb-2 mb-3">
              <span className="text-xs font-black uppercase text-[#1D2A3A]">Bài giải thích ngữ pháp từ AI Tutor</span>
              <Button
                type="text"
                onClick={() => handleCopy(resultText)}
                icon={<CopyOutlined />}
                className="font-bold text-xs text-[#2A8B9D]"
              >
                Sao chép bài viết
              </Button>
            </div>
            <div className="prose text-[#1D2A3A] font-medium leading-relaxed whitespace-pre-wrap">
              {resultText}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 font-bold text-center py-16">
            Nhập cấu trúc hoặc tên bài học ngữ pháp ở trên để nhận hướng dẫn công thức, ví dụ thực tế và các bẫy thường gặp!
          </div>
        )}
      </div>
    </div>
  );
};
