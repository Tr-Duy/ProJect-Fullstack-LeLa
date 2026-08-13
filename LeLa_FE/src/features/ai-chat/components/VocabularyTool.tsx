import React, { useState } from 'react';
import { Button, Input, Spin, message as antMessage } from 'antd';
import { BookOutlined, SoundOutlined, SearchOutlined } from '@ant-design/icons';

interface VocabularyToolProps {
  onAnalyze: (prompt: string) => void;
  isLoading: boolean;
  resultText?: string;
}

export const VocabularyTool: React.FC<VocabularyToolProps> = ({
  onAnalyze,
  isLoading,
  resultText,
}) => {
  const [word, setWord] = useState('');

  const handleAnalyzeClick = () => {
    if (!word.trim()) {
      antMessage.warning('Vui lòng nhập từ vựng tiếng Anh cần phân tích.');
      return;
    }

    const prompt = `Bạn là Chuyên gia Từ vựng LeLa. Hãy phân tích chuyên sâu cho từ vựng Tiếng Anh: "${word.trim()}".

Yêu cầu định dạng phản hồi:
1. **Từ vựng & Phiên âm IPA:** (Ví dụ: beautiful /ˈbjuː.tɪ.fəl/)
2. **Loại từ & Định nghĩa Tiếng Việt:**
3. **2 Câu ví dụ thực tế kèm dịch nghĩa:**
4. **Từ đồng nghĩa (Synonyms) & Từ trái nghĩa (Antonyms):**
5. **Collocations (Từ kết hợp phổ biến):**
6. **Mẹo ghi nhớ nhanh:**`;

    onAnalyze(prompt);
  };

  const handleSpeak = () => {
    if (word && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white brutal-card brutal-shadow p-6 border-[3px] border-black rounded-2xl">
      <div className="flex items-center gap-2 border-b-[3px] border-black pb-3 mb-6">
        <BookOutlined className="text-2xl text-[#F05A4A]" />
        <h2 className="text-xl font-black uppercase text-[#1D2A3A] m-0">
          TỪ VỰNG CHI TIẾT (VOCABULARY ANALYZER)
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          size="large"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onPressEnter={handleAnalyzeClick}
          placeholder="Nhập từ vựng tiếng Anh (Ví dụ: beautiful, persistent, accomplish)..."
          prefix={<SearchOutlined className="text-gray-400 mr-1" />}
          className="brutal-input text-lg font-bold border-[2px] border-black shadow-[2px_2px_0px_0px_#000] rounded-xl flex-1"
        />
        <Button
          onClick={handleAnalyzeClick}
          loading={isLoading}
          className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#2A8B9D] hover:!bg-[#1D2A3A] h-12 px-8 text-base shadow-[2px_2px_0px_0px_#000] shrink-0"
        >
          PHÂN TÍCH
        </Button>
      </div>

      {/* Result Display Pane */}
      <div className="p-6 bg-[#F4F3EE] rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000] min-h-[220px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Spin size="large" />
            <span className="font-bold text-xs uppercase text-gray-600">AI đang tra cứu IPA, ví dụ và collocations...</span>
          </div>
        ) : resultText ? (
          <div>
            <div className="flex justify-between items-center border-b-[2px] border-black pb-3 mb-4">
              <span className="text-2xl font-black text-[#1D2A3A]">{word}</span>
              <Button
                onClick={handleSpeak}
                icon={<SoundOutlined />}
                className="brutal-pill border-black bg-[#FFD700] font-bold text-xs text-black"
              >
                Phát âm chuẩn
              </Button>
            </div>
            <div className="prose text-[#1D2A3A] font-medium leading-relaxed whitespace-pre-wrap">
              {resultText}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 font-bold text-center py-16">
            Nhập một từ vựng bất kỳ ở trên để xem IPA, loại từ, nghĩa, câu ví dụ và collocations!
          </div>
        )}
      </div>
    </div>
  );
};
