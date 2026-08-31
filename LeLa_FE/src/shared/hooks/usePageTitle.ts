import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitleMap: Record<string, string> = {
  '/': 'LeLa',
  '/login': 'LeLa - Đăng nhập',
  '/register': 'LeLa - Đăng ký',
  '/pricing': 'LeLa - Bảng giá gói học',
  '/onboarding': 'LeLa - Bắt đầu',
  '/dashboard': 'LeLa - Dashboard',
  '/decks': 'LeLa - Khám phá bộ thẻ',
  '/my-decks': 'LeLa - Bộ thẻ của tôi',
  '/placement-tests': 'LeLa - Đổi mức độ',
  '/final-level-tests': 'LeLa - Thi Kết Thúc Level',
  '/quizzes': 'LeLa - Bài kiểm tra',
  '/my-quiz-attempts': 'LeLa - Lịch sử làm bài',
  '/leaderboard': 'LeLa - Bảng xếp hạng',
  '/achievements': 'LeLa - Thành tích',
  '/ai-chat': 'LeLa - AI Tutor',
  '/profile': 'LeLa - Trang cá nhân',
  '/admin/dashboard': 'LeLa Admin - Dashboard',
  '/admin/users': 'LeLa Admin - Quản lý người dùng',
  '/admin/notifications': 'LeLa Admin - Gửi thông báo',
  '/admin/transactions': 'LeLa Admin - Giao dịch',
  '/admin/subscription-plans': 'LeLa Admin - Gói đăng ký',
  '/admin/tags': 'LeLa Admin - Quản lý thẻ (Tags)',
  '/admin/languages': 'LeLa Admin - Quản lý ngôn ngữ',
  '/admin/topics': 'LeLa Admin - Quản lý chủ đề',
  '/admin/achievements': 'LeLa Admin - Quản lý thành tựu',
  '/admin/decks': 'LeLa Admin - Quản lý bộ thẻ',
  '/admin/quizzes': 'LeLa Admin - Quản lý bài kiểm tra',
  '/admin/quizzes/new': 'LeLa Admin - Tạo bài kiểm tra',
  '/admin/chat': 'LeLa Admin - Chat Hỗ trợ',
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    // Direct match
    if (routeTitleMap[pathname]) {
      document.title = routeTitleMap[pathname];
      return;
    }

    // Pattern matches
    if (pathname.startsWith('/study/')) {
      document.title = 'LeLa - Học thẻ';
    } else if (pathname.startsWith('/decks/')) {
      document.title = 'LeLa - Chi tiết bộ thẻ';
    } else if (pathname.startsWith('/quiz/') || pathname.startsWith('/quiz-attempts/')) {
      if (pathname.endsWith('/result')) {
        document.title = 'LeLa - Kết quả kiểm tra';
      } else {
        document.title = 'LeLa - Làm bài kiểm tra';
      }
    } else if (pathname.startsWith('/admin/decks/')) {
      document.title = 'LeLa Admin - Quản lý Flashcards';
    } else if (pathname.startsWith('/admin/quizzes/')) {
      document.title = 'LeLa Admin - Quản lý bài kiểm tra';
    } else if (pathname.startsWith('/admin')) {
      document.title = 'LeLa Admin';
    } else {
      document.title = 'LeLa';
    }
  }, [location.pathname]);
}
