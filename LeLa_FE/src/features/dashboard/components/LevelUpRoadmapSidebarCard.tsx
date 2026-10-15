import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFilled, ClockCircleOutlined, LockFilled, ArrowRightOutlined } from '@ant-design/icons';
import type { QuizResponse } from '../../../shared/types/lela';

interface LevelUpRoadmapSidebarCardProps {
  levelName?: string;
  quizzes?: QuizResponse[];
  isLoading?: boolean;
}

export const LevelUpRoadmapSidebarCard: React.FC<LevelUpRoadmapSidebarCardProps> = ({
  levelName = 'TOEIC 450 - 650',
  quizzes = [],
}) => {
  const navigate = useNavigate();

  // 10 Level-Up Steps
  const steps = Array.from({ length: 10 }, (_, index) => {
    const existing = quizzes[index];
    const status =
      (existing as any)?.attemptStatus ||
      (existing?.isLocked ? 'LOCKED' : index === 0 ? 'AVAILABLE' : 'LOCKED');
    const isPassed = status === 'COMPLETED_PASSED' || status === 'PASSED';
    const isWaiting = status === 'WAITING_24H';
    const isAvailable = status === 'AVAILABLE';

    return {
      index: index + 1,
      id: existing?.id,
      isPassed,
      isWaiting,
      isAvailable,
      isLocked: !isPassed && !isWaiting && !isAvailable,
    };
  });

  const passedCount = steps.filter((s) => s.isPassed).length;
  const progressPercent = Math.round((passedCount / 10) * 100);

  return (
    <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-3)]">
          Lộ trình tăng Level
        </span>
        <span className="text-xs font-bold text-[var(--brand-700)] bg-[var(--brand-50)] px-2.5 py-0.5 rounded-full">
          {levelName}
        </span>
      </div>

      {/* Progress towards next level */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[var(--text-2)] font-medium">Tiến độ chuỗi 10 bài</span>
          <span className="font-bold text-[var(--text)] tabular-nums">{passedCount}/10 bài</span>
        </div>
        <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden border border-[var(--border)]">
          <div
            className="h-full bg-[var(--brand)] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 10 Connected Dots in 2 rows or flex strip */}
      <div className="pt-2">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            let dotStyle = 'bg-[var(--surface-2)] text-[var(--text-3)] border-[var(--border)]';
            let icon = <span className="text-[11px] font-semibold">{step.index}</span>;

            if (step.isPassed) {
              dotStyle = 'bg-[var(--success-50)] text-[var(--success)] border-[var(--success)]/30 font-bold';
              icon = <CheckCircleFilled className="text-xs" />;
            } else if (step.isAvailable) {
              dotStyle = 'bg-[var(--brand)] text-[#2A1300] border-[var(--brand)] font-bold shadow-sm animate-pulse';
              icon = <span className="text-[11px] font-bold">{step.index}</span>;
            } else if (step.isWaiting) {
              dotStyle = 'bg-[var(--warning-50)] text-[var(--warning)] border-[var(--warning)]/30';
              icon = <ClockCircleOutlined className="text-xs" />;
            } else {
              icon = <LockFilled className="text-[10px] text-[var(--text-3)]" />;
            }

            return (
              <button
                key={step.index}
                type="button"
                disabled={!step.isAvailable && !step.isPassed}
                onClick={() => {
                  if (step.id) {
                    navigate(`/quiz/${step.id}/start`);
                  } else {
                    navigate('/quizzes?category=LEVEL_UP');
                  }
                }}
                className={`h-9 rounded-[10px] border flex items-center justify-center transition-all ${dotStyle} ${
                  step.isAvailable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
                title={`Bài thi #${step.index}`}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/quizzes?category=LEVEL_UP')}
        className="w-full h-9 rounded-[10px] bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--brand-700)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>Xem toàn bộ lộ trình</span>
        <ArrowRightOutlined className="text-[10px]" />
      </button>
    </div>
  );
};
