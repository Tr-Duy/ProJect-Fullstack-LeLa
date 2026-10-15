import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Trophy,
  Target,
  GraduationCap,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { profileApi } from '../../users/api/profile.api';
import { dailyActivitiesApi } from '../../gamification/api/daily-activities.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { quizAttemptsApi } from '../../quiz/api/quiz-attempts.api';
import { useStreakData } from '../../gamification/hooks/useStreakData';
import { SegmentedProgress } from '../../../shared/components/ui/SegmentedProgress';

interface ContextPanelProps {
  onQuickAsk: (prompt: string) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ onQuickAsk }) => {
  // 1. Profile data
  const { data: profileResp } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    staleTime: 5 * 60 * 1000,
  });
  const user = profileResp?.data;

  // 2. Streak data
  const { currentStreak } = useStreakData();

  // 3. Today's activity
  const { data: todayActivityResp } = useQuery({
    queryKey: ['daily-activity', 'today'],
    queryFn: () => dailyActivitiesApi.getToday(),
    staleTime: 60 * 1000,
  });
  const todayActivity = todayActivityResp?.data;

  // 4. Enrolled Decks (top 2)
  const { data: enrollmentsResp } = useQuery({
    queryKey: ['my-enrollments-summary'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 2 }),
    staleTime: 2 * 60 * 1000,
  });
  const recentEnrollments = enrollmentsResp?.data?.content || [];

  // 5. Latest Quiz Attempt
  const { data: quizAttemptsResp } = useQuery({
    queryKey: ['my-latest-quiz-attempt'],
    queryFn: () => quizAttemptsApi.getMyAttempts({ size: 1, sort: 'createdAt,desc' }),
    staleTime: 5 * 60 * 1000,
  });
  const latestAttempt = quizAttemptsResp?.data?.content?.[0];

  // Derived user stats
  const levelName = user?.currentLevel?.name;
  const xp = user?.xpTotal;
  const streak = typeof user?.streakCurrent === 'number' ? user.streakCurrent : currentStreak;
  const cardsToday = todayActivity
    ? (todayActivity.cardsLearned || 0) + (todayActivity.reviewCount || 0)
    : undefined;
  const targetCards = user?.dailyGoalCards || 20;

  let latestQuizScore: string | null = null;
  if (latestAttempt) {
    if (typeof latestAttempt.score === 'number') {
      latestQuizScore = `${latestAttempt.score}%`;
    } else if (typeof latestAttempt.correctAnswers === 'number' && typeof latestAttempt.totalQuestions === 'number') {
      latestQuizScore = `${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions}`;
    }
  }

  const QUICK_QUESTIONS = [
    'Tôi nên ôn gì hôm nay?',
    'Điều kiện thi lên Level là gì?',
    'Tóm tắt tiến độ của tôi',
  ];

  return (
    <div className="flex flex-col gap-3.5 text-[var(--text)] select-none">
      {/* Card 1: Context about user */}
      <section className="bg-[var(--chrome)] border border-[var(--border)] rounded-[20px] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--brand-700)] uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span>Mình đang biết về bạn</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {levelName && (
            <div className="h-9 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[var(--text-2)]">
                <GraduationCap className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Trình độ</span>
              </span>
              <span className="font-semibold text-[var(--text)] truncate max-w-[140px] text-right">
                {levelName}
              </span>
            </div>
          )}

          {typeof streak === 'number' && streak > 0 && (
            <div className="h-9 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[var(--text-2)]">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>Chuỗi học</span>
              </span>
              <span className="font-semibold text-[var(--text)]">
                {streak} ngày liên tục
              </span>
            </div>
          )}

          {typeof xp === 'number' && (
            <div className="h-9 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[var(--text-2)]">
                <Trophy className="w-3.5 h-3.5 text-[var(--sun)]" />
                <span>Điểm kinh nghiệm</span>
              </span>
              <span className="font-semibold text-[var(--text)]">
                {xp.toLocaleString('vi-VN')} XP
              </span>
            </div>
          )}

          {typeof cardsToday === 'number' && (
            <div className="h-9 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[var(--text-2)]">
                <Target className="w-3.5 h-3.5 text-[var(--teal)]" />
                <span>Hôm nay</span>
              </span>
              <span className="font-semibold text-[var(--text)]">
                {cardsToday} / {targetCards} thẻ
              </span>
            </div>
          )}

          {latestQuizScore && (
            <div className="h-9 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[var(--text-2)]">
                <Award className="w-3.5 h-3.5 text-[var(--brand-700)]" />
                <span>Bài thi gần nhất</span>
              </span>
              <span className="font-semibold text-[var(--text)]">
                {latestQuizScore}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Card 2: Quick prompts */}
      <section className="bg-[var(--chrome)] border border-[var(--border)] rounded-[20px] p-4 shadow-[var(--shadow-sm)]">
        <h3 className="text-[13px] font-semibold text-[var(--text)] mb-2.5">
          Hỏi nhanh
        </h3>
        <div className="flex flex-col gap-1.5">
          {QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onQuickAsk(question)}
              className="flex items-center justify-between p-2 rounded-xl bg-white border border-[var(--border)] text-left text-[12px] font-medium text-[var(--text)] hover:border-[var(--brand)] hover:text-[var(--brand-700)] hover:bg-[var(--surface-2)]/40 transition-all group"
            >
              <span className="truncate pr-1">{question}</span>
              <ArrowRight className="w-3 h-3 text-[var(--text-3)] group-hover:text-[var(--brand)] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Card 3: Enrolled decks */}
      {recentEnrollments.length > 0 && (
        <section className="bg-[var(--chrome)] border border-[var(--border)] rounded-[20px] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[13px] font-semibold text-[var(--text)]">
              Bộ thẻ đang học
            </h3>
            <span className="text-[11px] text-[var(--text-3)]">
              Bấm để hỏi từ khó
            </span>
          </div>

          <div className="space-y-3">
            {recentEnrollments.map((item: any) => {
              const deckTitle = item.deckTitle || `Bộ thẻ #${item.deckId}`;
              const mastered = item.masteredCards || 0;
              const total = item.deckTotalCards || Math.max(mastered, 1);
              const learning = Math.max(0, (item.learningCards || 0));
              const review = Math.max(0, (item.reviewCards || 0));
              const newCards = Math.max(0, total - (mastered + learning + review));

              return (
                <button
                  key={item.id || item.deckId}
                  type="button"
                  onClick={() => onQuickAsk(`Giải thích các từ khó trong bộ "${deckTitle}"`)}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--brand)] transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--text)] group-hover:text-[var(--brand-700)] transition-colors truncate">
                      {deckTitle}
                    </span>
                    <BookOpen className="w-3.5 h-3.5 text-[var(--text-3)] group-hover:text-[var(--brand)] shrink-0" />
                  </div>

                  <SegmentedProgress
                    masteredCount={mastered}
                    reviewCount={review}
                    learningCount={learning}
                    newCount={newCards}
                    total={total}
                    height={6}
                  />

                  <div className="flex items-center justify-between text-[10px] text-[var(--text-3)]">
                    <span>Thành thạo: {mastered}/{total}</span>
                    <span className="font-medium text-[var(--brand-700)]">Hỏi AI ➔</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer attribution */}
      <footer className="text-center py-1">
        <span className="text-[12px] text-[var(--text-3)]">
          Trả lời bởi Gemini
        </span>
      </footer>
    </div>
  );
};
