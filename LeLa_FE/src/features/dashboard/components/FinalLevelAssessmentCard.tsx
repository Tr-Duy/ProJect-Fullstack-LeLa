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
    <div className="brutal-card brutal-shadow bg-white p-5 md:p-6 mb-8 border-[3px] border-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Icon Box & Information Hierarchy */}
        <div className="flex items-start md:items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#FFF4E5] border-[2px] border-black flex items-center justify-center text-[#F05A4A] text-xl shrink-0 shadow-[2px_2px_0px_0px_#000]">
            <TrophyOutlined />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500">
              🏆 THI KẾT THÚC LEVEL
            </span>
            <h3 className="text-lg md:text-xl font-black text-[#1D2A3A] leading-snug">
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
            className="brutal-border font-black uppercase h-11 px-6 !bg-[#F05A4A] !text-white shadow-[2px_2px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform text-sm border-[2px] border-black w-full md:w-auto"
            onClick={() => navigate('/final-level-tests')}
          >
            LÀM BÀI THI
          </Button>
        </div>
      </div>
    </div>
  );
};
