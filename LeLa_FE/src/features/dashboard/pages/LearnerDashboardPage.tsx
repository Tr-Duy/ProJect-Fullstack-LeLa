import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dailyActivitiesApi } from '../../gamification/api/daily-activities.api';
import { srsReviewsApi } from '../../study-session/api/srs-reviews.api';
import { profileApi } from '../../users/api/profile.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { flashcardsApi } from '../../study-content/api/flashcards.api';
import { quizzesApi } from '../../quiz/api/quizzes.api';
import { voiceConversationApi } from '../../voice-conversation/api/voice-conversation.api';
import { leaderboardsApi } from '../../gamification/api/leaderboards.api';
import { userSubscriptionsApi } from '../../subscription/api/user-subscriptions.api';

import { SpeechBubble } from '../../../shared/components/ui/SpeechBubble';
import { SkeletonBox } from '../../../shared/components/ui/SkeletonBox';
import { NextActionCard } from '../components/NextActionCard';
import { ContinueLearningCarousel } from '../components/ContinueLearningCarousel';
import { SkillsPracticeSection } from '../components/SkillsPracticeSection';
import { DailyGoalSidebarCard } from '../components/DailyGoalSidebarCard';
import { LevelUpRoadmapSidebarCard } from '../components/LevelUpRoadmapSidebarCard';
import { TopLearnersSidebarCard } from '../components/TopLearnersSidebarCard';

