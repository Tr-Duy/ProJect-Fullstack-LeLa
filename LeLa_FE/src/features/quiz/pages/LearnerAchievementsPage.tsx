import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Award, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { achievementsApi } from '../api/achievements.api';
import type { UserAchievementProgressResponse } from '../../../shared/types/lela';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả danh mục' },
  { key: 'START', label: '👋 Khởi đầu' },
  { key: 'STREAK', label: '🔥 Chuỗi ngày học' },
  { key: 'FLASHCARDS', label: '🎴 Từ vựng' },
  { key: 'DECK', label: '📚 Bộ thẻ' },
  { key: 'QUIZ', label: '📝 Kiểm tra' },
  { key: 'TOEIC', label: '🏆 Level TOEIC' },
  { key: 'TOPIC', label: '🌐 Chủ đề' },
  { key: 'MASTERY', label: '👑 Bậc thầy' },
];

export function LearnerAchievementsPage() {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['my-achievements-progress'],
    queryFn: () => achievementsApi.getMyProgress(),
  });

  const progressList = data?.data || [];
  const unlockedCount = progressList.filter((a) => a.isUnlocked).length;
  const totalXpEarned = progressList
    .filter((a) => a.isUnlocked)
    .reduce((acc, a) => acc + (a.xpReward || 0), 0);

  const filteredList = progressList.filter((a) => {
    const matchesCat = selectedCat === 'ALL' || a.category?.toUpperCase() === selectedCat;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNLOCKED' && a.isUnlocked) ||
      (statusFilter === 'LOCKED' && !a.isUnlocked);
    return matchesCat && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-20 pointer-events-none">
          <Trophy className="w-96 h-96" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-yellow-200" /> Hệ thống Gamification LeLa
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Bảng Thành Tựu & Danh Hiệu</h1>
          <p className="text-amber-100 text-sm sm:text-base max-w-2xl mb-6">
            Duy trì chuỗi học, hoàn thành bài test và chinh phục từ vựng TOEIC để mở khóa các danh hiệu và nhận điểm thưởng XP!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <div className="text-xs text-amber-200 font-semibold mb-1">ĐÃ MỞ KHÓA</div>
              <div className="text-2xl sm:text-3xl font-black flex items-baseline gap-1">
                {unlockedCount} <span className="text-sm font-normal text-amber-200">/ {progressList.length}</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <div className="text-xs text-amber-200 font-semibold mb-1">TỔNG XP NHẬN ĐƯỢC</div>
              <div className="text-2xl sm:text-3xl font-black text-yellow-200">
                +{totalXpEarned} <span className="text-sm font-normal text-amber-200">XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* CATEGORY TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCat(c.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === c.key
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* STATUS FILTER */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tất cả ({progressList.length})
          </button>
          <button
            onClick={() => setStatusFilter('UNLOCKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'UNLOCKED' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Đã mở ({unlockedCount})
          </button>
          <button
            onClick={() => setStatusFilter('LOCKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'LOCKED' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Chưa đạt ({progressList.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* ACHIEVEMENTS GRID */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-500 font-medium">Đang tải tiến trình thành tựu của bạn...</div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center text-gray-500 font-medium">Không tìm thấy thành tựu nào trong danh mục này.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((item) => (
            <AchievementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ item }: { item: UserAchievementProgressResponse }) {
  const percent = item.progressPercent ?? 0;
  const isUnlocked = item.isUnlocked;

  return (
    <div
      className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
        isUnlocked
          ? 'bg-gradient-to-br from-amber-50/80 to-yellow-50/50 border-amber-300 shadow-md shadow-amber-500/5 hover:-translate-y-1'
          : 'bg-white border-gray-200 shadow-sm opacity-90 hover:border-gray-300'
      }`}
    >
      {/* BADGE CATEGORY ICON */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${
              isUnlocked
                ? 'bg-amber-100 border-amber-300'
                : 'bg-gray-100 border-gray-200 grayscale opacity-60'
            }`}
          >
            {item.iconUrl || '🏆'}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isUnlocked
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1'
                : 'bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1'
            }`}
          >
            {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
            {isUnlocked ? 'ĐÃ MỞ KHÓA' : 'CHƯA ĐẠT'}
          </span>
        </div>

        <h3 className="font-extrabold text-lg text-gray-900 mb-1 flex items-center gap-2">
          {item.title}
        </h3>
        <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed">{item.description}</p>
      </div>

      <div>
        {/* PROGRESS BAR */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
            <span>Tiến trình</span>
            <span>
              {item.currentValue ?? 0} / {item.conditionValue ?? 1}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-gray-300/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlocked
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        </div>

        {/* FOOTER REWARD XP */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200/60">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phần thưởng</span>
          <span className="font-black text-xs px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" /> +{item.xpReward} XP
          </span>
        </div>
      </div>
    </div>
  );
}
