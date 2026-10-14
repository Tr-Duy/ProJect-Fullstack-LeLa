import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyFilled, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';

interface Learner {
  userId?: number;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  xp?: number;
  rank?: number;
}

interface TopLearnersSidebarCardProps {
  learners?: Learner[];
  currentUserId?: number;
  currentUserXp?: number;
}

export const TopLearnersSidebarCard: React.FC<TopLearnersSidebarCardProps> = ({
  learners = [],
  currentUserId,
  currentUserXp = 0,
}) => {
  const navigate = useNavigate();

  // Top 3
  const topThree = learners.slice(0, 3);
  const userInTopThree = topThree.some((l) => l.userId === currentUserId);

  return (
    <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)] shadow-[var(--shadow-sm)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-3)] flex items-center gap-1.5">
          <TrophyFilled className="text-[var(--xp)]" />
          Bảng xếp hạng tuần
        </span>
        <button
          type="button"
          onClick={() => navigate('/leaderboard')}
          className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
        >
          Chi tiết
        </button>
      </div>

      {/* Top 3 List */}
      <div className="space-y-2">
        {topThree.length === 0 ? (
          <div className="py-4 text-center text-xs text-[var(--text-3)]">
            Đang cập nhật xếp hạng...
          </div>
        ) : (
          topThree.map((item, idx) => {
            const rank = item.rank || idx + 1;
            const isMe = item.userId === currentUserId;
            const name = item.fullName || item.username || `Thành viên #${rank}`;
            const xp = item.xp || 0;

            const medalColor =
              rank === 1
                ? 'bg-[#FEF3C7] text-[#D97706]'
                : rank === 2
                ? 'bg-[#F3F4F6] text-[#4B5563]'
                : 'bg-[#FFEDD5] text-[#C2410C]';

            return (
              <div
                key={item.userId || idx}
                className={`flex items-center justify-between p-2.5 rounded-[12px] transition-colors ${
                  isMe ? 'bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold' : 'bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${medalColor}`}
                  >
                    {rank}
                  </span>

                  <div className="w-7 h-7 rounded-full bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center text-xs text-[var(--text-3)] shrink-0">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <UserOutlined />
                    )}
                  </div>

                  <span className="text-xs font-medium text-[var(--text)] max-w-[110px] truncate">
                    {name} {isMe && '(Bạn)'}
                  </span>
                </div>

                <span className="text-xs font-semibold text-[var(--text)] tabular-nums">
                  {xp.toLocaleString()} XP
                </span>
              </div>
            );
          })
        )}

        {/* Current user pinned row if not in top 3 */}
        {!userInTopThree && (
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-[var(--brand-700)] font-bold shrink-0">
                  ★
                </span>
                <span className="text-xs truncate">Vị trí của bạn</span>
              </div>
              <span className="text-xs tabular-nums">
                {currentUserXp.toLocaleString()} XP
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/leaderboard')}
        className="w-full h-9 rounded-[10px] bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--brand-700)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>Xem bảng xếp hạng đầy đủ</span>
        <ArrowRightOutlined className="text-[10px]" />
      </button>
    </div>
  );
};
