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
import { Lela } from '../../../shared/components/ui/Lela';
import { NextActionCard } from '../components/NextActionCard';
import { WordOfTheDayCard } from '../components/WordOfTheDayCard';
import { TodayMilestonesSection, type MilestoneItem } from '../components/TodayMilestonesSection';
import { ContinueLearningCarousel } from '../components/ContinueLearningCarousel';
import { SkillsPracticeSection } from '../components/SkillsPracticeSection';
import { DailyGoalSidebarCard } from '../components/DailyGoalSidebarCard';
import { LevelUpRoadmapSidebarCard } from '../components/LevelUpRoadmapSidebarCard';
import { TopLearnersSidebarCard } from '../components/TopLearnersSidebarCard';
import { getGreeting, formatLocalISODate } from '../../../shared/utils/dateUtils';
import { Stagger, StaggerItem } from '../../../ui/motion/Stagger';
import { useStreakData } from '../../gamification/hooks/useStreakData';

export function LearnerDashboardPage() {
  const navigate = useNavigate();
  const { currentStreak, weekDays } = useStreakData();

  const endDate = formatLocalISODate(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = formatLocalISODate(startDateObj);

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

  // Timezone-aware greeting
  const rawName = user?.fullName?.trim() || user?.username?.trim() || '';
  const greeting = useMemo(() => {
    return getGreeting(new Date(), rawName, (user as any)?.timezone);
  }, [rawName, user]);

  // Sub-line: lower-case Vietnamese date e.g. "thứ năm, 15 tháng 10" in user timezone
  const formattedDate = useMemo(() => {
    const tz = (user as any)?.timezone || 'Asia/Ho_Chi_Minh';
    try {
      const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      return formatter.format(new Date()).toLowerCase();
    } catch {
      return new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).toLowerCase();
    }
  }, [user]);

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

  // 7. Featured Vocabulary Cards from Current Deck
  const { data: deckCardsResp } = useQuery({
    queryKey: ['deck-cards-featured', continueDeck?.deck?.id],
    queryFn: () => flashcardsApi.getByDeckId(continueDeck!.deck!.id, { size: 10 }),
    enabled: !!continueDeck?.deck?.id,
  });
  const featuredCard = deckCardsResp?.content?.[0] || null;
  const wordOfTheDay = deckCardsResp?.content?.[1] || (deckCardsResp?.content?.length === 1 ? deckCardsResp?.content?.[0] : null);

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
  const streak = currentStreak;
  const xpToday = activityData?.data?.xpEarned || 0;
  const cardsReviewedToday = activityData?.data?.reviewCount || 0;
  const dailyGoalTarget = user?.dailyGoalCards || 20;
  const dueTodayCount = srsStats?.data?.dueTodayCount || srsStats?.data?.dueCount || 0;
  const isGoalMet = dailyGoalTarget > 0 && cardsReviewedToday >= dailyGoalTarget;

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

  // Milestones for "Chặng hôm nay"
  const milestones: MilestoneItem[] = useMemo(() => [
    {
      id: 'due-review',
      title: 'Ôn tập thẻ đến hạn',
      subtitle: dueTodayCount > 0 ? `Còn ${dueTodayCount} thẻ cần củng cố hôm nay` : 'Tuyệt vời, bạn đã hoàn thành thẻ đến hạn!',
      isCompleted: dueTodayCount === 0,
      actionText: 'Ôn ngay',
      onAction: handleStartReview,
    },
    {
      id: 'daily-goal',
      title: 'Chạm chỉ tiêu từ vựng ngày',
      subtitle: `${cardsReviewedToday}/${dailyGoalTarget} từ vựng đã ôn luyện`,
      isCompleted: isGoalMet,
      actionText: 'Học tiếp',
      onAction: handleLearnNew,
    },
    {
      id: 'voice-practice',
      title: 'Luyện phản xạ hội thoại AI',
      subtitle: voiceStatus?.unlocked
        ? (isFreeUser ? `Dùng thử ${voiceStatus.remainingQuota}/${voiceStatus.maxSessionsPerDay} buổi` : `Còn ${voiceStatus.remainingQuota} lượt hôm nay`)
        : 'Cần thêm từ vựng để mở khóa',
      isCompleted: voiceStatus ? (voiceStatus.maxSessionsPerDay - voiceStatus.remainingQuota > 0) : false,
      badge: 'AI',
      actionText: 'Nói ngay',
      onAction: handleStartVoiceAI,
    },
    {
      id: 'level-up',
      title: 'Thử thách nâng Level TOEIC',
      subtitle: `Lộ trình mục tiêu: ${levelName}`,
      isCompleted: false,
      actionText: 'Kiểm tra',
      onAction: handleStartQuiz,
    },
  ], [dueTodayCount, cardsReviewedToday, dailyGoalTarget, isGoalMet, voiceStatus, isFreeUser, levelName]);

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
    <div className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Error Notice */}
      {isProfileError && (
        <div className="p-4 bg-[var(--danger-50)] border border-[var(--danger)]/30 rounded-[16px] text-[var(--danger)] text-sm font-semibold flex justify-between items-center shadow-xs">
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

      {/* Row 0: Friendly Greeting with Lela Mascot & Speech Bubble */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lela
            mood={greeting.mood === 'sleepy' ? 'sleepy' : isGoalMet ? 'happy' : 'idle'}
            size={56}
            className="shrink-0"
          />
          <div>
            <SpeechBubble variant="brand" tail="bottom-left">
              <span>{greeting.text}</span>
            </SpeechBubble>
            <div className="text-xs text-[var(--text-3)] font-normal mt-1 pl-1 hidden sm:block">
              {formattedDate}
            </div>
          </div>
        </div>

        <span className="text-xs text-[var(--text-3)] sm:hidden pl-1">
          {formattedDate}
        </span>
      </div>

      {/* 12-Column Asymmetric Grid: 8 Columns Main + 4 Columns Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            MAIN COLUMN (8 COLS)
            ========================================================================= */}
        <div className="lg:col-span-8 space-y-8 min-w-0">
          <Stagger staggerMs={70} className="space-y-8">
            {/* 1. Next Priority Action Card ("Việc tiếp theo" with Real Vocab Card) */}
            <StaggerItem>
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
            </StaggerItem>

            {/* 2. "Chặng hôm nay": Micro-Milestones Checklist */}
            <StaggerItem>
              <TodayMilestonesSection milestones={milestones} />
            </StaggerItem>

            {/* 3. "Từ của hôm nay" (Word of the Day - if card exists) */}
            {wordOfTheDay && (
              <StaggerItem>
                <WordOfTheDayCard
                  card={wordOfTheDay}
                  onExplore={() => {
                    if (continueDeck?.deck?.id) {
                      navigate(`/decks/${continueDeck.deck.id}`);
                    }
                  }}
                />
              </StaggerItem>
            )}

            {/* 4. "Học tiếp": Horizontal Carousel of Enrolled Decks */}
            <StaggerItem>
              <ContinueLearningCarousel
                enrolledDecks={enrolledDecksData}
                isLoading={isLoadingEnrollments}
              />
            </StaggerItem>

            {/* 5. "Phòng luyện kỹ năng": 3 Distinct Practice Cards with custom SVGs */}
            <StaggerItem>
              <SkillsPracticeSection
                voiceStatus={voiceStatus}
                isFreeUser={isFreeUser}
              />
            </StaggerItem>
          </Stagger>
        </div>

        {/* =========================================================================
            SIDEBAR COLUMN (4 COLS)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          <Stagger staggerMs={80} className="space-y-6">
            {/* 6. Mục tiêu hôm nay: 140px Ring, 7 Weekday Dots, XP & Streak with CountUp */}
            <StaggerItem>
              <DailyGoalSidebarCard
                cardsReviewedToday={cardsReviewedToday}
                dailyGoalTarget={dailyGoalTarget}
                xpToday={xpToday}
                currentStreak={streak}
                historyData={historyData?.data}
                weekDays={weekDays}
              />
            </StaggerItem>

            {/* 7. Lộ trình lên Level: TOEIC band, 10 connected dots, cooldown */}
            <StaggerItem>
              <LevelUpRoadmapSidebarCard
                levelName={levelName}
                quizzes={levelUpQuizzes}
              />
            </StaggerItem>

            {/* 8. Bảng xếp hạng thu gọn: Top 3 + Pinned current user row */}
            <StaggerItem>
              <TopLearnersSidebarCard
                learners={topLearners}
                currentUserId={user?.id}
                currentUserXp={user?.xpTotal || 0}
              />
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    </div>
  );
}

export default LearnerDashboardPage;
