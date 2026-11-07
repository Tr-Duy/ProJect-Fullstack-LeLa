import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { subscriptionService, ActiveSubscriptionDetail } from '../../payment/services/subscriptionService';
import { useTheme } from '../../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { isDark, colors } = useTheme();

  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeSub, setActiveSub] = useState<ActiveSubscriptionDetail | null>(null);

  useEffect(() => {
    loadUserSubscription();
  }, []);

  const loadUserSubscription = async () => {
    try {
      const detail = await subscriptionService.getMyActiveSubscriptions();
      setActiveSub(detail || null);
    } catch (e) {
      console.warn('[ProfileScreen] Lỗi tải thông tin gói cước:', e);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshProfile ? refreshProfile().catch(() => {}) : Promise.resolve(),
      loadUserSubscription(),
    ]);
    setIsRefreshing(false);
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản trên thiết bị này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Vĩnh viễn';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Vĩnh viễn';
    return date.toLocaleDateString('vi-VN');
  };

  // Xác định quyền quản trị
  const isAdmin =
    user?.roles?.includes('ADMIN') ||
    (user?.roles as any)?.includes('ROLE_ADMIN') ||
    (user as any)?.role === 'ROLE_ADMIN' ||
    (user as any)?.role === 'ADMIN' ||
    (user as any)?.roles?.some((r: any) =>
      typeof r === 'string'
        ? r === 'ROLE_ADMIN' || r === 'ADMIN'
        : r?.name === 'ROLE_ADMIN' || r?.name === 'ADMIN'
    );

  // Xác định gói đang hoạt động
  const isPaidActive = activeSub && activeSub.status === 'ACTIVE' && activeSub.planCode !== 'FREE';

  // Lấy chữ cái đại diện
  const initialLetter = (user?.fullName || user?.username || 'H').trim().charAt(0).toUpperCase();

  // Kiểm tra cấp độ
  const hasLevel = Boolean(user?.currentLevel?.name || user?.currentLevel?.code);
  const levelDisplayText = hasLevel
    ? user?.currentLevel?.name || user?.currentLevel?.code
    : 'Chưa phân cấp';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Hero Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar Chữ Cái Đầu Căn Giữa */}
          <View style={[styles.avatarWrapper, { backgroundColor: isDark ? '#431407' : '#FFEDD5', borderColor: isDark ? '#9A3412' : '#FDBA74' }]}>
            <Text style={styles.avatarInitial}>{initialLetter}</Text>
          </View>

          {/* Tên và Email từ dữ liệu thực */}
          <Text style={[styles.fullNameText, { color: colors.text }]}>
            {user?.fullName || user?.username || 'Học viên'}
          </Text>
          <Text style={[styles.emailText, { color: colors.subtext }]}>
            {user?.email || 'Chưa cập nhật email'}
          </Text>

          {/* Badges Container Co Giãn Không Đè Trục */}
          <View style={styles.badgeRow}>
            {/* Role Badge */}
            {isAdmin ? (
              <View style={[styles.badgePill, styles.adminBadge]}>
                <Ionicons name="shield-checkmark" size={12} color="#DC2626" />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            ) : (
              <View style={[styles.badgePill, styles.learnerBadge, { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderColor: isDark ? '#475569' : '#E2E8F0' }]}>
                <Ionicons name="person-outline" size={12} color={isDark ? '#CBD5E1' : '#64748B'} />
                <Text style={[styles.learnerBadgeText, { color: isDark ? '#CBD5E1' : '#64748B' }]}>HỌC VIÊN</Text>
              </View>
            )}

            {/* Subscription Tier Badge */}
            {isPaidActive ? (
              activeSub?.planCode === 'PLUS' ? (
                <View style={[styles.badgePill, styles.plusBadge]}>
                  <Ionicons name="flash" size={12} color="#0284C7" />
                  <Text style={styles.plusBadgeText}>GÓI PLUS</Text>
                </View>
              ) : (
                <View style={[styles.badgePill, styles.vipBadge]}>
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  <Text style={styles.vipBadgeText}>VIP PRO</Text>
                </View>
              )
            ) : (
              <View style={[styles.badgePill, styles.freeBadge, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? '#475569' : '#CBD5E1' }]}>
                <Ionicons name="shield-outline" size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text style={[styles.freeBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>GÓI MIỄN PHÍ</Text>
              </View>
            )}

            {/* Level Badge */}
            <TouchableOpacity
              style={[
                styles.badgePill,
                hasLevel ? styles.levelBadge : styles.warningLevelBadge,
              ]}
              onPress={() => !hasLevel && navigation.navigate('AssessmentCenter')}
              activeOpacity={hasLevel ? 1 : 0.7}
            >
              <Ionicons
                name={hasLevel ? 'ribbon-outline' : 'alert-circle-outline'}
                size={12}
                color={hasLevel ? '#0284C7' : '#EA580C'}
              />
              <Text style={[styles.levelBadgeText, { color: hasLevel ? '#0284C7' : '#EA580C' }]}>
                {levelDisplayText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Status Card */}
        {isPaidActive ? (
          <View style={[styles.paidVipCard, { borderColor: isDark ? '#4338CA' : '#6366F1' }]}>
            <View style={styles.vipCardHeader}>
              <View style={styles.vipIconCircle}>
                <Ionicons name="diamond" size={24} color="#F59E0B" />
              </View>
              <View style={styles.vipCardTitleGroup}>
                <Text style={styles.vipCardTitle}>
                  {activeSub?.planName || 'Gói Hội viên Đang Hoạt động'}
                </Text>
                <Text style={styles.vipCardSubtitle}>
                  {activeSub?.isLifetime
                    ? 'Thời hạn: Vĩnh viễn (Trọn đời)'
                    : activeSub?.expiresAt
                    ? `Hết hạn: ${formatDate(activeSub.expiresAt)}`
                    : 'Trạng thái: Đang hoạt động'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.manageSubButton}
              onPress={() => navigation.navigate('SubscriptionManagement')}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.manageSubButtonText}>Xem chi tiết / Quản lý gói</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.freePlanCard, { backgroundColor: colors.card, borderColor: isDark ? '#7C2D12' : '#FDBA74' }]}>
            <View style={styles.vipCardHeader}>
              <View style={[styles.freeIconCircle, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
                <Ionicons name="sparkles" size={24} color="#EA580C" />
              </View>
              <View style={styles.vipCardTitleGroup}>
                <Text style={[styles.freeCardTitle, { color: colors.text }]}>Gói Miễn Phí (Tiêu chuẩn)</Text>
                <Text style={[styles.freeCardSubtitle, { color: colors.subtext }]}>
                  Mở khóa toàn bộ tính năng Luyện nói AI & Kho đề TOEIC không giới hạn
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.upgradeNowButton}
              onPress={() => navigation.navigate('SubscriptionPlans')}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.upgradeNowButtonText}>Nâng cấp ngay</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Level & Target Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin Lộ trình & Cấp độ</Text>
            <TouchableOpacity
              style={[styles.sectionHeaderLink, { backgroundColor: isDark ? '#431407' : '#FFF7ED' }]}
              onPress={() => navigation.navigate('AssessmentCenter')}
            >
              <Text style={styles.sectionHeaderLinkText}>Khảo thí</Text>
              <Ionicons name="chevron-forward" size={13} color="#EA580C" />
            </TouchableOpacity>
          </View>

          <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="ribbon-outline" size={20} color="#EA580C" />
              <Text style={[styles.rowLabel, { color: colors.subtext }]}>Cấp độ hiện tại</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.rowValue, { color: hasLevel ? colors.text : '#EA580C' }]}>
                {levelDisplayText}
              </Text>
              {!hasLevel && (
                <TouchableOpacity
                  style={styles.placementPill}
                  onPress={() => navigation.navigate('AssessmentCenter')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.placementPillText}>Thi xếp lớp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="school-outline" size={20} color="#0284C7" />
              <Text style={[styles.rowLabel, { color: colors.subtext }]}>Thang điểm mục tiêu</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              {user?.currentExamType?.name || 'TOEIC (Max 990)'}
            </Text>
          </View>

          <View style={[styles.rowItem, { borderBottomColor: 'transparent' }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="flag-outline" size={20} color="#16A34A" />
              <Text style={[styles.rowLabel, { color: colors.subtext }]}>Mục tiêu ngày</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              {user?.dailyGoalCards ? `${user.dailyGoalCards} thẻ` : '20 thẻ'}
            </Text>
          </View>
        </View>

        {/* Leaderboard & Study Stats Hub */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Khảo thí & Thi đua</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('AssessmentCenter')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
                <Ionicons name="school" size={18} color="#EA580C" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Trung tâm Khảo thí & Đánh giá</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Thi xếp lớp, nâng cấp Level & thi tốt nghiệp</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('AssessmentHistory')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Ionicons name="time" size={18} color="#0284C7" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Lịch sử Khảo thí & Xem lại Bài thi</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Tra cứu điểm số, đáp án đúng & giải thích chi tiết</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Leaderboard')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                <Ionicons name="trophy" size={18} color="#D97706" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Bảng xếp hạng thi đua (Leaderboard)</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Vinh danh Top học viên tuần & tháng</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('StudyStats')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="stats-chart" size={18} color="#4F46E5" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Thống kê tiến độ học tập</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Phân tích thẻ nhớ, Streak & Biểu đồ 7 ngày</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cài đặt & Tài khoản</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Ionicons name="person-circle-outline" size={20} color="#0284C7" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Chỉnh sửa hồ sơ cá nhân</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Cập nhật tên, ngôn ngữ & mục tiêu thẻ ngày</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('AppSettings')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
                <Ionicons name="settings-outline" size={20} color="#DC2626" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Cài đặt ứng dụng & Bảo mật</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Đổi mật khẩu, giao diện tối, âm thanh</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('NotificationSettings')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
                <Ionicons name="notifications-outline" size={20} color="#EA580C" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Cài đặt thông báo & Nhắc nhở</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Lịch ôn Flashcard & Giữ streak 20:00</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('SubscriptionManagement')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="card-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Quản lý Gói & Lịch sử thanh toán</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Nâng cấp hội viên LeLa Pro & VietQR</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('SupportChat')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#2E1065' : '#EDE9FE' }]}>
                <Ionicons name="chatbubbles-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Trung tâm hỗ trợ & Chat trực tuyến</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Gia sư AI 24/7 & Kênh giải đáp Admin</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleRefresh}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                <Ionicons name="sync-outline" size={20} color={isDark ? '#94A3B8' : '#475569'} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Đồng bộ lại thông tin</Text>
                <Text style={[styles.actionSubLabel, { color: colors.subtext }]}>Làm mới dữ liệu từ máy chủ</Text>
              </View>
            </View>
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#EA580C" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: isDark ? '#450A0A' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FECACA' }]}
          onPress={handleLogoutPress}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Đăng xuất khỏi tài khoản</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FDBA74',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#EA580C',
  },
  fullNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  adminBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  learnerBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  learnerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  freeBadge: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  plusBadge: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  plusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  vipBadge: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  warningLevelBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paidVipCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    elevation: 3,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  freePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  vipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  vipIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  freeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vipCardTitleGroup: {
    flex: 1,
  },
  vipCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  vipCardSubtitle: {
    fontSize: 12,
    color: '#C7D2FE',
    lineHeight: 16,
  },
  freeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  freeCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  manageSubButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  manageSubButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upgradeNowButton: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  upgradeNowButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionHeaderLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  placementPill: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  placementPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  actionSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    height: 52,
    marginTop: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
