import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { dailyActivitiesApi } from '../../gamification/api/daily-activities.api';
import { srsReviewsApi } from '../../study-session/api/srs-reviews.api';
import { profileApi } from '../../users/api/profile.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { quizzesApi } from '../../quiz/api/quizzes.api';
import { voiceConversationApi } from '../../voice-conversation/api/voice-conversation.api';
import { leaderboardsApi } from '../../gamification/api/leaderboards.api';
import { achievementsApi } from '../../quiz/api/achievements.api';
import { userSubscriptionsApi } from '../../subscription/api/user-subscriptions.api';

import { TodayDueHero } from '../components/TodayDueHero';
import { DailyGoalRingCard } from '../components/DailyGoalRingCard';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import { PracticeRoomsSection } from '../components/PracticeRoomsSection';
import { LevelUpRoadmapSection } from '../components/LevelUpRoadmapSection';
import { StreakCalendarSection } from '../components/StreakCalendarSection';
import { TopLearnersSection } from '../components/TopLearnersSection';
import { UpcomingBadgesSection } from '../components/UpcomingBadgesSection';
import { FreeUpgradeBanner } from '../components/FreeUpgradeBanner';
import { SkeletonBox } from '../../../shared/components/ui/SkeletonBox';
import { HighlighterText } from '../../../shared/components/ui/HighlighterText';

