import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LearnerLayout } from '../../shared/components/layout/LearnerLayout';
import { AdminLayout } from '../../shared/components/layout/AdminLayout';
import { LearnerThemeProvider } from '../../shared/providers/LearnerThemeProvider';
import { ThemeProvider } from '../../shared/providers/ThemeProvider';

// Lazy loading for all pages to optimize initial bundle size
const LandingPage = lazy(() => import('../../features/landing/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const TagsPage = lazy(() => import('../../features/master-data/pages/TagsPage').then(module => ({ default: module.TagsPage })));
const LanguagesPage = lazy(() => import('../../features/master-data/pages/LanguagesPage').then(module => ({ default: module.LanguagesPage })));
const UsersAdminPage = lazy(() => import('../../features/user-management/pages/UsersAdminPage').then(module => ({ default: module.UsersAdminPage })));
const TransactionsAdminPage = lazy(() => import('../../features/subscription/pages/TransactionsAdminPage').then(module => ({ default: module.TransactionsAdminPage })));
const SubscriptionPlansAdminPage = lazy(() => import('../../features/subscription/pages/SubscriptionPlansAdminPage').then(module => ({ default: module.SubscriptionPlansAdminPage })));
const NotificationsAdminPage = lazy(() => import('../../features/notifications/pages/NotificationsAdminPage').then(module => ({ default: module.NotificationsAdminPage })));
const TopicsAdminPage = lazy(() => import('../../features/master-data/pages/TopicsAdminPage').then(module => ({ default: module.TopicsAdminPage })));
const AchievementsAdminPage = lazy(() => import('../../features/quiz/pages/AchievementsAdminPage').then(module => ({ default: module.AchievementsAdminPage })));
const LearnerAchievementsPage = lazy(() => import('../../features/quiz/pages/LearnerAchievementsPage').then(module => ({ default: module.LearnerAchievementsPage })));
const DecksAdminPage = lazy(() => import('../../features/study-content/pages/DecksAdminPage').then(module => ({ default: module.DecksAdminPage })));
const FlashcardsAdminPage = lazy(() => import('../../features/study-content/pages/FlashcardsAdminPage').then(module => ({ default: module.FlashcardsAdminPage })));
const ExploreDecksPage = lazy(() => import('../../features/study-content/pages/ExploreDecksPage').then(module => ({ default: module.ExploreDecksPage })));
const MyDecksPage = lazy(() => import('../../features/study-content/pages/MyDecksPage').then(module => ({ default: module.MyDecksPage })));
const DeckDetailPage = lazy(() => import('../../features/study-content/pages/DeckDetailPage').then(module => ({ default: module.DeckDetailPage })));
const StudyPage = lazy(() => import('../../features/study-session/pages/StudyPage').then(module => ({ default: module.StudyPage })));
const QuizzesAdminPage = lazy(() => import('../../features/quiz/pages/QuizzesAdminPage').then(module => ({ default: module.QuizzesAdminPage })));
const QuizBuilderAdminPage = lazy(() => import('../../features/quiz/pages/QuizBuilderAdminPage').then(module => ({ default: module.QuizBuilderAdminPage })));
const QuizAttemptPage = lazy(() => import('../../features/quiz/pages/QuizAttemptPage').then(module => ({ default: module.QuizAttemptPage })));
const QuizAttemptResultPage = lazy(() => import('../../features/quiz/pages/QuizAttemptResultPage').then(module => ({ default: module.QuizAttemptResultPage })));
const MyQuizAttemptsPage = lazy(() => import('../../features/quiz/pages/MyQuizAttemptsPage').then(module => ({ default: module.MyQuizAttemptsPage })));
const QuizzesPage = lazy(() => import('../../features/quiz/pages/QuizzesPage').then(module => ({ default: module.QuizzesPage })));
const PlacementTestsPage = lazy(() => import('../../features/quiz/pages/PlacementTestsPage').then(module => ({ default: module.PlacementTestsPage })));
const FinalLevelAssessmentPage = lazy(() => import('../../features/quiz/pages/FinalLevelAssessmentPage').then(module => ({ default: module.FinalLevelAssessmentPage })));
const LeaderboardPage = lazy(() => import('../../features/gamification/pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));
const AiChatPage = lazy(() => import('../../features/ai-chat/pages/AiChatPage').then(module => ({ default: module.AiChatPage })));
const ProfilePage = lazy(() => import('../../features/users/pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const LearnerDashboardPage = lazy(() => import('../../features/dashboard/pages/LearnerDashboardPage').then(module => ({ default: module.LearnerDashboardPage })));
const PricingPage = lazy(() => import('../../features/subscription/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const AdminDashboardPage = lazy(() => import('../../features/dashboard/pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const AdminChatDashboard = lazy(() => import('../../features/chat/pages/AdminChatDashboard').then(module => ({ default: module.AdminChatDashboard })));

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const OAuth2RedirectHandler = lazy(() => import('../../features/auth/pages/OAuth2RedirectHandler').then(module => ({ default: module.OAuth2RedirectHandler })));
const OnboardingPage = lazy(() => import('../../features/auth/pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })));


const Unauthorized = () => <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-red-500">Unauthorized</div>;

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-geist-blue-500"></div>
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<LearnerThemeProvider><LandingPage /></LearnerThemeProvider>} />
      <Route path="/login" element={<LearnerThemeProvider><LoginPage /></LearnerThemeProvider>} />
      <Route path="/register" element={<LearnerThemeProvider><RegisterPage /></LearnerThemeProvider>} />
      <Route path="/oauth2/redirect" element={<LearnerThemeProvider><OAuth2RedirectHandler /></LearnerThemeProvider>} />
      <Route path="/pricing" element={<LearnerThemeProvider><PricingPage /></LearnerThemeProvider>} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Learner routes wrapped with LearnerThemeProvider and LearnerLayout */}
      <Route element={<LearnerThemeProvider><LearnerLayout /></LearnerThemeProvider>}>
        <Route path="/decks" element={<ExploreDecksPage />} />
        <Route path="/decks/:deckId" element={<DeckDetailPage />} />
        <Route element={<ProtectedRoute allowedRoles={['LEARNER']} />}>
          <Route path="/dashboard" element={<LearnerDashboardPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/placement-tests" element={<PlacementTestsPage />} />
          <Route path="/final-level-tests" element={<FinalLevelAssessmentPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/my-decks" element={<MyDecksPage />} />
          <Route path="/study/:deckId" element={<StudyPage />} />
          <Route path="/quiz/:quizId/start" element={<QuizAttemptPage />} />
          <Route path="/quiz-attempts/:publicId" element={<QuizAttemptPage />} />
          <Route path="/quiz-attempts/:publicId/result" element={<QuizAttemptResultPage />} />
          <Route path="/my-quiz-attempts" element={<MyQuizAttemptsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/achievements" element={<LearnerAchievementsPage />} />
          <Route path="/ai-chat" element={<AiChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin routes wrapped with ThemeProvider and AdminLayout */}
      <Route element={<ThemeProvider><AdminLayout /></ThemeProvider>}>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CONTENT_CREATOR', 'MODERATOR']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MODERATOR']} />}>
            <Route path="/admin/users" element={<UsersAdminPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/notifications" element={<NotificationsAdminPage />} />
            <Route path="/admin/transactions" element={<TransactionsAdminPage />} />
            <Route path="/admin/subscription-plans" element={<SubscriptionPlansAdminPage />} />
            <Route path="/admin/tags" element={<TagsPage />} />
            <Route path="/admin/languages" element={<LanguagesPage />} />
            <Route path="/admin/topics" element={<TopicsAdminPage />} />
            <Route path="/admin/achievements" element={<AchievementsAdminPage />} />
            <Route path="/admin/chat" element={<AdminChatDashboard />} />
          </Route>
          <Route path="/admin/decks" element={<DecksAdminPage />} />
          <Route path="/admin/decks/:deckId/flashcards" element={<FlashcardsAdminPage />} />
          <Route path="/admin/quizzes" element={<QuizzesAdminPage />} />
          <Route path="/admin/quizzes/new" element={<QuizBuilderAdminPage />} />
          <Route path="/admin/quizzes/:id/edit" element={<QuizBuilderAdminPage />} />
        </Route>
      </Route>
      </Routes>
    </Suspense>
  );
}
