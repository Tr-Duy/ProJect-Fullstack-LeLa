import React from 'react';
import { Input } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

export interface ExamQuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: {
    id: number;
    questionText: string;
    questionImageUrl?: string;
    questionType?: string;
    points?: number;
    options?: Array<{
      id: number;
      optionText: string;
      optionKey?: string;
      isCorrect?: boolean;
    }>;
  };
  currentAnswer?: {
    attemptQuestionId: number;
    selectedAttemptOptionId?: number;
    answerText?: string;
  };
  onOptionSelect: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, text: string) => void;
}

export const ExamQuestionCard: React.FC<ExamQuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  question,
  currentAnswer,
  onOptionSelect,
  onTextAnswer,
}) => {
  const formattedNumber = questionNumber < 10 ? `0${questionNumber}` : `${questionNumber}`;
  const displayPoints = question?.points || 1;
  const rawText = question?.questionText || '';
  const formattedText = rawText.replace(/\.{3,}/g, '_____');

  return (
    <div className="brutal-card bg-white p-6 md:p-8 mb-8 border-[3px] border-black shadow-[6px_6px_0px_0px_#000] rounded-xl">
      {/* Question Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-[2px] border-black/15 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-[#1D2A3A] text-white font-black text-xs md:text-sm px-3.5 py-1.5 rounded-md uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
            CÂU {formattedNumber}
          </span>
          <span className="text-xs md:text-sm font-bold text-gray-500">
            Câu hỏi {questionNumber} trên {totalQuestions}
          </span>
        </div>
        <div className="text-xs md:text-sm font-black text-[#2A8B9D] bg-[#E6F4F1] px-3.5 py-1.5 rounded-md border-[2px] border-[#2A8B9D]">
          {displayPoints} điểm
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-[#1D2A3A] whitespace-pre-line tracking-wide">
          {formattedText}
        </h2>
        {question.questionImageUrl && (
          <div className="mt-6">
            <img
              src={question.questionImageUrl}
              alt={`Question ${questionNumber}`}
              className="max-w-full max-h-[360px] h-auto object-contain rounded-lg brutal-border border-[3px] border-black shadow-[3px_3px_0px_0px_#000]"
            />
          </div>
        )}
      </div>

      {/* Options or Fill Blank Input */}
      <div className="flex flex-col gap-3.5 w-full">
        {question.questionType === 'FILL_BLANK' ? (
          <div className="p-4 bg-[#F8F7F2] border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
            <label className="block text-sm font-bold text-gray-700 mb-2">Câu trả lời của bạn:</label>
            <Input
              size="large"
              placeholder="Nhập câu trả lời của bạn vào đây..."
              className="brutal-border border-[2.5px] border-black h-14 text-lg px-4 focus:ring-0 focus:border-black font-bold rounded-lg"
              value={currentAnswer?.answerText || ''}
              onChange={(e) => onTextAnswer(question.id, e.target.value)}
            />
          </div>
        ) : (
          question.options?.map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = currentAnswer?.selectedAttemptOptionId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onOptionSelect(question.id, option.id)}
                className={`
                  w-full text-left flex items-center gap-4 p-4 md:p-5 border-[3px] rounded-xl cursor-pointer transition-all duration-150 select-none
                  ${
                    isSelected
                      ? 'bg-[#2A8B9D] text-white border-black shadow-[4px_4px_0px_0px_#000] -translate-y-0.5'
                      : 'bg-white text-[#1D2A3A] border-black hover:bg-[#F4F3EE] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000]'
                  }
                `}
              >
                <div
                  className={`
                    w-9 h-9 border-[2px] border-black rounded-lg flex items-center justify-center font-black text-base shrink-0 transition-colors
                    ${
                      isSelected
                        ? 'bg-white text-[#2A8B9D]'
                        : 'bg-[#F4F3EE] text-[#1D2A3A]'
                    }
                  `}
                >
                  {isSelected ? <CheckOutlined className="text-base font-black" /> : letter}
                </div>
                <span className="text-lg md:text-xl font-bold flex-1 leading-snug">
                  {option.optionText}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
