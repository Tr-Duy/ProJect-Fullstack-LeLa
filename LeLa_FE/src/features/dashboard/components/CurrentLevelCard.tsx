import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface CurrentLevelCardProps {
  currentLevelName?: string;
  hasCurrentLevel: boolean;
}

export const CurrentLevelCard: React.FC<CurrentLevelCardProps> = ({
  currentLevelName,
  hasCurrentLevel,
}) => {
  const navigate = useNavigate();

  const parseLevel = (rawName?: string) => {
    if (!rawName) return { title: 'Chưa xác định trình độ', range: null };
    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { title: match[1].trim(), range: match[2].trim() };
    }
    return { title: rawName, range: null };
  };

  const { title, range } = parseLevel(currentLevelName);

  return (
    <div className="brutal-card brutal-shadow bg-white p-5 md:p-6 mb-5 border-[3px] border-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Label, Level Name & Score Badge */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
            TRÌNH ĐỘ HIỆN TẠI
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-black text-[#1D2A3A] leading-tight">
              {title}
            </h2>
            {range && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border-[2px] border-black bg-[#F4F3EE] text-xs md:text-sm font-extrabold text-brand-navy shadow-[1px_1px_0px_0px_#000]">
                {range}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Change Level Button */}
        <div className="shrink-0 pt-2 sm:pt-0">
          {!hasCurrentLevel ? (
            <Button
              className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-11 px-5 shadow-[2px_2px_0px_0px_#000] text-sm"
              onClick={() => navigate('/placement-tests')}
            >
              XÁC ĐỊNH TRÌNH ĐỘ NGAY
            </Button>
          ) : (
            <Button
              className="brutal-border font-bold h-11 px-5 bg-[#F4F3EE] hover:bg-[#e4e3de] hover:-translate-y-0.5 transition-all text-sm border-[2px] border-black text-[#1D2A3A] shadow-[2px_2px_0px_0px_#000]"
              onClick={() => navigate('/placement-tests')}
            >
              Đổi mức độ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
