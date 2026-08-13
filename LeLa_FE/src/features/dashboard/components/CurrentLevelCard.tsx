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

  return (
    <div className="brutal-card brutal-shadow bg-white p-6 md:p-8 mb-8 border-[3px] border-black">
      <div className="flex flex-col gap-3">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-500">
          TRÌNH ĐỘ HIỆN TẠI
        </span>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mt-1">
          <div className="text-2xl md:text-3xl font-black text-[#1D2A3A] leading-snug break-words">
            {currentLevelName || 'Chưa xác định trình độ'}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0">
            {!hasCurrentLevel ? (
              <Button
                className="brutal-pill border-[2px] border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-12 px-6 shadow-[2px_2px_0px_0px_#000] text-sm md:text-base"
                onClick={() => navigate('/placement-tests')}
              >
                XÁC ĐỊNH TRÌNH ĐỘ NGAY
              </Button>
            ) : (
              <>
                <Button
                  className="brutal-border font-black uppercase h-12 px-6 !bg-[#F05A4A] !text-white shadow-[2px_2px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform text-sm md:text-base border-[2px] border-black"
                  onClick={() => navigate('/quizzes?category=FINAL')}
                >
                  LÀM BÀI KIỂM TRA KẾT THÚC CẤP ĐỘ
                </Button>
                <Button
                  className="brutal-border font-bold h-12 px-6 bg-[#F4F3EE] hover:bg-[#e4e3de] hover:-translate-y-1 transition-all text-sm md:text-base border-[2px] border-black text-[#1D2A3A]"
                  onClick={() => navigate('/onboarding')}
                >
                  Đổi mức độ
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
