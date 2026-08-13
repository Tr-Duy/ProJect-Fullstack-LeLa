import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';

export function useRealtimeMetadata() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Use SSE for real-time notifications
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/notifications/stream?access_token=${token}`, {
      withCredentials: true
    });

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Show Toast Notification
        notification.info({
          message: data.title || 'Thông báo mới',
          description: data.message,
          placement: 'topRight',
          className: 'brutal-border brutal-shadow'
        });

        // Invalidate queries to refresh notifications list
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      } catch (e) {
        console.error('Failed to parse SSE notification', e);
      }
    });

    eventSource.addEventListener('xp_update', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Optimistically update daily activity XP
        queryClient.setQueryData(['daily-activity', 'today'], (oldData: any) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              xpEarned: data.totalXp,
              cardsReviewed: data.cardsReviewed
            }
          };
        });
        
        // Always invalidate to ensure freshness if user navigates to Dashboard
        queryClient.invalidateQueries({ queryKey: ['daily-activity', 'today'] });
        queryClient.invalidateQueries({ queryKey: ['daily-activity', 'history'] });

        if (data.gainedXp > 0) {
          notification.success({
            message: `+${data.gainedXp} XP!`,
            description: 'Tuyệt vời, bạn vừa nhận được XP.',
            placement: 'top',
            duration: 2,
            className: 'brutal-border brutal-shadow bg-[#ccffcc] font-bold'
          });
        }
      } catch (e) {
        console.error('Failed to parse SSE xp_update', e);
      }
    });

    eventSource.addEventListener('badge_unlocked', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        notification.success({
          message: `🏆 Danh hiệu mới: ${data.title}`,
          description: `Chúc mừng! Bạn đã mở khóa danh hiệu mới và nhận ${data.xpReward} XP.`,
          placement: 'top',
          duration: 5,
          className: 'brutal-border brutal-shadow bg-[#FFD700] text-brand-navy font-bold text-lg'
        });
      } catch (e) {
        console.error('Failed to parse SSE badge_unlocked', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
