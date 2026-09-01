import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { dailyActivitiesApi } from '../../gamification/api/daily-activities.api';
import { srsReviewsApi } from '../../study-session/api/srs-reviews.api';
import { profileApi } from '../../users/api/profile.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { decksApi } from '../../study-content/api/decks.api';

import { DashboardHero } from '../components/DashboardHero';
import { CurrentLevelCard } from '../components/CurrentLevelCard';
import { FinalLevelAssessmentCard } from '../components/FinalLevelAssessmentCard';
import { ContinueLearningSection } from '../components/ContinueLearningSection';
import { RecommendedDecksSection } from '../components/RecommendedDecksSection';
import { StatsSection } from '../components/StatsSection';
import { ActivityHeatmapSection } from '../components/ActivityHeatmapSection';
import { QuickActionsSection } from '../components/QuickActionsSection';

export function LearnerDashboardPage() {
  const getLocalISODate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const endDate = getLocalISODate(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 364);
  const startDate = getLocalISODate(startDateObj);

  // 1. Fetch Today's Activity
  const { data: activityData } = useQuery({
    queryKey: ['daily-activity', 'today'],
    queryFn: () => dailyActivitiesApi.getToday(),
  });

  // 2. Fetch Activity History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['daily-activity', 'history', startDate, endDate],
    queryFn: () => dailyActivitiesApi.getHistory({ startDate, endDate }),
  });

  // 3. Fetch SRS Statistics
  const { data: srsStats } = useQuery({
    queryKey: ['srs-statistics'],
    queryFn: () => srsReviewsApi.getStatistics(),
  });

  // 4. Fetch Me Profile
  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
  });

  // 5. Fetch Enrolled Decks
  const { data: enrollmentsResponse, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 100 }),
  });

  const enrollments = enrollmentsResponse?.data?.content || [];

  const enrolledDecksData = useMemo(() => {
    return enrollments.map((enrollment) => {
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
  }, [enrollments]);

  const isLoadingDecks = isLoadingEnrollments;

  // 6. Fetch Recommended Decks for User's Level
  const currentExamTypeId = profileResponse?.data?.currentExamType?.id;
  const currentLevelId = profileResponse?.data?.currentLevel?.id;

  const { data: exploreDecksResponse, isLoading: isLoadingExplore } = useQuery({
    queryKey: ['explore-decks', currentExamTypeId, currentLevelId],
    queryFn: () =>
      decksApi.getAll({
        size: 20,
        examTypeId: currentExamTypeId,
        levelId: currentLevelId,
      }),
    enabled: !!currentExamTypeId && !!currentLevelId,
  });

  const enrolledDeckIds = useMemo(() => {
    return new Set(enrollments.map((e) => e.deckId));
  }, [enrollments]);

  const recommendedDecks = useMemo(() => {
    const all = exploreDecksResponse?.content || [];
    return all.filter((d: any) => !enrolledDeckIds.has(d.id));
  }, [exploreDecksResponse, enrolledDeckIds]);

  // Data variables
  const user = profileResponse?.data;
  const username = user?.fullName || user?.username || 'bạn';
  const currentLevel = user?.currentLevel;
  const hasCurrentLevel = !!currentLevel;
  const levelName = currentLevel?.name;

  const streak = activityData?.data?.currentStreak || 0;
  const xp = activityData?.data?.xpEarned || 0;
  const totalXp = user?.xpTotal || 0;
  const totalCardsLearned = srsStats?.data?.totalCardsLearned || 0;
  const masteredPercent = srsStats?.data?.masteryPercentage || 0;
  const dueTodayCount = srsStats?.data?.dueTodayCount || srsStats?.data?.dueCount || 0;

  const sortedEnrolledDecks = useMemo(() => {
    return [...enrolledDecksData].sort((a, b) => {
      const aMastered = a.enrollment?.masteredCards || 0;
      const aTotal = a.deck.totalCards || 0;
      const aCompleted = aTotal > 0 && aMastered >= aTotal;
      const aInProgress = aMastered > 0 && !aCompleted;

      const bMastered = b.enrollment?.masteredCards || 0;
      const bTotal = b.deck.totalCards || 0;
      const bCompleted = bTotal > 0 && bMastered >= bTotal;
      const bInProgress = bMastered > 0 && !bCompleted;

      // Priority 1: In progress (0 < progress < 100%)
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;

      // Priority 3: Completed (100%) last
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      return 0;
    });
  }, [enrolledDecksData]);

  const continueDeck = useMemo(() => {
    if (sortedEnrolledDecks.length === 0) return null;

    // Find the first deck that is NOT 100% completed
    const uncompletedItem = sortedEnrolledDecks.find(({ deck, enrollment }) => {
      const mastered = enrollment?.masteredCards || 0;
      const total = deck.totalCards || 0;
      return total === 0 || mastered < total;
    });

    if (!uncompletedItem) return null; // All decks are 100% completed!

    return {
      deck: uncompletedItem.deck,
      masteredCards: uncompletedItem.enrollment?.masteredCards || 0,
    };
  }, [sortedEnrolledDecks]);

  const allCompleted = useMemo(() => {
    if (enrolledDecksData.length === 0) return false;
    return enrolledDecksData.every(({ deck, enrollment }) => {
      const mastered = enrollment?.masteredCards || 0;
      const total = deck.totalCards || 0;
      return total > 0 && mastered >= total;
    });
  }, [enrolledDecksData]);

  // Render Skeleton while initial profile is loading
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton active avatar paragraph={{ rows: 3 }} className="brutal-card bg-white p-8" />
          <Skeleton active paragraph={{ rows: 2 }} className="brutal-card bg-white p-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Skeleton active className="brutal-card bg-white p-6" />
            <Skeleton active className="brutal-card bg-white p-6" />
            <Skeleton active className="brutal-card bg-white p-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Error Notice */}
        {isProfileError && (
          <div className="mb-6 p-4 bg-red-100 border-[2px] border-black text-red-800 font-bold flex justify-between items-center">
            <span>Không thể tải đầy đủ dữ liệu thông tin cá nhân.</span>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchProfile()}
              className="brutal-pill border-black bg-white font-bold"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* SECTION 1: HERO BANNER (Primary CTA) */}
        <DashboardHero
          username={username}
          levelName={levelName}
          dueTodayCount={dueTodayCount}
          continueDeck={continueDeck}
          hasCurrentLevel={hasCurrentLevel}
          allCompleted={allCompleted}
        />

        {/* SECTION 2: CURRENT LEVEL */}
        <CurrentLevelCard
          currentLevelName={levelName}
          hasCurrentLevel={hasCurrentLevel}
        />

        {/* SECTION 2B: FINAL LEVEL ASSESSMENT */}
        <FinalLevelAssessmentCard
          levelName={levelName}
          hasCurrentLevel={hasCurrentLevel}
        />

        {/* SECTION 3: CONTINUE LEARNING / MY DECKS */}
        <ContinueLearningSection
          enrolledDecks={sortedEnrolledDecks}
          isLoading={isLoadingEnrollments || isLoadingDecks}
        />

        {/* SECTION 4: RECOMMENDED DECKS (Based on current level) */}
        {hasCurrentLevel && (
          <RecommendedDecksSection
            levelName={levelName}
            recommendedDecks={recommendedDecks}
            isLoading={isLoadingExplore}
          />
        )}

        {/* SECTION 5: COMPACT STATS (Streak, XP, Mastery) */}
        <StatsSection
          streak={streak}
          xp={xp}
          totalXp={totalXp}
          totalCardsLearned={totalCardsLearned}
          masteredPercent={masteredPercent}
        />

        {/* SECTION 6: INTERACTIVE ACTIVITY HEATMAP */}
        <ActivityHeatmapSection
          historyData={historyData?.data}
          isLoading={isLoadingHistory}
        />

        {/* SECTION 7: QUICK ACTIONS */}
        <QuickActionsSection />
      </div>
    </div>
  );
}
