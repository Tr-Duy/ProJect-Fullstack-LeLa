import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { TrophyOutlined } from '@ant-design/icons';

interface FinalLevelAssessmentCardProps {
  levelName?: string;
  hasCurrentLevel: boolean;
}

export const FinalLevelAssessmentCard: React.FC<FinalLevelAssessmentCardProps> = ({
  levelName,
  hasCurrentLevel,
}) => {
  const navigate = useNavigate();

  if (!hasCurrentLevel) return null;

  const parseLevel = (rawName?: string) => {
    if (!rawName) return { title: '', range: '' };
    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { title: match[1].trim(), range: match[2].trim() };
    }
    return { title: rawName, range: '' };
  };

  const { title, range } = parseLevel(levelName);
  const subtitleText = range ? `${title} · ${range}` : title;

  return (
    <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white p-5 md:p-6 mb-8 border border-[var(--border)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Icon Box & Information Hierarchy */}
        <div className="flex items-start md:items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#FFF4E5] border border-[var(--border)] flex items-center justify-center text-[#F05A4A] text-xl shrink-0 shadow-[var(--shadow-sm)]">
            <TrophyOutlined />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black  text-gray-500">
              🏆 THI KẾT THÚC LEVEL
            </span>
            <h3 className="text-lg md:text-xl font-black text-[#2B1B0E] leading-snug">
              Bài thi kết thúc Level {title}
            </h3>
            {subtitleText && (
              <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">
                {subtitleText}
              </p>
            )}
            <p className="text-xs md:text-sm text-gray-600 font-medium">
              Kiểm tra tổng hợp kiến thức để đánh giá Level hiện tại và mở khóa Level tiếp theo.
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <div className="shrink-0 pt-2 md:pt-0">
          <Button
            className="border border-[var(--border)] font-black h-11 px-6 !bg-[#F05A4A] !text-white shadow-[var(--shadow-sm)] hover:!translate-y-[-2px] transition-transform text-sm border border-[var(--border)] w-full md:w-auto"
            onClick={() => navigate('/final-level-tests')}
          >
            LÀM BÀI THI
          </Button>
        </div>
      </div>
    </div>
  );
};
