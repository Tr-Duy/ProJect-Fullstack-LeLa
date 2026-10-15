import React from 'react';
import { CheckCircleFilled, ArrowRightOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

export interface MilestoneItem {
  id: string;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  actionText: string;
  onAction: () => void;
  badge?: string;
}

interface TodayMilestonesSectionProps {
  milestones: MilestoneItem[];
}

export const TodayMilestonesSection: React.FC<TodayMilestonesSectionProps> = ({ milestones }) => {
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const progressPercent = Math.round((completedCount / Math.max(1, milestones.length)) * 100);

  return (
    <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-[var(--text)] tracking-tight">
            Chặng hôm nay
          </h3>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Hoàn thành các bước để củng cố phản xạ ngôn ngữ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--brand)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-xs font-bold text-[var(--brand-700)] tabular-nums">
            {completedCount}/{milestones.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {milestones.map((item) => (
          <div
            key={item.id}
            className={`py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 transition-colors ${
              item.isCompleted ? 'opacity-85' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Checkmark icon with pop animation */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  item.isCompleted
                    ? 'bg-[var(--success-50)] text-[var(--success)] shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)]'
                }`}
              >
                {item.isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <CheckCircleFilled className="text-base" />
                  </motion.div>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[var(--border)]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold truncate ${
                      item.isCompleted
                        ? 'line-through text-[var(--text-3)]'
                        : 'text-[var(--text)]'
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--teal-50)] text-[var(--teal)] shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-3)] block truncate">
                  {item.subtitle}
                </span>
              </div>
            </div>

            {!item.isCompleted && (
              <button
                type="button"
                onClick={item.onAction}
                className="shrink-0 px-3 py-1.5 rounded-[10px] bg-[var(--surface-2)] hover:bg-[var(--brand-50)] text-[var(--brand-700)] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{item.actionText}</span>
                <ArrowRightOutlined className="text-[9px]" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayMilestonesSection;
