import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyFilled, ArrowRightOutlined, UserOutlined } from '@ant-design/icons';

interface TopLearner {
  userId?: number;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  xp?: number;
  rank?: number;
}

interface TopLearnersSectionProps {
  learners?: TopLearner[];
  currentUserId?: number;
  isLoading?: boolean;
}

export const TopLearnersSection: React.FC<TopLearnersSectionProps> = ({
  learners = [],
  currentUserId,
}) => {
  const navigate = useNavigate();

  // If no API data yet, provide a fallback slice
  const topFive = learners.length > 0 ? learners.slice(0, 5) : [];

  return (
    <div className="bg-card rounded-[12px] p-5 sm:p-6 border-2 border-ink shadow-[4px_4px_0_var(--ink)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
          <div>
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-ink-mute">
              BẢNG VINH DANH TUẦN
            </span>
            <h3 className="text-lg font-bold font-display text-ink flex items-center gap-2">
              <TrophyFilled className="text-sun" /> Top 5 tuần này
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/leaderboard')}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
          >
            Xem tất cả <ArrowRightOutlined className="text-[10px]" />
          </button>
        </div>

        {topFive.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-mute font-mono">
            Đang cập nhật bảng xếp hạng tuần...
          </div>
        ) : (
          <div className="space-y-2">
            {topFive.map((item, index) => {
              const rank = item.rank || index + 1;
              const isCurrentUser = item.userId === currentUserId;
              const name = item.fullName || item.username || `Thành viên #${rank}`;
              const xpVal = item.xp || 0;

              return (
                <div
                  key={item.userId || index}
                  className={`flex items-center justify-between p-2 rounded-[8px] border transition-all ${
                    isCurrentUser
                      ? 'bg-sun/20 border-ink font-bold shadow-[2px_2px_0_var(--ink)]'
                      : 'bg-paper/40 border-line/70 hover:bg-paper'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-[6px] border flex items-center justify-center font-mono text-xs font-bold ${
                        rank === 1
                          ? 'bg-sun text-ink border-ink'
                          : rank === 2
                          ? 'bg-paper-2 text-ink border-ink'
                          : rank === 3
                          ? 'bg-[#E6A15C] text-ink border-ink'
                          : 'bg-paper text-ink-mute border-line'
                      }`}
                    >
                      {rank}
                    </span>

                    <div className="w-7 h-7 rounded-full bg-paper-2 border border-ink overflow-hidden flex items-center justify-center text-xs text-ink-mute">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>

                    <span className="text-xs font-medium text-ink max-w-[130px] truncate">
                      {name} {isCurrentUser && '(Bạn)'}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-ink tabular-nums">
                    {xpVal.toLocaleString()} XP
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-line text-[11px] text-ink-mute flex items-center justify-between">
        <span>Đặt lại vào 00:00 thứ Hai</span>
        <span className="font-mono text-brand font-bold cursor-pointer" onClick={() => navigate('/leaderboard')}>
          Bảng xếp hạng →
        </span>
      </div>
    </div>
  );
};
