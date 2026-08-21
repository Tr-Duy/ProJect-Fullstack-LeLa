import React from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export interface ExamReviewCardProps {
  questionNumber: number;
  question: {
    id: number;
    questionText: string;
    questionImageUrl?: string;
    questionType?: string;
    explanation?: string;
    options?: Array<{
      id: number;
      optionText: string;
      optionKey?: string;
      isCorrect?: boolean;
    }>;
  };
  answer?: {
    attemptQuestionId: number;
    selectedAttemptOptionId?: number;
    answerText?: string;
    isCorrect?: boolean;
  };
}

export const ExamReviewCard: React.FC<ExamReviewCardProps> = ({
  questionNumber,
  question,
  answer,
}) => {
  const isCorrect = answer?.isCorrect ?? false;
  const formattedNumber = questionNumber < 10 ? `0${questionNumber}` : `${questionNumber}`;
  const rawText = question?.questionText || '';
  const formattedText = rawText.replace(/\.{3,}/g, '_____');

  // Determine answer text representation for summary block
  let userAnswerText = '(Chưa trả lời)';
  let correctAnswerText = '';

  if (question.questionType === 'FILL_BLANK') {
    userAnswerText = answer?.answerText || '(Trống)';
    correctAnswerText = question.options?.filter((o) => o.isCorrect).map((o) => o.optionText).join(', ') || '';
  } else {
    const selectedOption = question.options?.find((o) => o.id === answer?.selectedAttemptOptionId);
    userAnswerText = selectedOption ? selectedOption.optionText : '(Chưa chọn đáp án)';
    const correctOpt = question.options?.find((o) => o.isCorrect);
    correctAnswerText = correctOpt ? correctOpt.optionText : '';
  }

  return (
    <div className="brutal-card bg-white p-6 md:p-8 mb-6 border-[3px] border-black shadow-[4px_4px_0px_0px_#000] rounded-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-[2px] border-black/15 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-[#1D2A3A] text-white font-black text-xs md:text-sm px-3.5 py-1.5 rounded-md uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
            CÂU {formattedNumber}
          </span>
        </div>

        <div>
          {isCorrect ? (
            <span className="inline-flex items-center gap-1.5 bg-[#2A8B9D] text-white font-black text-sm px-4 py-1.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
              <CheckOutlined className="stroke-[3]" /> ĐÚNG
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-[#F05A4A] text-white font-black text-sm px-4 py-1.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
              <CloseOutlined className="stroke-[3]" /> SAI
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl font-bold leading-relaxed text-[#1D2A3A] whitespace-pre-line tracking-wide">
          {formattedText}
        </h3>
        {question.questionImageUrl && (
          <div className="mt-4 mb-2">
            <img
              src={question.questionImageUrl}
              alt={`Question ${questionNumber}`}
              className="max-w-full max-h-[320px] h-auto object-contain rounded-lg brutal-border border-[3px] border-black shadow-[3px_3px_0px_0px_#000]"
            />
          </div>
        )}
      </div>

      {/* Quick Summary Block for Incorrect Answers */}
      {!isCorrect && (
        <div className="mb-6 p-4 md:p-5 bg-[#FFF5F5] border-[3px] border-[#F05A4A] rounded-xl shadow-[3px_3px_0px_0px_#F05A4A]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-lg border-2 border-[#F05A4A]">
              <div className="text-xs font-black uppercase text-[#F05A4A] mb-1.5 flex items-center justify-between">
                <span>Câu trả lời của bạn</span>
                <CloseOutlined className="font-black text-sm" />
              </div>
              <div className="text-base md:text-lg font-bold text-[#1D2A3A] break-words">
                {userAnswerText}
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-lg border-2 border-[#2A8B9D]">
              <div className="text-xs font-black uppercase text-[#2A8B9D] mb-1.5 flex items-center justify-between">
                <span>Đáp án đúng</span>
                <CheckOutlined className="font-black text-sm" />
              </div>
              <div className="text-base md:text-lg font-bold text-[#1D2A3A] break-words">
                {correctAnswerText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Options Detailed Breakdown */}
      <div className="flex flex-col gap-3 w-full">
        {question.questionType === 'FILL_BLANK' ? (
          <div className="flex flex-col gap-3">
            <div
              className={`p-4 border-[3px] rounded-xl font-bold text-base md:text-lg ${
                isCorrect
                  ? 'bg-[#E6F4F1] border-[#2A8B9D] text-[#1D2A3A]'
                  : 'bg-[#FDEBEA] border-[#F05A4A] text-[#1D2A3A]'
              }`}
            >
              Bạn trả lời:{' '}
              <span className={`font-black ${isCorrect ? 'text-[#2A8B9D]' : 'text-[#F05A4A]'}`}>
                {userAnswerText}
              </span>
            </div>
            {!isCorrect && (
              <div className="p-4 border-[3px] border-[#2A8B9D] bg-[#E6F4F1] rounded-xl font-bold text-base md:text-lg text-[#1D2A3A]">
                Đáp án đúng:{' '}
                <span className="font-black text-[#2A8B9D]">
                  {correctAnswerText}
                </span>
              </div>
            )}
          </div>
        ) : (
          question.options?.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const isSelected = answer?.selectedAttemptOptionId === option.id;
            const isOptionCorrect = option.isCorrect === true;

            let cardStyle = 'bg-[#F8F7F2] border-gray-300 text-gray-600 opacity-80 border-[2px]';
            let badgeStyle = 'bg-gray-200 text-gray-600';
            let statusTag = null;

            if (isOptionCorrect) {
              cardStyle = 'bg-[#E6F4F1] border-[#2A8B9D] text-[#1D2A3A] border-[3px] shadow-[2px_2px_0px_0px_#2A8B9D] font-bold';
              badgeStyle = 'bg-[#2A8B9D] text-white';
              statusTag = (
                <span className="text-xs md:text-sm font-black text-[#2A8B9D] bg-white px-2.5 py-1 rounded-md border border-[#2A8B9D] shrink-0">
                  ✓ Đáp án đúng
                </span>
              );
            } else if (isSelected && !isOptionCorrect) {
              cardStyle = 'bg-[#FDEBEA] border-[#F05A4A] text-[#1D2A3A] border-[3px] shadow-[2px_2px_0px_0px_#F05A4A] font-bold';
              badgeStyle = 'bg-[#F05A4A] text-white';
              statusTag = (
                <span className="text-xs md:text-sm font-black text-[#F05A4A] bg-white px-2.5 py-1 rounded-md border border-[#F05A4A] shrink-0">
                  ✕ Bạn đã chọn
                </span>
              );
            }

            return (
              <div
                key={option.id}
                className={`
                  flex items-center gap-4 p-4 md:p-4.5 rounded-xl transition-all duration-150 ${cardStyle}
                `}
              >
                <div
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center font-black text-base shrink-0 border border-black/20 ${badgeStyle}
                  `}
                >
                  {isOptionCorrect ? <CheckOutlined className="stroke-[3]" /> : (isSelected ? <CloseOutlined className="stroke-[3]" /> : letter)}
                </div>
                <span className="text-base md:text-lg flex-1 leading-snug">
                  {option.optionText}
                </span>
                {statusTag}
              </div>
            );
          })
        )}
      </div>

      {/* Explanation Section */}
      {question.explanation && question.explanation.trim() !== '' && (
        <div className="mt-6 p-4 md:p-5 bg-[#FEF9C3]/60 border-[3px] border-[#F59E0B] rounded-xl shadow-[3px_3px_0px_0px_#F59E0B]">
          <div className="flex items-center gap-2 mb-2 text-[#B45309] font-black text-sm uppercase tracking-wider">
            <span>💡 GIẢI THÍCH</span>
          </div>
          <p className="text-base md:text-lg text-[#1D2A3A] font-medium leading-relaxed whitespace-pre-line">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
