import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Dropdown, Badge, Popover, Drawer, Tooltip } from 'antd';
import {
  BellOutlined,
  ThunderboltFilled,
  FireFilled,
  UserOutlined,
  LogoutOutlined,
  CreditCardOutlined,
  SettingOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  HelpCircle,
  Settings,
  Menu as MenuIcon,
  X as CloseIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../features/notifications/api/notifications.api';
import { voiceConversationApi } from '../../../features/voice-conversation/api/voice-conversation.api';
import { srsReviewsApi } from '../../../features/study-session/api/srs-reviews.api';
import bubblePopSound from '../../../assets/sounds/bubble-pop.mp3';
import { useRealtimeMetadata } from '../../hooks/useRealtimeMetadata';
import { DailyGoalPromptModal } from '../../../features/users/components/DailyGoalPromptModal';
import { ChatWidget } from '../../../features/chat/components/ChatWidget';
import { LEARNER_NAV_GROUPS, DASHBOARD_NAV_ITEM } from '../../config/navConfig';
import { SidebarNavItem } from './SidebarNavItem';
import { StatChip } from '../ui/StatChip';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { AnimatedOutlet } from '../../../ui/motion';
import { useStreakData } from '../../../features/gamification/hooks/useStreakData';

export function LearnerLayout() {
  useRealtimeMetadata();
  const { user, logout, hasRole } = useAuth();
  const { currentStreak } = useStreakData();
  const navigate = useNavigate();
  const location = useLocation();
  // Route check: fitViewport (calc(100dvh - 64px), no bottom padding, overflow hidden)
  const isFitViewport =
    location.pathname === '/ai-chat' ||
    location.pathname === '/voice-conversation' ||
    location.pathname.startsWith('/study/');

  // Sidebar collapsed state with localStorage persistence ('lela.sidebar')
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lela.sidebar') === 'collapsed';
  });

  // Mobile Drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sidebar navigation scroll ref
  const desktopNavRef = useRef<HTMLElement>(null);

  // Close mobile drawer and ensure sidebar navigation scrolls to top on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    if (desktopNavRef.current) {
      desktopNavRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lela.sidebar', next ? 'collapsed' : 'expanded');
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

  const { data: srsStatsResp } = useQuery({
    queryKey: ['srs-statistics'],
    queryFn: () => srsReviewsApi.getStatistics(),
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
  const dueTodayCount = srsStatsResp?.data?.dueTodayCount || srsStatsResp?.data?.dueCount || 0;

  // Determine active page title for topbar
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

  // Check user tier
  const isPro = user?.roles?.includes('PRO') || (voiceStatus as any)?.subscriptionTier === 'PRO';

  // Reusable Sidebar Content for both Desktop and Mobile Drawer
  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-[var(--chrome)] select-none">
        {/* 1. Header (64px, border-b 1px var(--border)) */}
        <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <Link
            to="/dashboard"
            onClick={isMobile ? () => setMobileDrawerOpen(false) : undefined}
            className="flex items-center gap-2.5 group cursor-pointer focus-visible:outline-none"
          >
            {/* Square Logo badge: 36x36 rounded 10px bg var(--brand) */}
            <div className="w-9 h-9 rounded-[10px] bg-[var(--brand)] flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
              <span className="font-display font-bold text-lg text-[#2A1300] leading-none">
                L
              </span>
            </div>

            {(!isCollapsed || isMobile) && (
              <span className="font-display font-bold text-[20px] text-[var(--text)] tracking-tight">
                LeLa
              </span>
            )}
          </Link>

          {/* Collapse button on Desktop */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              aria-expanded={!collapsed}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              {collapsed ? (
                <ChevronRight size={18} strokeWidth={1.75} />
              ) : (
                <ChevronLeft size={18} strokeWidth={1.75} />
              )}
            </button>
          )}

          {/* Close button on Mobile Drawer */}
          {isMobile && (
            <button
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Đóng thanh điều hướng"
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors cursor-pointer"
            >
              <CloseIcon size={20} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* 2. Navigation Groups (flex: 1, overflow-y: auto, sidebar-scroll) */}
        <nav
          ref={!isMobile ? desktopNavRef : undefined}
          aria-label="Điều hướng chính"
          className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-4"
        >
          {/* Mục độc lập đầu tiên (Header Navigation) */}
          <div className="mb-2">
            <SidebarNavItem
              item={DASHBOARD_NAV_ITEM}
              collapsed={isCollapsed}
              onClick={isMobile ? () => setMobileDrawerOpen(false) : undefined}
            />
          </div>

          {LEARNER_NAV_GROUPS.map((group, groupIdx) => (
            <div
              key={group.key}
              role="group"
              aria-labelledby={`group-title-${group.key}`}
              className={groupIdx === 0 ? 'mt-2' : 'mt-4'}
            >
              {/* Group Label: chữ in hoa nhỏ (text-xs font-bold uppercase tracking-wider text-slate-400) */}
              {(!isCollapsed || isMobile) && (
                <div
                  id={`group-title-${group.key}`}
                  className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400 select-none"
                >
                  {group.label}
                </div>
              )}

              {/* Items in group, spaced 4px apart */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const count = item.key === 'my-decks' && dueTodayCount > 0 ? dueTodayCount : undefined;

                  return (
                    <SidebarNavItem
                      key={item.key}
                      item={item}
                      collapsed={isCollapsed}
                      count={count}
                      onClick={isMobile ? () => setMobileDrawerOpen(false) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 3. Footer Sidebar (padding 12px, border-t 1px var(--border)) */}
        <div className="p-3 shrink-0 border-t border-[var(--border)] bg-[var(--chrome)] space-y-2">
          {/* Subscription Status Card */}
          {!isCollapsed ? (
            <div className="rounded-[14px] bg-[var(--surface-2)] border border-[var(--border)] p-3 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text)]">
                  {isPro ? 'Gói Pro' : 'Gói Miễn phí'}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-[var(--brand-700)] border border-[var(--border)] shadow-xs">
                  {isPro ? 'PRO' : 'FREE'}
                </span>
              </div>

              {/* Dynamic free limit or Pro minutes */}
              {!isPro && (
                <p className="text-[11px] text-[var(--text-2)] font-medium leading-tight">
                  Hội thoại AI: dùng thử còn{' '}
                  <strong className="text-[var(--brand-700)] font-bold">
                    {voiceStatus ? `${voiceStatus.remainingQuota}/${voiceStatus.maxSessionsPerDay}` : '3/3'} buổi
                  </strong>
                </p>
              )}

              {isPro && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-[var(--brand-100)] overflow-hidden">
                    <div className="h-full bg-[var(--brand)] rounded-full w-3/4" />
                  </div>
                  <p className="text-[11px] text-[var(--text-2)] font-medium">Còn 45/60 phút hôm nay</p>
                </div>
              )}

              {!isPro && (
                <button
                  onClick={() => {
                    if (isMobile) setMobileDrawerOpen(false);
                    navigate('/pricing');
                  }}
                  className="w-full h-9 rounded-[10px] bg-[var(--brand)] hover:bg-[var(--brand-600)] text-white font-black text-xs transition-colors flex items-center justify-center cursor-pointer shadow-xs active:translate-y-0.5 border border-black/10"
                >
                  <span>Nâng cấp lên Pro</span>
                </button>
              )}
            </div>
          ) : (
            <Tooltip title="Gói cước & Nâng cấp" placement="right" mouseEnterDelay={0.3}>
              <button
                onClick={() => navigate('/pricing')}
                aria-label="Xem gói cước"
                className="w-10 h-10 mx-auto rounded-[10px] bg-[var(--surface-2)] hover:bg-[var(--hover)] text-[var(--brand-700)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--border)]"
              >
                <Crown size={18} strokeWidth={1.75} />
              </button>
            </Tooltip>
          )}

          {/* Small row: Help & Settings */}
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center justify-between px-1 pt-1 text-[13px] text-[var(--text-3)] font-medium">
              <button
                onClick={() => {
                  if (isMobile) setMobileDrawerOpen(false);
                  navigate('/decks');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <HelpCircle size={15} strokeWidth={1.75} />
                <span>Trợ giúp</span>
              </button>

              <button
                onClick={() => {
                  if (isMobile) setMobileDrawerOpen(false);
                  navigate('/profile#goals');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <Settings size={15} strokeWidth={1.75} />
                <span>Cài đặt</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] font-sans antialiased">
      {/* =========================================================================
          DESKTOP SIDEBAR (>= 1024px, 264px wide, 72px collapsed, sticky 100dvh)
          ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-[100dvh] shrink-0 border-r border-[var(--border)] bg-[var(--chrome)] z-30 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* =========================================================================
          MOBILE DRAWER (< 1024px, 288px wide, slides from left)
          ========================================================================= */}
      <Drawer
        placement="left"
        closable={false}
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={288}
        styles={{
          body: { padding: 0, background: 'var(--chrome)', overflow: 'hidden' },
          content: { background: 'var(--chrome)' },
        }}
        className="lg:hidden"
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* =========================================================================
          MAIN APPLICATION AREA (Topbar + Page Outlet)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar (>= 1024px, 64px height) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-[var(--chrome)] border-b border-[var(--border)] px-8 items-center justify-between">
          {/* Left: Dynamic Clean Page Title */}
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-lg text-[var(--text)] tracking-tight">
              {getPageTitle()}
            </span>
          </div>

          {/* Right: Metrics & Profile */}
          <div className="flex items-center gap-3">
            {/* Streak Chip with continuous gentle flame flicker */}
            <StatChip
              icon={
                <span className="flame-animated">
                  <FireFilled className="text-[var(--flame)]" />
                </span>
              }
              value={`${currentStreak} ngày`}
            />

            {/* XP Chip with warm sun yellow */}
            <StatChip
              icon={<ThunderboltFilled className="text-[var(--sun)]" />}
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
                  <div className="w-7 h-7 rounded-full bg-[var(--brand)] text-[#2A1300] text-xs font-bold flex items-center justify-center shrink-0">
                    {initialLetter}
                  </div>
                  <span className="max-w-[140px] truncate">{displayName}</span>
                </button>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="h-9 px-4 rounded-[10px] bg-[var(--brand)] text-[#2A1300] text-xs font-semibold hover:bg-[var(--brand-600)] transition-colors btn-shine"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Mobile Topbar (< 1024px, 56px height) */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-[var(--chrome)] border-b border-[var(--border)] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              className="p-1.5 -ml-1 text-[var(--text-2)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--hover)] transition-colors cursor-pointer"
            >
              <MenuIcon size={22} strokeWidth={1.75} />
            </button>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-display font-bold text-lg tracking-tight text-[var(--text)]"
            >
              <div className="w-7 h-7 rounded-[8px] bg-[var(--brand)] flex items-center justify-center text-[#2A1300] text-sm font-bold">
                L
              </div>
              <span>LeLa</span>
            </Link>
          </div>

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
                  className="w-8 h-8 rounded-full bg-[var(--brand)] text-[#2A1300] font-bold text-xs flex items-center justify-center cursor-pointer"
                  aria-label="Tài khoản cá nhân"
                >
                  {initialLetter}
                </button>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1 text-xs font-semibold bg-[var(--brand)] text-[#2A1300] rounded-[8px]"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Page Content Viewport with fitViewport support */}
        <main
          className={`flex-1 w-full bg-[var(--bg)] min-w-0 ${
            isFitViewport
              ? 'h-[calc(100dvh-64px)] overflow-hidden p-3.5 sm:p-5 md:px-6'
              : 'pb-24 lg:pb-16'
          }`}
        >
          <ErrorBoundary resetKey={location.pathname}>
            <AnimatedOutlet />
          </ErrorBoundary>
        </main>

        {/* Prompt Daily Goal Modal */}
        <DailyGoalPromptModal />

        {/* Unified Live Chat Floating Widget - hidden on fitViewport pages */}
        <ChatWidget hidden={isFitViewport} />
      </div>
    </div>
  );
}

export default LearnerLayout;
