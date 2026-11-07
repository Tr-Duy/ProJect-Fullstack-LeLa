import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiClient } from '../../../api/client';
import { storage } from '../../../utils/storage';

// Cấu hình hiển thị thông báo ngay cả khi ứng dụng đang mở ở Foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_NOTIFICATION_ID = 'lela_daily_study_reminder';
const STREAK_NOTIFICATION_ID = 'lela_streak_saver_reminder';
const NOTIFICATION_SETTINGS_STORAGE_KEY = 'lela_notification_settings';

export interface NotificationSettingsState {
  dailyReminderEnabled: boolean;
  streakSaverEnabled: boolean;
  systemUpdatesEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  dailyReminderEnabled: true,
  streakSaverEnabled: true,
  systemUpdatesEnabled: true,
  reminderHour: 20,
  reminderMinute: 0,
};

export const notificationService = {
  /**
   * Xin quyền nhận thông báo và lấy mã Expo / Device Push Token
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('[notificationService] Thiết bị giả lập (Simulator/Emulator) có thể không nhận được Push từ xa.');
    }

    // Cấu hình Notification Channel cho Android (Bắt buộc từ Android 8.0 Oreo trở lên)
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ea580c',
        });
      } catch (e) {
        console.warn('Error setting notification channel:', e);
      }
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[notificationService] Quyền thông báo bị người dùng từ chối.');
        return null;
      }

      // Lấy Push Token an toàn
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        if (token) {
          await this.sendPushTokenToServer(token);
        }
        return token;
      } catch (tokenErr) {
        console.log('[notificationService] Không lấy được Expo Push Token (dùng local notifications bình thường):', tokenErr);
        return null;
      }
    } catch (err) {
      console.error('[notificationService] Lỗi khi xin quyền thông báo:', err);
      return null;
    }
  },

  /**
   * Đồng bộ Push Token thiết bị lên Backend Spring Boot
   */
  async sendPushTokenToServer(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/device-token', {
        token,
        platform: Platform.OS,
        deviceModel: Device.modelName || 'Mobile',
      });
    } catch (e) {
      // Endpoint có thể chưa có hoặc lỗi tạm thời mạng - bỏ qua an toàn
    }
  },

  /**
   * Cài đặt lịch nhắc nhở học tập cục bộ hằng ngày (Local Notification)
   */
  async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
    try {
      // Hủy lịch nhắc nhở cũ
      await this.cancelDailyReminder();

      // Cài đặt lịch lặp lại hàng ngày vào giờ đã chọn
      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_NOTIFICATION_ID,
        content: {
          title: '⏰ Đã đến giờ học tiếng Anh cùng LeLa!',
          body: 'Chỉ 5 phút ôn tập Flashcard hôm nay để tiến bộ vượt bậc và duy trì thói quen học tập mỗi ngày.',
          data: { screen: 'FlashcardStudy' },
          sound: 'default',
          color: '#EA580C',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      console.log(`[notificationService] Đã cài đặt nhắc nhở lúc ${hour}:${minute < 10 ? '0' : ''}${minute} hàng ngày.`);
    } catch (error) {
      console.error('[notificationService] Lỗi cài đặt nhắc nhở học tập:', error);
    }
  },

  /**
   * Cài đặt cảnh báo giữ streak vào 20:00 tối hằng ngày
   */
  async scheduleStreakSaverReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);

      await Notifications.scheduleNotificationAsync({
        identifier: STREAK_NOTIFICATION_ID,
        content: {
          title: '🔥 Cảnh báo: Chuỗi Streak sắp đứt gãy!',
          body: 'Bạn chưa hoàn thành mục tiêu học tập hôm nay. Hãy ôn vài thẻ Flashcard trước 24:00 để giữ chuỗi rực rỡ nhé!',
          data: { screen: 'FlashcardStudy' },
          sound: 'default',
          color: '#EA580C',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });
    } catch (e) {
      console.error('[notificationService] Lỗi cài đặt Streak Saver:', e);
    }
  },

  /**
   * Hủy thông báo nhắc nhở học tập hàng ngày
   */
  async cancelDailyReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
    } catch (e) {
      // Ignored
    }
  },

  /**
   * Hủy cảnh báo Streak Saver
   */
  async cancelStreakSaverReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);
    } catch (e) {
      // Ignored
    }
  },

  /**
   * Gửi ngay lập tức một thông báo mẫu để kiểm tra hoạt động trên máy
   */
  async sendSampleNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Thông báo kiểm tra từ LeLa',
        body: 'Tuyệt vời! Hệ thống thông báo và nhắc nhở học tập đang hoạt động hoàn hảo trên thiết bị của bạn.',
        data: { type: 'SAMPLE_TEST' },
        sound: 'default',
        color: '#EA580C',
      },
      trigger: null, // Gửi ngay lập tức
    });
  },

  /**
   * Lưu cài đặt thông báo vào bộ nhớ thiết bị
   */
  async saveSettings(settings: NotificationSettingsState): Promise<void> {
    try {
      await storage.saveItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));

      // Áp dụng ngay cài đặt
      if (settings.dailyReminderEnabled) {
        await this.scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
      } else {
        await this.cancelDailyReminder();
      }

      if (settings.streakSaverEnabled) {
        await this.scheduleStreakSaverReminder();
      } else {
        await this.cancelStreakSaverReminder();
      }
    } catch (e) {
      console.error('[notificationService] Lỗi lưu cấu hình thông báo:', e);
    }
  },

  /**
   * Đọc cài đặt thông báo từ bộ nhớ thiết bị
   */
  async getSettings(): Promise<NotificationSettingsState> {
    try {
      const data = await storage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
      if (data) {
        return {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...JSON.parse(data),
        };
      }
    } catch (e) {
      // Ignored
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  },
};

export default notificationService;

