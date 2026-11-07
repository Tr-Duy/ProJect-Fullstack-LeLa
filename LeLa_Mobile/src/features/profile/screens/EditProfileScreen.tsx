import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { useAuth } from '../../auth/context/AuthContext';
import profileService from '../services/profileService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GoalOption {
  count: number;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GOAL_OPTIONS: GoalOption[] = [
  { count: 10, label: '10 thẻ', desc: 'Thư giãn (5p/ngày)', icon: 'cafe-outline' },
  { count: 20, label: '20 thẻ', desc: 'Tiêu chuẩn (Khuyên dùng)', icon: 'flame-outline' },
  { count: 30, label: '30 thẻ', desc: 'Chăm chỉ (15p/ngày)', icon: 'rocket-outline' },
  { count: 50, label: '50 thẻ', desc: 'Bứt tốc TOEIC 800+', icon: 'trophy-outline' },
];

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [dailyGoal, setDailyGoal] = useState<number>(user?.dailyGoalCards || 20);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number>(
    user?.targetLanguageId || 1
  );
  const [languages, setLanguages] = useState<{ id: number; code: string; name: string }[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    setIsLoadingLanguages(true);
    try {
      const data = await profileService.getLanguages();
      setLanguages(data);
    } catch {
      // Đã có fallback trong service
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập Họ và tên của bạn.');
      return;
    }

    setIsSaving(true);
    try {
      await profileService.updateProfile({
        fullName: trimmedName,
        dailyGoalCards: dailyGoal,
        targetLanguageId: selectedLanguageId,
      });

      if (refreshProfile) {
        await refreshProfile();
      }

      Alert.alert(
        'Thành công',
        'Thông tin hồ sơ học tập của bạn đã được cập nhật thành công.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[EditProfileScreen] Lỗi cập nhật hồ sơ:', error);
      const msg = error?.response?.data?.message || error?.message || 'Không thể lưu thay đổi. Vui lòng thử lại sau.';
      Alert.alert('Lỗi cập nhật', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar style="light" />

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
            <Text style={styles.headerTitle}>Chỉnh Sửa Hồ Sơ</Text>
            <Text style={styles.headerSubtitle}>Cập nhật tên hiển thị, mục tiêu & ngôn ngữ</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Hero Card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={44} color="#EA580C" />
            </View>
            <Text style={styles.accountUsername}>@{user?.username || 'learner'}</Text>
            <Text style={styles.accountEmail}>{user?.email || 'email@lela.com'}</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="ribbon-outline" size={13} color="#D97706" />
              <Text style={styles.levelBadgeText}>
                Trình độ: {user?.currentLevel?.name || user?.currentLevel?.code || 'TOEIC Foundation'}
              </Text>
            </View>
          </View>

          {/* Form Thông tin cá nhân */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Họ và tên hiển thị <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Tên đăng nhập (Readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên tài khoản (Không thể đổi)</Text>
              <View style={[styles.inputWrapper, styles.readonlyInput]}>
                <Ionicons name="at-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.readonlyText]}
                  value={user?.username || ''}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color="#94A3B8" />
              </View>
            </View>

            {/* Email (Readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email liên kết</Text>
              <View style={[styles.inputWrapper, styles.readonlyInput]}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.readonlyText]}
                  value={user?.email || ''}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color="#94A3B8" />
              </View>
            </View>
          </View>

          {/* Lựa chọn Ngôn ngữ mục tiêu */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ngôn ngữ mục tiêu</Text>
            <Text style={styles.sectionDesc}>
              Hệ thống sẽ tối ưu hóa danh mục từ vựng và bài tập theo ngôn ngữ này:
            </Text>

            {isLoadingLanguages ? (
              <ActivityIndicator size="small" color="#EA580C" style={styles.langLoading} />
            ) : (
              <View style={styles.langList}>
                {languages.map((lang) => {
                  const isSelected = selectedLanguageId === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[styles.langChip, isSelected && styles.langChipSelected]}
                      onPress={() => setSelectedLanguageId(lang.id)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? '#EA580C' : '#94A3B8'}
                        style={styles.langRadioIcon}
                      />
                      <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Cài đặt mục tiêu số thẻ học mỗi ngày */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Mục tiêu thẻ Flashcard mỗi ngày</Text>
            <Text style={styles.sectionDesc}>
              Cam kết số thẻ hoàn thành hằng ngày để thuật toán Spaced Repetition (SRS) phân bổ lịch học phù hợp:
            </Text>

            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = dailyGoal === opt.count;
                return (
                  <TouchableOpacity
                    key={opt.count}
                    style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    onPress={() => setDailyGoal(opt.count)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.goalHeader}>
                      <View style={[styles.goalIconWrap, isSelected && styles.goalIconWrapSelected]}>
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={isSelected ? '#EA580C' : '#64748B'}
                        />
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={18} color="#EA580C" />
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </View>
                    <Text style={[styles.goalCount, isSelected && styles.goalTextSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.goalDesc, isSelected && styles.goalDescSelected]}>
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Nút Lưu thay đổi */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Đang lưu thay đổi...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Lưu Thay Đổi Hồ Sơ</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
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
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FED7AA',
    marginBottom: 10,
  },
  accountUsername: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  accountEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  readonlyInput: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  readonlyText: {
    color: '#64748B',
  },
  langLoading: {
    marginVertical: 12,
  },
  langList: {
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  langChipSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  langRadioIcon: {
    marginRight: 10,
  },
  langChipText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  langChipTextSelected: {
    color: '#EA580C',
    fontWeight: '700',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  goalCardSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconWrapSelected: {
    backgroundColor: '#FFEDD5',
  },
  unselectedCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  goalCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  goalDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
  goalTextSelected: {
    color: '#EA580C',
  },
  goalDescSelected: {
    color: '#C2410C',
  },
  saveButton: {
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default EditProfileScreen;