export function LearnerDashboardPage() {
  const getLocalISODate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const endDate = getLocalISODate(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = getLocalISODate(startDateObj);

  // 1. Profile
  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
  });

  const user = profileResponse?.data;
  const username = user?.fullName || user?.username || 'học viên';
  const currentExamTypeId = user?.currentExamType?.id;
  const currentLevelId = user?.currentLevel?.id;
  const levelName = user?.currentLevel?.name || 'TOEIC Foundation';

  // 1b. Check active subscription
  const { data: userSubsResp } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => userSubscriptionsApi.getAll({ size: 100 }),
    retry: 1,
  });
  const activeSub = userSubsResp?.data?.content?.find((s: any) => s.status === 'ACTIVE');
  const isFreeUser = !activeSub;

  // 2. Today's Activity
  const { data: activityData } = useQuery({
    queryKey: ['daily-activity', 'today'],
    queryFn: () => dailyActivitiesApi.getToday(),
  });

  // 3. Activity History
  const { data: historyData } = useQuery({
    queryKey: ['daily-activity', 'history', startDate, endDate],
    queryFn: () => dailyActivitiesApi.getHistory({ startDate, endDate }),
  });

  // 4. SRS Statistics
  const { data: srsStats } = useQuery({
    queryKey: ['srs-statistics'],
    queryFn: () => srsReviewsApi.getStatistics(),
  });

  // 5. Enrolled Decks
  const { data: enrollmentsResponse, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 50 }),
  });

  const enrolledDecksData = useMemo(() => {
    const list = enrollmentsResponse?.data?.content || [];
    return list.map((enrollment) => {
      const deck: any = {
        id: enrollment.deckId,
        title: enrollment.deckTitle || `Bộ thẻ #${enrollment.deckId}`,
        slug: enrollment.deckSlug || `deck-${enrollment.deckId}`,
        coverImageUrl: enrollment.deckCoverImageUrl,
        totalCards: enrollment.deckTotalCards || 0,
        difficulty: enrollment.deckDifficulty || 'BEGINNER',
        levelName: enrollment.deckLevelName,
        levelCode: enrollment.deckLevelCode,
      };
      return { deck, enrollment };
    });
  }, [enrollmentsResponse?.data?.content]);

  // First uncompleted deck to continue
  const continueDeck = useMemo(() => {
    if (enrolledDecksData.length === 0) return null;
    const item = enrolledDecksData.find(({ deck, enrollment }) => {
      const mastered = enrollment?.masteredCards || 0;
      const total = deck.totalCards || 0;
      return total === 0 || mastered < total;
    });
    if (item) {
      return { deck: item.deck, masteredCards: item.enrollment?.masteredCards || 0 };
    }
    const first = enrolledDecksData[0];
    return first ? { deck: first.deck, masteredCards: first.enrollment?.masteredCards || 0 } : null;
  }, [enrolledDecksData]);

  // 6. Voice Status (Quota, limits)
  const { data: voiceStatusResp } = useQuery({
    queryKey: ['voice-status'],
    queryFn: () => voiceConversationApi.getStatus(),
    retry: 1,
  });
  const voiceStatus = voiceStatusResp?.data || null;

  // 7. Level-Up Quizzes for current level
  const { data: levelUpQuizzesResp, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['level-up-quizzes', currentExamTypeId, currentLevelId],
    queryFn: () => quizzesApi.search('LEVEL_UP', currentExamTypeId, currentLevelId),
    enabled: !!currentExamTypeId || !!currentLevelId,
    retry: 1,
  });
  const levelUpQuizzes = (levelUpQuizzesResp?.data as any[]) || [];

  // 8. Weekly Leaderboard Top 5
  const { data: leaderboardResp } = useQuery({
    queryKey: ['leaderboard-weekly-top5'],
    queryFn: () => leaderboardsApi.getWeekly({ size: 5 }),
    retry: 1,
  });
  const topLearners = (leaderboardResp?.data?.content as any[]) || [];

  // 9. Achievements Progress
  const { data: achievementsResp } = useQuery({
    queryKey: ['achievements-progress'],
    queryFn: () => achievementsApi.getMyProgress(),
    retry: 1,
  });
  const achievements = achievementsResp?.data || [];

  // Calculated numbers
  const streak = activityData?.data?.currentStreak || user?.streakCurrent || 0;
  const xpToday = activityData?.data?.xpEarned || 0;
  const cardsReviewedToday = activityData?.data?.reviewCount || 0;
  const dueTodayCount = srsStats?.data?.dueTodayCount || srsStats?.data?.dueCount || 0;

  // Date formatted in Vietnamese
  const todayFormatted = useMemo(() => {
    const now = new Date();
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = daysOfWeek[now.getDay()];
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${dayName}, ngày ${day} tháng ${month}, ${year}`;
  }, []);

  if (isProfileLoading) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <SkeletonBox height="36px" width="300px" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <SkeletonBox height="240px" />
          </div>
          <div className="lg:col-span-4">
            <SkeletonBox height="240px" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonBox height="180px" />
          <SkeletonBox height="180px" />
          <SkeletonBox height="180px" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Error Notice */}
      {isProfileError && (
        <div className="p-4 bg-coral/15 border-2 border-coral rounded-[10px] text-ink font-bold flex justify-between items-center">
          <span>Không thể tải dữ liệu mới nhất. Vui lòng thử lại.</span>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetchProfile()}
            className="border-ink font-bold bg-card"
          >
            Tải lại
          </Button>
        </div>
      )}

      {/* Greeting line & Date */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-1">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-ink-mute block mb-1">
            {todayFormatted}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-ink tracking-tight">
            Chào mừng trở lại, <HighlighterText text={username} highlight={username} />!
          </h1>
        </div>
        <div className="text-xs sm:text-sm font-sans text-ink-soft">
          Mục tiêu hôm nay: <span className="font-bold text-ink">Hoàn thành các thẻ đến hạn</span>
        </div>
      </div>

      {/* ROW 1: 12-Column Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 8 Cols Main Block: Due Cards & Primary CTAs */}
        <div className="lg:col-span-8">
          <TodayDueHero
            dueTodayCount={dueTodayCount}
            continueDeck={continueDeck}
            username={username}
          />
        </div>

        {/* 4 Cols Right Block: Daily Goal Progress Ring & Metrics */}
        <div className="lg:col-span-4">
          <DailyGoalRingCard
            cardsReviewedToday={cardsReviewedToday}
            dailyGoalTarget={user?.dailyGoalCards || 20}
            xpToday={xpToday}
            currentStreak={streak}
          />
        </div>
      </div>

      {/* Free Tier Upgrade Banner (Only if FREE user) */}
      {isFreeUser && (
        <FreeUpgradeBanner isFreeUser={isFreeUser} />
      )}

      {/* ROW 2: "Học tiếp" (Enrolled Decks) & "Phòng luyện" (3 Practice Rooms) */}
      <div className="space-y-8">
        <ContinueLearningSection
          enrolledDecks={enrolledDecksData}
          isLoading={isLoadingEnrollments}
        />

        <PracticeRoomsSection voiceStatus={voiceStatus} />
      </div>

      {/* ROW 3: Roadmap (Level-Up Stepper) & Community/Metrics Grid */}
      <div className="space-y-6">
        {/* 10-Step Level-Up Stepper */}
        <LevelUpRoadmapSection
          levelName={levelName}
          quizzes={levelUpQuizzes}
          isLoading={isLoadingQuizzes}
        />

        {/* 3-Column Community, Streak & Achievements Block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 14-day Streak Tracker */}
          <StreakCalendarSection
            currentStreak={streak}
            historyData={historyData?.data}
          />

          {/* Top 5 Weekly Leaderboard */}
          <TopLearnersSection
            learners={topLearners}
            currentUserId={user?.id}
          />

          {/* Upcoming Badges */}
          <UpcomingBadgesSection
            achievements={achievements}
          />
        </div>
      </div>
    </div>
  );
}
