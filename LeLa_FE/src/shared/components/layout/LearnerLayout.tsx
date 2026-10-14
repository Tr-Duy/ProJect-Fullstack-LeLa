import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Dropdown, Badge, Popover } from 'antd';
import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ThunderboltFilled,
  FireFilled,
  UserOutlined,
  LogoutOutlined,
  CreditCardOutlined,
  SettingOutlined,
  RocketOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../features/notifications/api/notifications.api';
import { voiceConversationApi } from '../../../features/voice-conversation/api/voice-conversation.api';
import bubblePopSound from '../../../assets/sounds/bubble-pop.mp3';
import { useRealtimeMetadata } from '../../hooks/useRealtimeMetadata';
import { DailyGoalPromptModal } from '../../../features/users/components/DailyGoalPromptModal';
import { ChatWidget } from '../../../features/chat/components/ChatWidget';
import { LEARNER_NAV_GROUPS, MOBILE_BOTTOM_TABS } from '../../config/navConfig';
import { StatChip } from '../ui/StatChip';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export function LearnerLayout() {
  useRealtimeMetadata();
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar collapsed state with localStorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lela_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lela_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Click bubble sound effect
  useEffect(() => {
    const audio = new Audio(bubblePopSound);
    audio.load();

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.getAttribute('role') === 'button' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const queryClient = useQueryClient();

  const { data: unreadResp } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnread({ size: 5 }),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: voiceStatusResp } = useQuery({
    queryKey: ['voice-conversation', 'status'],
    queryFn: voiceConversationApi.getStatus,
    enabled: !!user,
    staleTime: 60000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = unreadResp?.data?.totalElements || 0;
  const notifications = unreadResp?.data?.content || [];
  const voiceStatus = voiceStatusResp?.data;

  // Determine active page title for topbar (clean Lexend 600, no highlighter/underline)
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Bảng học tập hôm nay';
    if (path.startsWith('/decks')) return 'Khám phá bộ thẻ từ vựng';
    if (path.startsWith('/my-decks')) return 'Bộ thẻ của tôi';
    if (path.startsWith('/study')) return 'Phiên ôn tập SM-2';
    if (path.startsWith('/typing-game')) return 'Luyện gõ từ vựng';
    if (path.startsWith('/voice-conversation')) return 'Hội thoại tiếng Anh với AI';
    if (path.startsWith('/ai-chat')) return 'Trợ lý học tập AI Tutor';
    if (path.startsWith('/quizzes') || path.startsWith('/quiz')) return 'Lộ trình & bài thi TOEIC';
    if (path.startsWith('/placement-tests')) return 'Kiểm tra trình độ đầu vào';
    if (path.startsWith('/final-level-tests')) return 'Bài thi kết thúc level';
    if (path.startsWith('/achievements')) return 'Kho thành tích & huy hiệu';
    if (path.startsWith('/leaderboard')) return 'Bảng vinh danh tuần';
    if (path.startsWith('/profile')) return 'Hồ sơ cá nhân';
    if (path.startsWith('/pricing')) return 'Gói cước & quyền lợi';
    return 'Lela TOEIC';
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span className="font-medium" onClick={() => navigate('/profile')}>Trang cá nhân</span>,
    },
    {
      key: 'pricing',
      icon: <CreditCardOutlined />,
      label: <span className="font-medium" onClick={() => navigate('/pricing')}>Gói cước & thanh toán</span>,
    },
    {
      key: 'goal',
      icon: <SettingOutlined />,
      label: <span className="font-medium" onClick={() => navigate('/profile#goals')}>Mục tiêu học ngày</span>,
    },
    ...(hasRole(['ADMIN', 'CONTENT_CREATOR'])
      ? [
          {
            key: 'admin',
            icon: <RocketOutlined className="text-[var(--brand)]" />,
            label: (
              <span className="font-semibold text-[var(--brand)]" onClick={() => navigate('/admin/dashboard')}>
                Trang Quản trị
              </span>
            ),
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="text-[var(--danger)]" />,
      label: <span className="font-medium text-[var(--danger)]" onClick={handleLogout}>Đăng xuất</span>,
    },
  ];

  const notificationPopoverContent = (
    <div className="w-80 max-h-96 overflow-y-auto bg-white rounded-[16px] shadow-[var(--shadow-md)] border border-[var(--border)]">
      <div className="flex justify-between items-center p-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
        <span className="font-display font-semibold text-xs text-[var(--text)]">
          Thông báo ({unreadCount})
        </span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-xs text-[var(--text-3)]">
          Không có thông báo mới
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`p-3 text-xs transition-colors ${
                !n.isRead ? 'bg-[var(--brand-50)]/40 font-medium' : 'hover:bg-[var(--surface-2)]'
              }`}
            >
              <div className="text-[var(--text)] mb-0.5">{n.title || n.message}</div>
              {n.title && <div className="text-[var(--text-2)] text-[11px] mb-1 font-normal">{n.message}</div>}
              <div className="text-[10px] text-[var(--text-3)]">
                {new Date(n.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const displayName = user?.fullName?.trim() || user?.username || '';
  const initialLetter = displayName ? displayName[0].toUpperCase() : 'L';

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] font-sans antialiased">
      {/* =========================================================================
          DESKTOP SIDEBAR (>= 1024px)
          ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r border-[var(--border)] bg-white z-30 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-[256px]'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border)]">
          {!collapsed ? (
            <Link
              to="/dashboard"
              className="font-display font-bold text-2xl tracking-tight text-[var(--brand)] flex items-center"
            >
              LELA<span className="text-[var(--danger)]">.</span>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="font-display font-bold text-2xl tracking-tight text-[var(--brand)] mx-auto"
            >
              L<span className="text-[var(--danger)]">.</span>
            </Link>
          )}

          <button
            onClick={toggleSidebar}
            title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5 scrollbar-thin">
          {LEARNER_NAV_GROUPS.map((group) => (
            <div key={group.groupKey} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[13px] font-semibold text-[var(--text-3)]">
                  {group.groupLabel}
                </div>
              )}

              {group.items.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path.split('?')[0]);

                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3.5 h-11 rounded-[12px] text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold'
                        : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <span
                      className={`shrink-0 flex items-center justify-center text-lg ${
                        isActive ? 'text-[var(--brand-700)]' : 'text-[var(--text-3)]'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--brand-50)] text-[var(--brand-700)]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Sidebar: User Subscription Status Card */}
        {!collapsed ? (
          <div className="p-3 border-t border-[var(--border)]">
            <div className="rounded-[16px] bg-[var(--brand-50)] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--brand-700)]">
                  Gói của bạn
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[var(--brand-700)] border border-[var(--brand-100)]">
                  FREE
                </span>
              </div>

              {/* Dynamic limit from API, no hardcoded values */}
              {voiceStatus && (
                <p className="text-[11px] text-[var(--text-2)] leading-relaxed">
                  Dùng thử Hội thoại AI:{' '}
                  <strong className="text-[var(--brand-700)] font-semibold">
                    {voiceStatus.remainingQuota}/{voiceStatus.maxSessionsPerDay} buổi hôm nay
                  </strong>
                </p>
              )}

              <button
                onClick={() => navigate('/pricing')}
                className="w-full h-9 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white text-xs font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Nâng cấp PRO</span>
                <ArrowRightOutlined className="text-[10px]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[var(--border)] flex justify-center">
            <button
              onClick={() => navigate('/pricing')}
              title="Nâng cấp gói cước"
              className="w-10 h-10 rounded-[12px] bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <RocketOutlined />
            </button>
          </div>
        )}
      </aside>

      {/* =========================================================================
          MAIN APPLICATION AREA (Topbar + Page Outlet)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar (>= 1024px, 64px height) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white border-b border-[var(--border)] px-8 items-center justify-between">
          {/* Left: Dynamic Clean Page Title */}
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-lg text-[var(--text)] tracking-tight">
              {getPageTitle()}
            </span>
          </div>

          {/* Right: Metrics & Profile */}
          <div className="flex items-center gap-3">
            {/* Streak Chip */}
            <StatChip
              icon={<FireFilled className="text-[var(--flame)]" />}
              value={`${user?.streakCurrent || 0} ngày`}
            />

            {/* XP Chip */}
            <StatChip
              icon={<ThunderboltFilled className="text-[var(--xp)]" />}
              value={`${user?.xpTotal || 0} XP`}
            />

            {/* Notification Bell */}
            <Popover
              content={notificationPopoverContent}
              trigger="click"
              placement="bottomRight"
            >
              <div className="cursor-pointer">
                <Badge count={unreadCount} overflowCount={99} offset={[-2, 2]}>
                  <button
                    aria-label="Thông báo"
                    className="w-9 h-9 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-2)] transition-colors cursor-pointer"
                  >
                    <BellOutlined className="text-base" />
                  </button>
                </Badge>
              </div>
            </Popover>

            {/* User Avatar + Dropdown */}
            {user ? (
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <button
                  className="h-9 pl-1 pr-3 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] flex items-center gap-2 text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--brand)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initialLetter}
                  </div>
                  <span className="max-w-[140px] truncate">{displayName}</span>
                </button>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="h-9 px-4 rounded-[10px] bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-700)] transition-colors"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Mobile Topbar (< 1024px, 56px height) */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-white border-b border-[var(--border)] px-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="font-display font-bold text-xl tracking-tight text-[var(--brand)] flex items-center"
          >
            LELA<span className="text-[var(--danger)]">.</span>
          </Link>

          <div className="flex items-center gap-2">
            <Popover
              content={notificationPopoverContent}
              trigger="click"
              placement="bottomRight"
            >
              <div className="cursor-pointer">
                <Badge count={unreadCount} overflowCount={99} offset={[-2, 2]}>
                  <button
                    aria-label="Thông báo"
                    className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-2)]"
                  >
                    <BellOutlined className="text-sm" />
                  </button>
                </Badge>
              </div>
            </Popover>

            {user ? (
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <button
                  className="w-8 h-8 rounded-full bg-[var(--brand)] text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                  aria-label="Tài khoản cá nhân"
                >
                  {initialLetter}
                </button>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1 text-xs font-semibold bg-[var(--brand)] text-white rounded-[8px]"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Page Content Viewport with pb-24 (96px padding bottom) to prevent floating overlap */}
        <main className="flex-1 w-full bg-[var(--bg)] pb-24 lg:pb-16 min-w-0">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* =========================================================================
            MOBILE BOTTOM TAB BAR (< 1024px)
            ========================================================================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[var(--border)] z-40 px-2 flex items-center justify-around shadow-[0_-2px_12px_rgba(16,24,40,0.04)]">
          {MOBILE_BOTTOM_TABS.map((tab, idx) => {
            const isActive = location.pathname === tab.path;

            // Nút nổi ở giữa "Ôn ngay"
            if (idx === 2) {
              return (
                <div key="study-center" className="relative -top-3">
                  <button
                    onClick={() => navigate('/decks')}
                    title="Ôn tập thẻ ngay"
                    className="w-12 h-12 rounded-full bg-[var(--brand)] text-white flex flex-col items-center justify-center shadow-[var(--shadow-md)] active:scale-95 transition-transform cursor-pointer"
                  >
                    <ThunderboltFilled className="text-lg text-[var(--xp)]" />
                    <span className="text-[9px] font-semibold leading-none mt-0.5">Ôn ngay</span>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={tab.key}
                to={tab.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--brand)] font-semibold'
                    : 'text-[var(--text-3)] hover:text-[var(--text)]'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[10px] mt-0.5 leading-tight">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Prompt Daily Goal Modal */}
        <DailyGoalPromptModal />

        {/* Unified Live Chat Floating Widget (One single 52px button, no clipping) */}
        <ChatWidget />
      </div>
    </div>
  );
}
