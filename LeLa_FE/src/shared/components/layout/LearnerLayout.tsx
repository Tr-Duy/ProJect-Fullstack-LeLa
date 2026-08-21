import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Button, Dropdown, Badge, Popover } from 'antd';
import { Bell, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../features/notifications/api/notifications.api';
import bubblePopSound from '../../../assets/sounds/bubble-pop.mp3';
import { useRealtimeMetadata } from '../../hooks/useRealtimeMetadata';
import { DailyGoalPromptModal } from '../../../features/users/components/DailyGoalPromptModal';
import { ChatWidget } from '../../../features/chat/components/ChatWidget';
import { AiChatWidget } from '../../../features/ai-chat/components/AiChatWidget';
import { AiChatProvider } from '../../../features/ai-chat/context/AiChatContext';

export function LearnerLayout() {
  useRealtimeMetadata();
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = unreadResp?.data?.totalElements || 0;
  const notifications = unreadResp?.data?.content || [];

  const mainMenuItems = [
    { key: 'dashboard', label: <Link to="/dashboard" className="font-bold text-lg text-[#1D2A3A] hover:text-[#2A8B9D] transition-colors">Dashboard</Link> },
    { key: 'explore-decks', label: <Link to="/decks" className="font-bold text-lg text-[#1D2A3A] hover:text-[#2A8B9D] transition-colors">Khám phá bộ thẻ</Link> },
    { key: 'my-decks', label: <Link to="/my-decks" className="font-bold text-lg text-[#1D2A3A] hover:text-[#2A8B9D] transition-colors">Bộ thẻ của tôi</Link> },
    { key: 'final-tests', label: <Link to="/final-level-tests" className="font-bold text-lg !text-[#F05A4A] hover:!text-brand-navy transition-colors">Thi Kết Thúc Level</Link> },
    { key: 'placement-tests', label: <Link to="/placement-tests" className="font-bold text-lg text-[#1D2A3A] hover:text-[#2A8B9D] transition-colors">Đổi mức độ</Link> },
    { key: 'achievements', label: <Link to="/achievements" className="font-bold text-lg text-[#1D2A3A] hover:text-[#2A8B9D] transition-colors">Thành tích</Link> },
    { key: 'leaderboard', label: <Link to="/leaderboard" className="font-bold text-lg text-[#1D2A3A] hover:text-[#2A8B9D] transition-colors">Bảng xếp hạng</Link> },
    { key: 'ai-chat', label: <Link to="/ai-chat" className="font-bold text-lg text-[#2A8B9D] hover:text-[#F05A4A] transition-colors flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#FFD700]" />AI Tutor</Link> },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: <span className="font-bold" onClick={() => navigate('/profile')}>Trang cá nhân</span>,
    },
    ...(hasRole(['ADMIN', 'CONTENT_CREATOR'])
      ? [{
          key: 'admin',
          label: <span className="font-bold text-[#F05A4A]" onClick={() => navigate('/admin/dashboard')}>Trang Quản trị</span>,
        }]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: <span className="font-bold text-red-600" onClick={handleLogout}>Đăng xuất</span>,
    },
  ];

  const notificationPopoverContent = (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center p-3 border-b-[2px] border-black bg-[#F4F3EE]">
        <span className="font-black text-sm text-[#1D2A3A] uppercase">Thông báo</span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="text-xs font-bold text-[#2A8B9D] hover:underline"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-xs font-bold text-gray-500">
          Không có thông báo nào
        </div>
      ) : (
        <div className="divide-y border-black">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`p-3 text-xs font-medium hover:bg-gray-50 transition-colors ${
                !n.isRead ? 'bg-[#E6F4F1] font-bold' : ''
              }`}
            >
              <div className="text-[#1D2A3A] mb-1">{n.title || n.message}</div>
              {n.title && <div className="text-gray-600 text-[11px] mb-1">{n.message}</div>}
              <div className="text-[10px] text-gray-400">
                {new Date(n.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AiChatProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F3EE] font-sans antialiased">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white border-b-[3px] border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-3xl font-black tracking-tighter text-[#1D2A3A] hover:text-[#F05A4A] transition-colors">
                LELA<span className="text-[#F05A4A]">.</span>
              </Link>

              <nav className="hidden lg:flex items-center gap-6">
                {mainMenuItems.map((item) => (
                  <React.Fragment key={item.key}>{item.label}</React.Fragment>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Popover
                    content={notificationPopoverContent}
                    trigger="click"
                    placement="bottomRight"
                    overlayClassName="brutal-popover"
                  >
                    <div className="cursor-pointer relative">
                      <Badge count={unreadCount} overflowCount={99} offset={[-2, 2]}>
                        <Button
                          icon={<Bell className="w-5 h-5 text-[#1D2A3A]" />}
                          className="brutal-pill border-[2px] border-black bg-white shrink-0 hover:bg-[#F4F3EE] transition-transform"
                        />
                      </Badge>
                    </div>
                  </Popover>

                  <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                    <Button className="brutal-pill border-[2px] border-black bg-[#FFD700] text-black font-black hover:bg-[#ffdf33] transition-transform flex items-center gap-2">
                      <span className="max-w-[120px] truncate">{user.fullName || user.username}</span>
                    </Button>
                  </Dropdown>
                </>
              ) : (
                <Button
                  type="primary"
                  onClick={() => navigate('/login')}
                  className="brutal-pill !bg-[#F05A4A] !text-white font-black uppercase"
                >
                  Đăng nhập
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full bg-[#F4F3EE]">
          <Outlet />
        </main>

        <DailyGoalPromptModal />
        <AiChatWidget />
        <ChatWidget />
      </div>
    </AiChatProvider>
  );
}
