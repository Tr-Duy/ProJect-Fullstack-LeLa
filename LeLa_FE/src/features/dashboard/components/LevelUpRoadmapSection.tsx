import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stamp } from '../../../shared/components/ui/Stamp';
import { HighlighterText } from '../../../shared/components/ui/HighlighterText';
import {
  LockOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { QuizResponse } from '../../../shared/types/lela';

interface LevelUpRoadmapSectionProps {
  levelName?: string;
  quizzes?: QuizResponse[];
  isLoading?: boolean;
}

export const LevelUpRoadmapSection: React.FC<LevelUpRoadmapSectionProps> = ({
  levelName = 'TOEIC Foundation',
  quizzes = [],
}) => {
  const navigate = useNavigate();

  // Generate 10 standard steps if quizzes are fewer or map existing ones
  const steps = Array.from({ length: 10 }, (_, index) => {
    const existing = quizzes[index];
    const quizCode = existing?.quizCode || `LV-${index + 1}`;
    const title = existing?.title || `Bài ${index + 1}`;
    const status = (existing as any)?.attemptStatus || (existing?.isLocked ? 'LOCKED' : index === 0 ? 'AVAILABLE' : 'LOCKED');
    const isPassed = status === 'COMPLETED_PASSED' || status === 'PASSED';
    const isWaiting = status === 'WAITING_24H';
    const isAvailable = status === 'AVAILABLE';
    const isLocked = !isPassed && !isAvailable && !isWaiting;

    return {
      index: index + 1,
      id: existing?.id,
      quizCode,
      title,
      isPassed,
      isWaiting,
      isAvailable,
      isLocked,
      lockReason: existing?.lockReason,
    };
  });

  return (
    <div className="bg-card rounded-[12px] p-6 border-2 border-ink shadow-[4px_4px_0_var(--ink)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-ink-mute">
              CHUỖI THỬ THÁCH 10 BÀI
            </span>
            <Stamp text={levelName} variant="neutral" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight flex items-center gap-2">
            <HighlighterText text="Lộ trình nâng cấp Level" highlight="Lộ trình" />
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/final-level-tests')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-paper-2 text-ink font-bold text-xs border border-ink shadow-[2px_2px_0_var(--ink)] hover:bg-paper cursor-pointer transition-all"
          >
            <TrophyOutlined className="text-coral" />
            <span>Thi kết thúc Level</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/quizzes?category=LEVEL_UP')}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
          >
            Tất cả <ArrowRightOutlined className="text-[10px]" />
          </button>
        </div>
      </div>

      {/* 10-Step Horizontal Timeline on desktop, scrollable */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
        <div className="flex items-center gap-3 min-w-[720px] py-1">
          {steps.map((step) => {
            let badgeBg = 'bg-paper-2 text-ink-mute border-line';
            let statusText = 'Khóa';

            if (step.isPassed) {
              badgeBg = 'bg-mint text-ink border-ink font-bold shadow-[2px_2px_0_var(--ink)]';
              statusText = 'Đạt';
            } else if (step.isAvailable) {
              badgeBg = 'bg-sun text-ink border-ink font-bold shadow-[2px_2px_0_var(--ink)] animate-pulse';
              statusText = 'Mở';
            } else if (step.isWaiting) {
              badgeBg = 'bg-paper-2 text-coral border-coral font-bold';
              statusText = 'Chờ 24h';
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
                className={`flex-1 p-3 rounded-[10px] border-2 text-left transition-all ${
                  step.isAvailable
                    ? 'border-ink bg-card hover:bg-paper-2 hover:translate-y-[-2px] cursor-pointer shadow-[3px_3px_0_var(--ink)]'
                    : step.isPassed
                    ? 'border-ink bg-paper/50 cursor-pointer'
                    : 'border-line/80 bg-paper/30 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-ink">
                    #{step.index}
                  </span>
                  {step.isPassed ? (
                    <CheckCircleFilled className="text-mint text-sm" />
                  ) : step.isWaiting ? (
                    <ClockCircleOutlined className="text-coral text-xs" />
                  ) : step.isAvailable ? (
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  ) : (
                    <LockOutlined className="text-ink-mute text-xs" />
                  )}
                </div>

                <div className="text-xs font-bold text-ink truncate mb-1">
                  {step.title}
                </div>

                <span
                  className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] border ${badgeBg}`}
                >
                  {statusText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-ink-mute font-sans flex items-center justify-between flex-wrap gap-2 pt-1">
        <span>Quy tắc: Hoàn thành theo chuỗi tuần tự. Đạt từ 80% câu đúng để chuyển tiếp bài kế tiếp.</span>
        <button
          type="button"
          onClick={() => navigate('/placement-tests')}
          className="text-xs font-mono font-bold text-ink underline hover:text-brand cursor-pointer"
        >
          Đổi mức độ TOEIC →
        </button>
      </div>
    </div>
  );
};
