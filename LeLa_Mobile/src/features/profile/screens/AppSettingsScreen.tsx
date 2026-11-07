import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import profileService, {
  AppSettingsState,
  DEFAULT_APP_SETTINGS,
} from '../services/profileService';
import { useTheme } from '../../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AppSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark, colors, setDarkMode } = useTheme();

  // State cấu hình ứng dụng
  const [settings, setSettings] = useState<AppSettingsState>(DEFAULT_APP_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);

  // State Modal đổi mật khẩu
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // State Modal Điều khoản & Chính sách
  const [legalModalTitle, setLegalModalTitle] = useState<string | null>(null);
  const [legalModalContent, setLegalModalContent] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const data = await profileService.getAppSettings();
      // Sync darkMode from ThemeContext (source of truth) into local settings state
      setSettings({ ...data, darkMode: isDark });
    } catch {
      setSettings({ ...DEFAULT_APP_SETTINGS, darkMode: isDark });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const updateSetting = async <K extends keyof AppSettingsState>(
    key: K,
    value: AppSettingsState[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    // Sync dark mode to ThemeContext so the whole app reacts immediately
    if (key === 'darkMode') {
      await setDarkMode(value as boolean);
    }
    try {
      await profileService.saveAppSettings(updated);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt vào bộ nhớ máy.');
    }
  };

  const handleOpenPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalVisible(true);
  };

  const handleChangePasswordSubmit = async () => {
    if (!oldPassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword.trim() === oldPassword.trim()) {
      Alert.alert('Trùng mật khẩu cũ', 'Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Không khớp', 'Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const message = await profileService.changePassword({
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      });

      setIsPasswordModalVisible(false);
      Alert.alert('Thành công', message || 'Mật khẩu của bạn đã được thay đổi thành công.');
    } catch (err: any) {
      Alert.alert('Đổi mật khẩu thất bại', err.message || 'Mật khẩu cũ không chính xác.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleShowTerms = () => {
    setLegalModalTitle('Điều Khoản Dịch Vụ');
    setLegalModalContent(
      'Chào mừng bạn đến với ứng dụng học tiếng Anh LeLa Mobile.\n\n' +
      '1. Quyền sở hữu tài khoản:\n' +
      'Mỗi tài khoản được cấp quyền cho một người học viên duy nhất. Học viên có trách nhiệm bảo mật thông tin đăng nhập cá nhân.\n\n' +
      '2. Quyền sở hữu trí tuệ:\n' +
      'Toàn bộ bộ thẻ từ vựng Flashcard, câu hỏi đề thi TOEIC, âm thanh phát âm và tài liệu học tập thuộc quyền sở hữu của Hệ thống LeLa.\n\n' +
      '3. Sử dụng dịch vụ AI & Voice Conversation:\n' +
      'Các phiên trò chuyện với AI Tutor tuân thủ tiêu chuẩn văn hóa và không chứa nội dung độc hại hoặc vi phạm pháp luật.\n\n' +
      '4. Gói cước hội viên & Hoàn tiền:\n' +
      'Các gói Pro/VIP được kích hoạt ngay lập tức qua cổng VietQR SePay và không áp dụng hoàn tiền sau khi đã sử dụng.'
    );
  };

  const handleShowPrivacy = () => {
    setLegalModalTitle('Chính Sách Bảo Mật');
    setLegalModalContent(
      'Cam kết bảo vệ quyền riêng tư của bạn tại LeLa Mobile:\n\n' +
      '1. Thu thập dữ liệu:\n' +
      'Chúng tôi chỉ lưu trữ thông tin cần thiết phục vụ học tập: Họ tên, email, lịch sử lật thẻ Flashcard, điểm thi TOEIC và chuỗi Streak ngày.\n\n' +
      '2. Bảo mật mật khẩu:\n' +
      'Mật khẩu người dùng được mã hóa một chiều bằng thuật toán BCrypt trước khi lưu trữ trong cơ sở dữ liệu và không bao giờ được chia sẻ với bên thứ ba.\n\n' +
      '3. Lưu trữ an toàn trên thiết bị:\n' +
      'Mã token và cài đặt thiết bị được lưu trữ an toàn trong SecureStore (Keystore trên Android / Keychain trên iOS).\n\n' +
      '4. Quyền của người dùng:\n' +
      'Bạn có quyền yêu cầu xóa tài khoản và dữ liệu học tập bất kỳ lúc nào qua trang hỗ trợ học viên.'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'light' } />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Cài Đặt Ứng Dụng</Text>
          <Text style={styles.headerSubtitle}>Tùy chỉnh giao diện, bảo mật & thông tin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mục 1: Bảo Mật Tài Khoản */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="shield-checkmark" size={18} color="#DC2626" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bảo Mật Tài Khoản</Text>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleOpenPasswordModal}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="key" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.itemTitle}>Đổi mật khẩu tài khoản</Text>
                <Text style={styles.itemSubtitle}>Cập nhật mật khẩu mới định kỳ để bảo vệ tài khoản</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Mục 2: Giao Diện & Tùy Chọn Học Tập */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="color-palette" size={18} color="#7C3AED" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao Diện & Tùy Chọn Học</Text>
          </View>

          {/* Dark Mode */}
          <View style={styles.settingToggleRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="moon" size={18} color="#475569" />
              </View>
              <View style={styles.labelGroup}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Chế độ nền tối (Dark Mode)</Text>
                <Text style={[styles.itemSubtitle, { color: colors.subtext }]}>Tối ưu độ sáng và bảo vệ mắt khi ôn tập buổi tối</Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSetting('darkMode', val)}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={settings.darkMode ? '#EA580C' : '#F8FAFC'}
            />
          </View>

          <View style={styles.divider} />

          {/* Âm thanh hiệu ứng */}
          <View style={styles.settingToggleRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="volume-high" size={18} color="#0284C7" />
              </View>
              <View style={styles.labelGroup}>
                <Text style={styles.itemTitle}>Âm thanh hiệu ứng (Sound Effects)</Text>
                <Text style={styles.itemSubtitle}>Phát chuông phản hồi khi trả lời đúng / sai trong Game</Text>
              </View>
            </View>
            <Switch
              value={settings.soundEffects}
              onValueChange={(val) => updateSetting('soundEffects', val)}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={settings.soundEffects ? '#EA580C' : '#F8FAFC'}
            />
          </View>

          <View style={styles.divider} />

          {/* Tự động phát âm Flashcard */}
          <View style={styles.settingToggleRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="mic-circle" size={18} color="#16A34A" />
              </View>
              <View style={styles.labelGroup}>
                <Text style={styles.itemTitle}>Tự động phát âm bản xứ</Text>
                <Text style={styles.itemSubtitle}>Đọc chuẩn ngữ điệu từ vựng khi lật thẻ Flashcard</Text>
              </View>
            </View>
            <Switch
              value={settings.autoPronounce}
              onValueChange={(val) => updateSetting('autoPronounce', val)}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={settings.autoPronounce ? '#EA580C' : '#F8FAFC'}
            />
          </View>

          <View style={styles.divider} />

          {/* Rung phản hồi */}
          <View style={styles.settingToggleRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color="#EA580C" />
              </View>
              <View style={styles.labelGroup}>
                <Text style={styles.itemTitle}>Phản hồi xúc giác (Haptic Feedback)</Text>
                <Text style={styles.itemSubtitle}>Rung nhẹ khi nhấn nút hoặc xác nhận qua ải</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(val) => updateSetting('hapticFeedback', val)}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={settings.hapticFeedback ? '#EA580C' : '#F8FAFC'}
            />
          </View>
        </View>

        {/* Mục 3: Thông Tin Ứng Dụng */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="information-circle" size={18} color="#0284C7" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông Tin Ứng Dụng</Text>
          </View>

          {/* Phiên bản */}
          <View style={styles.infoRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="code-working" size={18} color="#64748B" />
              </View>
              <Text style={styles.itemTitle}>Phiên bản hiện tại</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>Version 1.0.0 (Build 58)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Điều khoản dịch vụ */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleShowTerms}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="document-text-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.itemTitle}>Điều khoản dịch vụ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Chính sách bảo mật */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleShowPrivacy}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.itemIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.itemTitle}>Chính sách bảo mật</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Footer Bản quyền */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LeLa English Learning System</Text>
          <Text style={styles.footerCopyright}>
            Bản quyền © 2026 LeLa Team. Thiết kế với React Native & Expo SDK 58.
          </Text>
        </View>
      </ScrollView>

      {/* Modal Đổi Mật Khẩu */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isChangingPassword) setIsPasswordModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="key" size={24} color="#EA580C" />
              </View>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalTitle}>Đổi Mật Khẩu</Text>
                <Text style={styles.modalSubtitle}>Cập nhật mật khẩu mới bảo mật</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPasswordModalVisible(false)}
                disabled={isChangingPassword}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Mật khẩu cũ */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Mật khẩu hiện tại</Text>
              <View style={styles.modalInputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalTextInput}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Nhập mật khẩu cũ..."
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showOldPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                  <Ionicons
                    name={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mật khẩu mới */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Mật khẩu mới (Tối thiểu 6 ký tự)</Text>
              <View style={styles.modalInputWrap}>
                <Ionicons name="shield-outline" size={18} color="#94A3B8" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalTextInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nhập mật khẩu mới..."
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nhập lại mật khẩu mới */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Xác nhận mật khẩu mới</Text>
              <View style={styles.modalInputWrap}>
                <Ionicons name="checkmark-done-outline" size={18} color="#94A3B8" style={styles.modalInputIcon} />
                <TextInput
                  style={styles.modalTextInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới..."
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsPasswordModalVisible(false)}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isChangingPassword && styles.modalSubmitBtnDisabled]}
                onPress={handleChangePasswordSubmit}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Xác Nhận Đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Hiển Thị Điều Khoản & Chính Sách */}
      <Modal
        visible={!!legalModalTitle}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLegalModalTitle(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="document-text" size={24} color="#0284C7" />
              </View>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalTitle}>{legalModalTitle}</Text>
                <Text style={styles.modalSubtitle}>Quy định sử dụng hệ sinh thái LeLa</Text>
              </View>
              <TouchableOpacity onPress={() => setLegalModalTitle(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.legalScrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.legalContentText}>{legalModalContent}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.legalCloseFullBtn}
              onPress={() => setLegalModalTitle(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.legalCloseFullText}>Đã Hiểu & Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FED7AA',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  labelGroup: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  versionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  footerCopyright: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.7,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legalScrollView: {
    marginVertical: 14,
    maxHeight: 260,
  },
  legalContentText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },
  legalCloseFullBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  legalCloseFullText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppSettingsScreen;

