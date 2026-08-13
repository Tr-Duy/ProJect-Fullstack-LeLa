import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Button, Dropdown, Badge, Popover, Spin } from 'antd';
import { Bell, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../features/notifications/api/notifications.api';
import bubblePopSound from '../../../assets/sounds/bubble-pop.mp3';
import { useRealtimeMetadata } from '../../hooks/useRealtimeMetadata';
import { DailyGoalPromptModal } from '../../../features/users/components/DailyGoalPromptModal';
import { ChatWidget } from '../../../features/chat/components/ChatWidget';
import { AiChatWidget } from '../../../features/ai-chat/components/AiChatWidget';

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
      // Phát âm thanh nếu click vào button, thẻ a, hoặc các phần tử có role="button"
      if (
        target.closest('button') || 
        target.closest('[role="button"]') || 
        target.closest('a') || 
        target.tagName === 'BUTTON'
      ) {
        const sound = audio.cloneNode() as HTMLAudioElement;
        sound.volume = 0.5;
        sound.play().catch(() => {
          // Bỏ qua lỗi play bị block bởi trình duyệt
        });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const queryClient = useQueryClient();
  const { data: notificationsData, isLoading: isNotifLoading } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnread({ size: 5 }),
    enabled: !!user,
    refetchInterval: 60000, // refresh every minute
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const unreadCount = notificationsData?.data?.totalElements || 0;
  const notifications = notificationsData?.data?.content || [];

  const notifContent = (
    <div className="w-80 max-h-96 overflow-y-auto">
      {isNotifLoading ? (
        <div className="p-4 flex justify-center"><Spin /></div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500 font-bold">Không có thông báo mới</div>
      ) : (
        <div className="flex flex-col">
          {notifications.map((n: any) => (
            <div 
              key={n.id} 
              className="p-3 border-b-2 border-black hover:bg-gray-100 cursor-pointer flex justify-between gap-2"
              onClick={() => markAsReadMutation.mutate(n.id)}
            >
              <div>
                <div className="font-bold text-brand-navy">{n.title}</div>
                <div className="text-sm text-gray-700 mt-1">{n.message}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-brand-coral mt-1 shrink-0"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const learnerMenu = [
    { key: 'dashboard', label: <Link to="/dashboard" className="font-bold text-lg !text-brand-navy hover:!text-brand-coral transition-colors">Tổng Quan</Link> },
    { key: 'my-decks', label: <Link to="/my-decks" className="font-bold text-lg !text-brand-navy hover:!text-brand-coral transition-colors">Bộ Thẻ Của Tôi</Link> },
    { key: 'explore', label: <Link to="/decks" className="font-bold text-lg !text-brand-navy hover:!text-brand-coral transition-colors">Khám Phá</Link> },
    { key: 'leaderboard', label: <Link to="/leaderboard" className="font-bold text-lg !text-brand-navy hover:!text-brand-coral transition-colors">Xếp Hạng</Link> },
    { key: 'ai-chat', label: <Link to="/ai-chat" className="font-black text-lg !text-brand-purple hover:!text-brand-navy transition-colors flex items-center gap-1"><Sparkles className="w-4 h-4" /> AI Tutor</Link> },
  ];

  const publicMenu = [
    { key: 'explore', label: <Link to="/decks" className="font-bold text-lg !text-brand-navy hover:!text-brand-coral transition-colors">Khám Phá Bộ Thẻ</Link> },
    { key: 'pricing', label: <Link to="/pricing" className="font-bold text-lg !text-brand-navy hover:!text-brand-coral transition-colors">Gói Dịch Vụ</Link> },
  ];

  const isAdminUser = hasRole(['ADMIN', 'CONTENT_CREATOR', 'MODERATOR']);

  const userDropdownItems = isAdminUser
    ? [
        { key: 'admin', label: <Link to="/admin/dashboard" className="font-bold block w-full !text-brand-navy">Trang Quản Trị Admin</Link> },
        { key: 'logout', label: <span className="font-bold text-red-600">Đăng xuất</span>, onClick: handleLogout },
      ]
    : [
        { key: 'dashboard', label: <Link to="/dashboard" className="font-bold block w-full !text-brand-navy">Tổng quan học tập</Link> },
        { key: 'profile', label: <Link to="/profile" className="font-bold block w-full !text-brand-navy">Hồ sơ cá nhân</Link> },
        { key: 'logout', label: <span className="font-bold text-red-600">Đăng xuất</span>, onClick: handleLogout },
      ];

  const handleLogoClick = () => {
    if (isAdminUser) {
      navigate('/admin/dashboard');
    } else if (hasRole(['LEARNER'])) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-offwhite">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-brand-offwhite/90 backdrop-blur border-b-[3px] border-brand-black">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/images/lela_fox_logo.png" alt="LeLa Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-brand-navy tracking-tight">LeLa</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {hasRole(['LEARNER']) ? (
              learnerMenu.map(item => <React.Fragment key={item.key}>{item.label}</React.Fragment>)
            ) : (
              publicMenu.map(item => <React.Fragment key={item.key}>{item.label}</React.Fragment>)
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isAdminUser && (
              <Button
                onClick={() => navigate('/admin/dashboard')}
                className="hidden md:inline-flex font-bold brutal-pill bg-[#FFD700] hover:bg-[#ffe033] text-black border-[2px] border-black text-sm"
              >
                Trang Admin ➔
              </Button>
            )}

            {user ? (
              <>
                <Popover content={notifContent} title={<span className="font-black uppercase tracking-tight border-b-[3px] border-black pb-2 block w-full">Thông báo</span>} trigger="click" placement="bottomRight">
                  <Badge count={unreadCount} color="#F05A4A" offset={[-2, 2]}>
                    <Button className="h-12 w-12 p-0 font-bold brutal-pill bg-white flex items-center justify-center hover:bg-gray-50 group">
                      <Bell className="w-6 h-6 text-brand-navy group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                    </Button>
                  </Badge>
                </Popover>
                
                <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
                  <Button className="h-12 px-6 text-base font-bold brutal-pill bg-white text-brand-navy flex items-center gap-2 hover:bg-gray-50">
                    <span>Hi, {user.username}</span>
                  </Button>
                </Dropdown>
              </>
            ) : (
              <Button onClick={() => navigate('/login')} className="h-12 px-6 text-base font-bold brutal-pill bg-brand-coral text-white hover:bg-[#d94a3a]">
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
  );
}
