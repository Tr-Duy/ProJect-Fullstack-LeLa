import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RulerProgress } from '../../../shared/components/ui/RulerProgress';
import { Stamp } from '../../../shared/components/ui/Stamp';
import { ArrowRightOutlined, TrophyOutlined } from '@ant-design/icons';
import type { UserAchievementProgressResponse } from '../../../shared/types/lela';

interface UpcomingBadgesSectionProps {
  achievements?: UserAchievementProgressResponse[];
}

export const UpcomingBadgesSection: React.FC<UpcomingBadgesSectionProps> = ({
  achievements = [],
}) => {
  const navigate = useNavigate();

  // Find badges that are in progress (not unlocked yet, sorted by progress desc)
  const inProgress = achievements
    .filter((a) => !a.isUnlocked)
    .sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0))
    .slice(0, 3);

  // Fallback items if none are partially completed
  const displayItems =
    inProgress.length > 0
      ? inProgress
      : achievements.slice(0, 3);

  return (
    <div className="bg-card rounded-[12px] p-5 sm:p-6 border-2 border-ink shadow-[4px_4px_0_var(--ink)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
          <div>
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-ink-mute">
              HUY HIỆU DANH GIÁ
            </span>
            <h3 className="text-lg font-bold font-display text-ink flex items-center gap-2">
              <TrophyOutlined className="text-brand" /> Sắp mở khóa
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/achievements')}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
          >
            Tất cả <ArrowRightOutlined className="text-[10px]" />
          </button>
        </div>

        {displayItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-mute font-mono">
            Chưa có huy hiệu nào đang chờ mở khóa.
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayItems.map((badge) => {
              const percent = badge.progressPercent || 0;
              const currentVal = badge.currentValue ?? 0;
              const targetVal = badge.conditionValue ?? 100;

              return (
                <div
                  key={badge.id || badge.code}
                  className="p-3 rounded-[8px] bg-paper/40 border border-line space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-ink">
                        {badge.title}
                      </span>
                      <span className="text-[11px] text-ink-mute line-clamp-1">
                        {badge.description || 'Hoàn thành thử thách để nhận huy hiệu'}
                      </span>
                    </div>
                    {badge.isUnlocked ? (
                      <Stamp text="ĐÃ MỞ" variant="mint" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded border border-brand/30 shrink-0">
                        +{badge.xpReward || 50} XP
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-ink-mute">
                      <span>Tiến độ</span>
                      <span className="font-bold text-ink tabular-nums">
                        {currentVal}/{targetVal} ({percent}%)
                      </span>
                    </div>
                    <RulerProgress percent={percent} color="brand" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-line text-[11px] text-ink-mute flex items-center justify-between">
        <span>Tích lũy XP để tăng cấp</span>
        <span
          className="font-mono text-brand font-bold cursor-pointer"
          onClick={() => navigate('/achievements')}
        >
          Kho thành tích →
        </span>
      </div>
    </div>
  );
};