export function LearnerDashboardPage() {
  const navigate = useNavigate();

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
  const currentExamTypeId = user?.currentExamType?.id;
  const currentLevelId = user?.currentLevel?.id;
  const levelName = user?.currentLevel?.name || 'TOEIC 450 - 650';

  // Greeting name logic: Never leave trailing comma
  const rawName = user?.fullName?.trim() || user?.username?.trim() || '';
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) {
      timeGreeting = 'Chào buổi chiều';
    } else if (hour >= 18) {
      timeGreeting = 'Chào buổi tối';
    }

    return rawName ? `${timeGreeting}, ${rawName}!` : `${timeGreeting}!`;
  }, [rawName]);

  // Sub-line: lower-case Vietnamese date e.g. "thứ năm, 15 tháng 10"
  const formattedDate = useMemo(() => {
    const now = new Date();
    const days = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy'];
    const dayOfWeek = days[now.getDay()];
    const day = now.getDate();
    const month = now.getMonth() + 1;
    return `${dayOfWeek}, ngày ${day} tháng ${month}`;
  }, []);

  // 2. Subscription status
  const { data: userSubsResp } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => userSubscriptionsApi.getAll({ size: 100 }),
    retry: 1,
  });
  const activeSub = userSubsResp?.data?.content?.find((s: any) => s.status === 'ACTIVE');
  const isFreeUser = !activeSub;

  // 3. Today's Activity
  const { data: activityData } = useQuery({
    queryKey: ['daily-activity', 'today'],
    queryFn: () => dailyActivitiesApi.getToday(),
  });

  // 4. Activity History
  const { data: historyData } = useQuery({
    queryKey: ['daily-activity', 'history', startDate, endDate],
    queryFn: () => dailyActivitiesApi.getHistory({ startDate, endDate }),
  });

  // 5. SRS Statistics
  const { data: srsStats } = useQuery({
    queryKey: ['srs-statistics'],
    queryFn: () => srsReviewsApi.getStatistics(),
  });

  // 6. Enrolled Decks
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

  // 7. Real Flashcard for the Hero Card
  const { data: deckCardsResp } = useQuery({
    queryKey: ['deck-cards-featured', continueDeck?.deck?.id],
    queryFn: () => flashcardsApi.getByDeckId(continueDeck!.deck!.id, { size: 5 }),
    enabled: !!continueDeck?.deck?.id,
    staleTime: 60000,
  });
  const featuredCard = deckCardsResp?.content?.[0] || null;

  // 8. Voice Status
  const { data: voiceStatusResp } = useQuery({
    queryKey: ['voice-status'],
    queryFn: () => voiceConversationApi.getStatus(),
    retry: 1,
  });
  const voiceStatus = voiceStatusResp?.data || null;

  // 9. Level-Up Quizzes
  const { data: levelUpQuizzesResp } = useQuery({
    queryKey: ['level-up-quizzes', currentExamTypeId, currentLevelId],
    queryFn: () => quizzesApi.search('LEVEL_UP', currentExamTypeId, currentLevelId),
    enabled: !!currentExamTypeId || !!currentLevelId,
    retry: 1,
  });
  const levelUpQuizzes = (levelUpQuizzesResp?.data as any[]) || [];

  // 10. Weekly Leaderboard Top 5
  const { data: leaderboardResp } = useQuery({
    queryKey: ['leaderboard-weekly-top5'],
    queryFn: () => leaderboardsApi.getWeekly({ size: 5 }),
    retry: 1,
  });
  const topLearners = (leaderboardResp?.data?.content as any[]) || [];

  // Calculated numbers
  const streak = activityData?.data?.currentStreak || user?.streakCurrent || 0;
  const xpToday = activityData?.data?.xpEarned || 0;
  const cardsReviewedToday = activityData?.data?.reviewCount || 0;
  const dailyGoalTarget = user?.dailyGoalCards || 20;
  const dueTodayCount = srsStats?.data?.dueTodayCount || srsStats?.data?.dueCount || 0;

  // Handlers for priority actions
  const handleStartReview = () => {
    if (continueDeck?.deck?.id) {
      navigate(`/study/${continueDeck.deck.id}`);
    } else {
      navigate('/my-decks');
    }
  };

  const handleLearnNew = () => {
    navigate('/decks');
  };

  const handleStartVoiceAI = () => {
    navigate('/voice-conversation');
  };

  const handleStartQuiz = () => {
    navigate('/quizzes?category=LEVEL_UP');
  };

  if (isProfileLoading) {
    return (
      <div className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <SkeletonBox height={36} width={240} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <SkeletonBox height={240} />
          </div>
          <div className="lg:col-span-4">
            <SkeletonBox height={240} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonBox height={200} />
          <SkeletonBox height={200} />
          <SkeletonBox height={200} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-friendly-enter">
      {/* Error Notice */}
      {isProfileError && (
        <div className="p-4 bg-[var(--danger-50)] border border-[var(--danger)]/30 rounded-[16px] text-[var(--danger)] text-sm font-semibold flex justify-between items-center">
          <span>Không thể đồng bộ dữ liệu mới nhất. Vui lòng thử lại.</span>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetchProfile()}
            className="border-[var(--danger)] text-[var(--danger)]"
          >
            Tải lại
          </Button>
        </div>
      )}

      {/* Row 0: Friendly Greeting with Speech Bubble */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <SpeechBubble variant="brand" tail="bottom-left">
            <span>{greetingText}</span>
          </SpeechBubble>
          <span className="text-xs text-[var(--text-3)] font-normal hidden sm:inline">
            {formattedDate}
          </span>
        </div>

        <span className="text-xs text-[var(--text-3)] sm:hidden">
          {formattedDate}
        </span>
      </div>

      {/* 12-Column Asymmetric Grid: 8 Columns Main + 4 Columns Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            MAIN COLUMN (8 COLS)
            ========================================================================= */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Next Priority Action Card ("Việc tiếp theo" with Real Vocab Card) */}
          <NextActionCard
            dueTodayCount={dueTodayCount}
            dailyGoalTarget={dailyGoalTarget}
            cardsReviewedToday={cardsReviewedToday}
            featuredCard={featuredCard}
            onStartReview={handleStartReview}
            onLearnNew={handleLearnNew}
            onStartVoiceAI={handleStartVoiceAI}
            onStartQuiz={handleStartQuiz}
            hasVoiceQuota={voiceStatus?.unlocked && (voiceStatus?.remainingQuota ?? 0) > 0}
          />

          {/* 2. "Học tiếp": Horizontal Carousel of Enrolled Decks */}
          <ContinueLearningCarousel
            enrolledDecks={enrolledDecksData}
            isLoading={isLoadingEnrollments}
          />

          {/* 3. "Luyện kỹ năng": 3 Distinct Practice Cards */}
          <SkillsPracticeSection
            voiceStatus={voiceStatus}
            isFreeUser={isFreeUser}
          />
        </div>

        {/* =========================================================================
            SIDEBAR COLUMN (4 COLS)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* 4. Mục tiêu hôm nay: 140px Ring, 7 Weekday Dots, XP & Streak single-line */}
          <DailyGoalSidebarCard
            cardsReviewedToday={cardsReviewedToday}
            dailyGoalTarget={dailyGoalTarget}
            xpToday={xpToday}
            currentStreak={streak}
            historyData={historyData?.data}
          />

          {/* 5. Lộ trình lên Level: TOEIC band, 10 connected dots, cooldown */}
          <LevelUpRoadmapSidebarCard
            levelName={levelName}
            quizzes={levelUpQuizzes}
          />

          {/* 6. Bảng xếp hạng thu gọn: Top 3 + Pinned current user row */}
          <TopLearnersSidebarCard
            learners={topLearners}
            currentUserId={user?.id}
            currentUserXp={user?.xpTotal || 0}
          />
        </div>
      </div>
    </div>
  );
}
