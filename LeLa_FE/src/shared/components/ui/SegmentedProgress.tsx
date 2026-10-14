import React from 'react';

interface SegmentedProgressProps {
  newCount?: number;
  learningCount?: number;
  reviewCount?: number;
  masteredCount?: number;
  total?: number;
  height?: number;
  className?: string;
  showLegend?: boolean;
}

export const SegmentedProgress: React.FC<SegmentedProgressProps> = ({
  newCount = 0,
  learningCount = 0,
  reviewCount = 0,
  masteredCount = 0,
  total,
  height = 8,
  className = '',
  showLegend = false,
}) => {
  const sum = total || Math.max(1, newCount + learningCount + reviewCount + masteredCount);

  const pNew = Math.max(0, (newCount / sum) * 100);
  const pLearning = Math.max(0, (learningCount / sum) * 100);
  const pReview = Math.max(0, (reviewCount / sum) * 100);
  const pMastered = Math.max(0, (masteredCount / sum) * 100);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div
        className="w-full bg-[var(--surface-2)] overflow-hidden rounded-full flex items-center border border-[var(--border)]"
        style={{ height }}
        role="progressbar"
      >
        {pMastered > 0 && (
          <div
            className="h-full bg-[var(--success)] transition-all duration-300"
            style={{ width: `${pMastered}%` }}
            title={`Thành thạo: ${masteredCount}`}
          />
        )}
        {pReview > 0 && (
          <div
            className="h-full bg-[var(--brand)] transition-all duration-300"
            style={{ width: `${pReview}%` }}
            title={`Ôn tập: ${reviewCount}`}
          />
        )}
        {pLearning > 0 && (
          <div
            className="h-full bg-[var(--warning)] transition-all duration-300"
            style={{ width: `${pLearning}%` }}
            title={`Đang học: ${learningCount}`}
          />
        )}
        {pNew > 0 && (
          <div
            className="h-full bg-[#D0D5DD] transition-all duration-300"
            style={{ width: `${pNew}%` }}
            title={`Mới: ${newCount}`}
          />
        )}
      </div>

      {showLegend && (
        <div className="flex items-center justify-between text-[11px] text-[var(--text-3)] font-sans pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block" />
            Thành thạo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] inline-block" />
            Ôn tập
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--warning)] inline-block" />
            Đang học
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D0D5DD] inline-block" />
            Mới
          </span>
        </div>
      )}
    </div>
  );
};
