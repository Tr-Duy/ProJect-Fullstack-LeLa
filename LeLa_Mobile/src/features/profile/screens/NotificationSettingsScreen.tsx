import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import notificationService, {
  NotificationSettingsState,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/notificationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRESET_TIMES = [
  { label: 'Sáng sớm', hour: 7, minute: 30, desc: 'Bắt đầu ngày mới đầy năng lượng' },
  { label: 'Nghỉ trưa', hour: 12, minute: 0, desc: 'Ôn 5 phút trong giờ giải lao' },
  { label: 'Buổi tối', hour: 20, minute: 0, desc: 'Giờ học tập tập trung nhất' },
  { label: 'Trước khi ngủ', hour: 21, minute: 30, desc: 'Ghi nhớ sâu trước giấc ngủ' },
];

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [settings, setSettings] = useState<NotificationSettingsState>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSendingSample, setIsSendingSample] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Yêu cầu quyền và thiết lập Notification Channel nếu chưa có
      await notificationService.registerForPushNotificationsAsync();
    } catch (e) {
      console.warn('[NotificationSettingsScreen] Lỗi khởi tạo kênh thông báo:', e);
    }

    try {
      const saved = await notificationService.getSettings();
      setSettings(saved);
    } catch (e) {
      console.error('[NotificationSettingsScreen] Lỗi tải cấu hình:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDaily = (val: boolean) => {
    setSettings((prev) => ({ ...prev, dailyReminderEnabled: val }));
  };

  const handleToggleStreak = (val: boolean) => {
    setSettings((prev) => ({ ...prev, streakSaverEnabled: val }));
  };

  const handleToggleUpdates = (val: boolean) => {
    setSettings((prev) => ({ ...prev, systemUpdatesEnabled: val }));
  };

  const handleSelectPresetTime = (hour: number, minute: number) => {
    setSettings((prev) => ({
      ...prev,
      reminderHour: hour,
      reminderMinute: minute,
    }));
  };

  const adjustHour = (delta: number) => {
    setSettings((prev) => {
      let nextHour = prev.reminderHour + delta;
      if (nextHour > 23) nextHour = 0;
      if (nextHour < 0) nextHour = 23;
      return { ...prev, reminderHour: nextHour };
    });
  };

  const adjustMinute = (delta: number) => {
    setSettings((prev) => {
      let nextMin = prev.reminderMinute + delta;
      if (nextMin > 55) nextMin = 0;
      if (nextMin < 0) nextMin = 55;
      return { ...prev, reminderMinute: nextMin };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await notificationService.saveSettings(settings);
      Alert.alert(
        'Đã lưu cài đặt',
        `Lịch nhắc nhở học tập đã được thiết lập lúc ${formatTime(
          settings.reminderHour,
          settings.reminderMinute
        )} hằng ngày.`
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt thông báo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSendingSample(true);
    try {
      await notificationService.sendSampleNotification();
      Alert.alert('Đã gửi thông báo!', 'Hãy kiểm tra thanh thông báo (Notification Bar) trên thiết bị của bạn.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi thông báo thử nghiệm. Vui lòng kiểm tra quyền thông báo của ứng dụng trong Cài đặt máy.');
    } finally {
      setIsSendingSample(false);
    }
  };

  const formatTime = (h: number, m: number) => {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Đang tải cài đặt thông báo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Nhắc Nhở & Thông Báo</Text>
          <Text style={styles.headerSubtitle}>Tự động hóa thói quen học tập mỗi ngày</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Giới thiệu */}
        <View style={styles.introCard}>
          <View style={styles.introIconCircle}>
            <Ionicons name="notifications" size={26} color="#EA580C" />
          </View>
          <View style={styles.introTextGroup}>
            <Text style={styles.introTitle}>Học tập đều đặn cùng Spaced Repetition</Text>
            <Text style={styles.introDesc}>
              Ôn tập đúng giờ vàng giúp não bộ chuyển từ vựng từ trí nhớ ngắn hạn sang dài hạn hiệu quả nhất.
            </Text>
          </View>
        </View>

        {/* Danh sách Switch Toggles */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Các loại thông báo</Text>

          {/* Toggle: Nhắc nhở học tập hàng ngày */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleTitleRow}>
                <Ionicons name="alarm-outline" size={18} color="#EA580C" />
                <Text style={styles.toggleTitle}>Nhắc nhở học tập hằng ngày</Text>
              </View>
              <Text style={styles.toggleDesc}>
                Nhận thông báo ôn tập Flashcard vào khung giờ vàng bạn đã chọn
              </Text>
            </View>
            <Switch
              value={settings.dailyReminderEnabled}
              onValueChange={handleToggleDaily}
              trackColor={{ false: '#CBD5E1', true: '#FDBA74' }}
              thumbColor={settings.dailyReminderEnabled ? '#EA580C' : '#94A3B8'}
            />
          </View>

          {/* Toggle: Streak Saver lúc 20:00 */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleTitleRow}>
                <Ionicons name="flame-outline" size={18} color="#D97706" />
                <Text style={styles.toggleTitle}>Bảo vệ chuỗi Streak (20:00)</Text>
              </View>
              <Text style={styles.toggleDesc}>
                Cảnh báo khẩn cấp trước khi chuỗi ngày học của bạn bị reset
              </Text>
            </View>
            <Switch
              value={settings.streakSaverEnabled}
              onValueChange={handleToggleStreak}
              trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
              thumbColor={settings.streakSaverEnabled ? '#D97706' : '#94A3B8'}
            />
          </View>

          {/* Toggle: Cập nhật đề thi & Tính năng */}
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleTitleRow}>
                <Ionicons name="sparkles-outline" size={18} color="#4F46E5" />
                <Text style={styles.toggleTitle}>Đề thi TOEIC & Tính năng mới</Text>
              </View>
              <Text style={styles.toggleDesc}>
                Thông báo khi có bộ đề thi mới, sự kiện thi đua và tính năng AI
              </Text>
            </View>
            <Switch
              value={settings.systemUpdatesEnabled}
              onValueChange={handleToggleUpdates}
              trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
              thumbColor={settings.systemUpdatesEnabled ? '#4F46E5' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Khung Giờ Nhắc Nhở */}
        {settings.dailyReminderEnabled && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Khung giờ nhắc nhở mong muốn</Text>

            {/* Bộ điều chỉnh Giờ:Phút trực quan */}
            <View style={styles.timePickerContainer}>
              <View style={styles.timeCol}>
                <TouchableOpacity
                  style={styles.timeArrowBtn}
                  onPress={() => adjustHour(1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-up" size={24} color="#EA580C" />
                </TouchableOpacity>
                <View style={styles.timeDigitBox}>
                  <Text style={styles.timeDigitText}>
                    {settings.reminderHour.toString().padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.timeArrowBtn}
                  onPress={() => adjustHour(-1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-down" size={24} color="#EA580C" />
                </TouchableOpacity>
                <Text style={styles.timeUnitText}>Giờ</Text>
              </View>

              <Text style={styles.timeColon}>:</Text>

              <View style={styles.timeCol}>
                <TouchableOpacity
                  style={styles.timeArrowBtn}
                  onPress={() => adjustMinute(5)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-up" size={24} color="#EA580C" />
                </TouchableOpacity>
                <View style={styles.timeDigitBox}>
                  <Text style={styles.timeDigitText}>
                    {settings.reminderMinute.toString().padStart(2, '0')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.timeArrowBtn}
                  onPress={() => adjustMinute(-5)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-down" size={24} color="#EA580C" />
                </TouchableOpacity>
                <Text style={styles.timeUnitText}>Phút</Text>
              </View>
            </View>

            {/* Các Khung giờ gợi ý phổ biến */}
            <Text style={styles.presetLabel}>Hoặc chọn nhanh khung giờ:</Text>
            <View style={styles.presetGrid}>
              {PRESET_TIMES.map((preset) => {
                const isSelected =
                  settings.reminderHour === preset.hour &&
                  settings.reminderMinute === preset.minute;

                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                    onPress={() => handleSelectPresetTime(preset.hour, preset.minute)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.presetHeader}>
                      <Text style={[styles.presetTime, isSelected && styles.presetTextSelected]}>
                        {formatTime(preset.hour, preset.minute)}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color="#EA580C" />}
                    </View>
                    <Text style={[styles.presetTitle, isSelected && styles.presetTextSelected]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.presetDesc}>{preset.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Nút Thử Nghiệm & Lưu Cài Đặt */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.testNotificationButton}
            onPress={handleTestNotification}
            disabled={isSendingSample}
            activeOpacity={0.8}
          >
            {isSendingSample ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="paper-plane-outline" size={18} color="#EA580C" />
                <Text style={styles.testButtonText}>Gửi thử thông báo mẫu ngay</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Lưu Cài Đặt Nhắc Nhở</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#EA580C',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFEDD5',
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  introIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  introTextGroup: {
    flex: 1,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 12,
    color: '#C2410C',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeCol: {
    alignItems: 'center',
  },
  timeArrowBtn: {
    padding: 6,
  },
  timeDigitBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeDigitText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 1,
  },
  timeUnitText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  timeColon: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EA580C',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 14,
    marginBottom: 10,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  presetCardSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  presetTextSelected: {
    color: '#EA580C',
  },
  actionSection: {
    marginTop: 8,
    gap: 12,
  },
  testNotificationButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  saveButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default NotificationSettingsScreen;

