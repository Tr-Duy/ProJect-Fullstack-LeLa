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
    <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white p-5 md:p-6 mb-5 border border-[var(--border)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Label, Level Name & Score Badge */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-black  text-gray-500">
            TRÌNH ĐỘ HIỆN TẠI
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-black text-[#2B1B0E] leading-tight">
              {title}
            </h2>
            {range && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-[var(--border)] bg-[#F4F3EE] text-xs md:text-sm font-extrabold text-brand-navy shadow-[var(--shadow-sm)]">
                {range}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Change Level Button */}
        <div className="shrink-0 pt-2 sm:pt-0">
          {!hasCurrentLevel ? (
            <Button
              className="brutal-pill border border-[var(--border)] font-black text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-11 px-5 shadow-[var(--shadow-sm)] text-sm"
              onClick={() => navigate('/placement-tests')}
            >
              XÁC ĐỊNH TRÌNH ĐỘ NGAY
            </Button>
          ) : (
            <Button
              className="border border-[var(--border)] font-bold h-11 px-5 bg-[#F4F3EE] hover:bg-[#e4e3de] hover:-translate-y-0.5 transition-all text-sm border border-[var(--border)] text-[#2B1B0E] shadow-[var(--shadow-sm)]"
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
