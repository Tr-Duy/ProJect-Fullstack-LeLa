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
import { HighlighterText } from '../ui/HighlighterText';
import { Stamp } from '../ui/Stamp';

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
  const voiceQuota = voiceStatusResp?.data?.remainingQuota ?? 3;

  // Determine active page title for topbar
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/dashboard') return { title: 'Bảng học tập Hôm nay', highlight: 'Hôm nay' };
    if (path.startsWith('/decks')) return { title: 'Khám phá Bộ thẻ từ vựng', highlight: 'Bộ thẻ' };
    if (path.startsWith('/my-decks')) return { title: 'Bộ thẻ của tôi', highlight: 'của tôi' };
    if (path.startsWith('/study')) return { title: 'Phiên ôn tập SM-2', highlight: 'SM-2' };
    if (path.startsWith('/typing-game')) return { title: 'Phòng luyện gõ từ nhanh', highlight: 'luyện gõ' };
    if (path.startsWith('/voice-conversation')) return { title: 'Hội thoại AI giọng nói', highlight: 'Hội thoại AI' };
    if (path.startsWith('/ai-chat')) return { title: 'Trợ lý học tập AI Tutor', highlight: 'AI Tutor' };
    if (path.startsWith('/quizzes') || path.startsWith('/quiz')) return { title: 'Lộ trình & Bài thi TOEIC', highlight: 'Bài thi' };
    if (path.startsWith('/placement-tests')) return { title: 'Kiểm tra trình độ đầu vào', highlight: 'trình độ' };
    if (path.startsWith('/final-level-tests')) return { title: 'Bài thi kết thúc Level', highlight: 'kết thúc Level' };
    if (path.startsWith('/achievements')) return { title: 'Kho thành tích & Huy hiệu', highlight: 'thành tích' };
    if (path.startsWith('/leaderboard')) return { title: 'Bảng vinh danh Xếp hạng', highlight: 'Xếp hạng' };
    if (path.startsWith('/profile')) return { title: 'Hồ sơ cá nhân & Tiến độ', highlight: 'Hồ sơ' };
    if (path.startsWith('/pricing')) return { title: 'Bảng giá & Gói cước', highlight: 'Gói cước' };
    return { title: 'Sổ tay ôn thi LeLa', highlight: 'LeLa' };
  };

  const pageInfo = getPageInfo();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span className="font-semibold" onClick={() => navigate('/profile')}>Trang cá nhân</span>,
    },
    {
      key: 'pricing',
      icon: <CreditCardOutlined />,
      label: <span className="font-semibold" onClick={() => navigate('/pricing')}>Gói cước & Thanh toán</span>,
    },
    {
      key: 'goal',
      icon: <SettingOutlined />,
      label: <span className="font-semibold" onClick={() => navigate('/profile#goals')}>Mục tiêu học ngày</span>,
    },
    ...(hasRole(['ADMIN', 'CONTENT_CREATOR'])
      ? [
          {
            key: 'admin',
            icon: <RocketOutlined className="text-[var(--coral)]" />,
            label: (
              <span className="font-bold text-[var(--coral)]" onClick={() => navigate('/admin/dashboard')}>
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
      icon: <LogoutOutlined className="text-[var(--coral)]" />,
      label: <span className="font-semibold text-[var(--coral)]" onClick={handleLogout}>Đăng xuất</span>,
    },
  ];

  const notificationPopoverContent = (
    <div className="w-80 max-h-96 overflow-y-auto bg-white rounded-xl">
      <div className="flex justify-between items-center p-3 border-b border-[var(--line)] bg-[var(--paper-2)]">
        <span className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--ink)]">
          Thông báo ({unreadCount})
        </span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-xs text-[var(--ink-mute)]">
          Không có thông báo mới
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`p-3 text-xs transition-colors ${
                !n.isRead ? 'bg-[var(--paper-2)]/60 font-semibold' : 'hover:bg-[var(--paper)]'
              }`}
            >
              <div className="text-[var(--ink)] mb-0.5">{n.title || n.message}</div>
              {n.title && <div className="text-[var(--ink-soft)] text-[11px] mb-1 font-normal">{n.message}</div>}
              <div className="text-[10px] font-mono text-[var(--ink-mute)]">
                {new Date(n.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--paper)] text-[var(--ink)] font-sans antialiased">
      {/* =========================================================================
          DESKTOP SIDEBAR (>= 1024px)
          ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r-2 border-[var(--ink)] bg-[var(--card)] z-30 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b-2 border-[var(--ink)] bg-[var(--paper-2)]">
          {!collapsed ? (
            <Link
              to="/dashboard"
              className="font-display font-black text-2xl tracking-tighter text-[var(--ink)] flex items-center hover:opacity-90 transition-opacity"
            >
              LELA<span className="text-[var(--coral)]">.</span>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="font-display font-black text-2xl tracking-tighter text-[var(--ink)] mx-auto"
            >
              L<span className="text-[var(--coral)]">.</span>
            </Link>
          )}

          <button
            onClick={toggleSidebar}
            title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            className="p-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--ink)] hover:bg-white text-[var(--ink)] transition-colors cursor-pointer"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {LEARNER_NAV_GROUPS.map((group) => (
            <div key={group.groupKey} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-mono font-bold tracking-wider uppercase text-[var(--ink-mute)]">
                  {group.groupLabel}
                </div>
              )}

              {group.items.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-btn)] font-medium text-sm transition-all duration-150 relative ${
                      isActive
                        ? 'bg-[var(--ink)] text-[var(--paper)] font-bold shadow-sm'
                        : 'text-[var(--ink-soft)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    {/* Active yellow indicator line on left */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[var(--sun)] rounded-r-full" />
                    )}

                    <span className="shrink-0 flex items-center justify-center">
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <Stamp variant={item.badgeType === 'ai' ? 'pro' : 'due'} rotate={false}>
                        {item.badge}
                      </Stamp>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Sidebar: User Subscription Status Card */}
        {!collapsed ? (
          <div className="p-3 border-t-2 border-[var(--ink)] bg-[var(--paper-2)]/60">
            <div className="journal-card p-3 bg-white text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold uppercase text-[10px] text-[var(--ink-mute)]">
                  Gói hiện tại
                </span>
                <Stamp variant="due" rotate={false}>
                  FREE
                </Stamp>
              </div>
              <div className="text-[var(--ink-soft)] text-[11px]">
                Hội thoại AI: <strong className="text-[var(--ink)] font-mono">{voiceQuota} lượt/ngày</strong>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-1.5 px-2 bg-[var(--brand)] text-white text-xs font-bold rounded-[6px] border border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] hover:translate-x-0.5 transition-transform flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Nâng cấp PRO</span>
                <ArrowRightOutlined className="text-[10px]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t-2 border-[var(--ink)] bg-[var(--paper-2)] flex justify-center">
            <button
              onClick={() => navigate('/pricing')}
              title="Nâng cấp gói cước"
              className="w-10 h-10 rounded-lg bg-[var(--brand)] text-white border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center cursor-pointer"
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
        {/* Desktop Topbar (>= 1024px) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-[60px] bg-[var(--card)] border-b-2 border-[var(--ink)] px-6 items-center justify-between shadow-sm">
          {/* Left: Dynamic Page Title with Highlighter streak */}
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-lg tracking-tight text-[var(--ink)]">
              {pageInfo.title.includes(pageInfo.highlight) ? (
                <>
                  {pageInfo.title.split(pageInfo.highlight)[0]}
                  <HighlighterText>{pageInfo.highlight}</HighlighterText>
                  {pageInfo.title.split(pageInfo.highlight)[1]}
                </>
              ) : (
                pageInfo.title
              )}
            </span>
          </div>

          {/* Right: Metrics & Profile */}
          <div className="flex items-center gap-3">
            {/* Streak Chip */}
            <div
              title={`Chuỗi học tập liên tục: ${user?.streakCurrent || 0} ngày`}
              className="h-9 px-3 rounded-full bg-[var(--paper-2)] border-2 border-[var(--ink)] flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--ink)] shadow-[2px_2px_0_var(--ink)]"
            >
              <FireFilled className="text-[var(--coral)] text-sm" />
              <span className="mono-num">{user?.streakCurrent || 0} ngày</span>
            </div>

            {/* XP Chip */}
            <div
              title={`Tổng điểm kinh nghiệm: ${user?.xpTotal || 0} XP`}
              className="h-9 px-3 rounded-full bg-[var(--sun)] border-2 border-[var(--ink)] flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--ink)] shadow-[2px_2px_0_var(--ink)]"
            >
              <ThunderboltFilled className="text-[var(--ink)] text-sm" />
              <span className="mono-num">{user?.xpTotal || 0} XP</span>
            </div>

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
                    className="w-9 h-9 rounded-full border-2 border-[var(--ink)] bg-white hover:bg-[var(--paper-2)] flex items-center justify-center text-[var(--ink)] shadow-[2px_2px_0_var(--ink)] transition-transform active:translate-y-0.5 cursor-pointer"
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
                  className="h-9 px-3 rounded-full border-2 border-[var(--ink)] bg-white hover:bg-[var(--paper-2)] flex items-center gap-2 text-xs font-bold text-[var(--ink)] shadow-[2px_2px_0_var(--ink)] transition-transform active:translate-y-0.5 cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
                  </div>
                  <span className="max-w-[110px] truncate">{user.fullName || user.username}</span>
                </button>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="journal-btn journal-btn-brand h-9 px-4 text-xs font-bold"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Mobile Topbar (< 1024px) */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-[var(--card)] border-b-2 border-[var(--ink)] px-4 flex items-center justify-between shadow-sm">
          <Link
            to="/dashboard"
            className="font-display font-black text-xl tracking-tighter text-[var(--ink)] flex items-center"
          >
            LELA<span className="text-[var(--coral)]">.</span>
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
                    className="w-8 h-8 rounded-full border-2 border-[var(--ink)] bg-white flex items-center justify-center text-[var(--ink)] shadow-[1.5px_1.5px_0_var(--ink)]"
                  >
                    <BellOutlined className="text-sm" />
                  </button>
                </Badge>
              </div>
            </Popover>

            {user ? (
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <button
                  className="w-8 h-8 rounded-full border-2 border-[var(--ink)] bg-[var(--brand)] text-white font-bold text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_var(--ink)]"
                  aria-label="Tài khoản cá nhân"
                >
                  {user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()}
                </button>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-2.5 py-1 text-xs font-bold bg-[var(--brand)] text-white rounded border border-[var(--ink)]"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 w-full bg-[var(--paper)] pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* =========================================================================
            MOBILE BOTTOM TAB BAR (< 1024px)
            ========================================================================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--card)] border-t-2 border-[var(--ink)] z-40 px-2 flex items-center justify-around shadow-[0_-2px_10px_rgba(15,23,41,0.06)]">
          {MOBILE_BOTTOM_TABS.map((tab, idx) => {
            const isActive = location.pathname === tab.path;

            // Nút nổi ở giữa "Ôn ngay"
            if (idx === 2) {
              return (
                <div key="study-center" className="relative -top-3">
                  <button
                    onClick={() => navigate('/decks')}
                    title="Ôn tập thẻ ngay"
                    className="w-13 h-13 rounded-full bg-[var(--sun)] border-2 border-[var(--ink)] text-[var(--ink)] flex flex-col items-center justify-center shadow-[2px_2px_0_var(--ink)] active:translate-y-0.5 transition-transform"
                  >
                    <ThunderboltFilled className="text-xl" />
                    <span className="text-[9px] font-mono font-bold leading-none mt-0.5">Ôn ngay</span>
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
                    ? 'text-[var(--brand)] font-bold'
                    : 'text-[var(--ink-mute)] hover:text-[var(--ink)]'
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

        {/* Unified Live Chat Floating Widget (One single button, no clipping) */}
        <ChatWidget />
      </div>
    </div>
  );
}
