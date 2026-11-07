import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../auth/context/AuthContext';
import { studyService } from '../../study/services/studyService';
import { subscriptionService, ActiveSubscriptionDetail } from '../../payment/services/subscriptionService';
import { apiClient } from '../../../api/client';
import { DeckResponse, Page, ReviewStatsResponse } from '../../../types';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { useTheme } from '../../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { isDark, colors } = useTheme();

  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [recentDecks, setRecentDecks] = useState<DeckResponse[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscriptionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadHomeData = async () => {
    try {
      const [statsData, decksRes, subDetail] = await Promise.all([
        studyService.getReviewStatistics().catch(() => null),
        apiClient.get<Page<DeckResponse>>('/decks', { params: { page: 0, size: 5 } }).catch(() => null),
        subscriptionService.getMyActiveSubscriptions().catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
      }

      if (decksRes?.data?.content) {
        setRecentDecks(decksRes.data.content);
      }

      if (subDetail) {
        setActiveSub(subDetail);
      }
    } catch (error) {
      console.error('[HomeScreen] Lỗi tải dữ liệu trang chủ:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshProfile ? refreshProfile().catch(() => {}) : Promise.resolve(),
      loadHomeData(),
    ]);
  };

  const handleStartStudy = (deck?: DeckResponse) => {
    if (deck) {
      navigation.navigate('FlashcardStudy', {
        deckId: deck.id,
        deckTitle: deck.title,
      });
    } else {
      navigation.navigate('FlashcardStudy', {
        deckTitle: 'Phiên ôn tập hôm nay',
      });
    }
  };

  // Xác định gói đang hoạt động có phải trả phí không
  const isPaidActive = activeSub && activeSub.status === 'ACTIVE' && activeSub.planCode !== 'FREE';

  // Lấy chữ cái đại diện
  const initialLetter = (user?.fullName || user?.username || 'H').trim().charAt(0).toUpperCase();

  // Tính toán tiến độ mục tiêu
  const dailyGoal = user?.dailyGoalCards || 20;
  const todayReviews = stats?.todayReviews ?? 0;
  const progressPercent = Math.min(100, Math.round((todayReviews / dailyGoal) * 100));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.headerBox}>
          <View style={styles.greetingGroup}>
            <Text style={[styles.greetingText, { color: colors.subtext }]}>Xin chào,</Text>
            <View style={styles.nameRow}>
              <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
                {user?.fullName || user?.username || 'Học viên LeLa'}
              </Text>
              {isPaidActive && (
                <View style={styles.proPill}>
                  <Ionicons name="sparkles" size={11} color="#FFFFFF" />
                  <Text style={styles.proPillText}>PRO</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[styles.chatHeaderBtn, { backgroundColor: colors.surface, borderColor: isDark ? '#7C2D12' : '#FED7AA' }]}
              onPress={() => navigation.navigate('SupportChat')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#EA580C" />
              <View style={styles.headerDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.avatarCircle, { backgroundColor: isDark ? '#431407' : '#FFEDD5', borderColor: isDark ? '#9A3412' : '#FED7AA' }]}
              onPress={() => (navigation as any).navigate('ProfileTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarInitialText}>{initialLetter}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gamification Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
              <Ionicons name="flame" size={22} color="#EA580C" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{user?.streakCurrent ?? 0} Ngày</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Chuỗi Streak</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
              <Ionicons name="flash" size={22} color="#D97706" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{user?.xpTotal ?? 0} XP</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Tổng điểm</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: isDark ? '#1E1B4B' : '#E0E7FF' }]}>
              <Ionicons name="ribbon" size={22} color="#4F46E5" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.masteryPercentage ? `${stats.masteryPercentage}%` : user?.currentLevel?.code || 'TOEIC'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              {stats?.masteryPercentage ? 'Thành thạo' : 'Mục tiêu'}
            </Text>
          </View>
        </View>

        {/* Daily Goal Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mục tiêu ôn tập hôm nay</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subtext }]}>Thuật toán Spaced Repetition (SM-2)</Text>
            </View>
            <View style={[styles.goalRatioBadge, { backgroundColor: isDark ? '#431407' : '#FFF7ED', borderColor: isDark ? '#9A3412' : '#FFEDD5' }]}>
              <Text style={styles.goalRatioText}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={[styles.progressBarBackground, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.goalFooter}>
            <Text style={[styles.progressText, { color: colors.subtext }]}>
              Đã ôn tập: <Text style={styles.boldText}>{todayReviews}</Text> / {dailyGoal} thẻ
            </Text>
            {stats && stats.totalCardsLearned > 0 && (
              <Text style={[styles.totalLearnedText, { color: colors.subtext }]}>
                Tổng đã học: {stats.totalCardsLearned} từ
              </Text>
            )}
          </View>
        </View>

        {/* Quick Action Study Banner */}
        <TouchableOpacity
          style={styles.actionBanner}
          activeOpacity={0.85}
          onPress={() => handleStartStudy()}
        >
          <View style={styles.actionBannerLeft}>
            <View style={styles.bannerTag}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text style={styles.bannerTagText}>SRS ÔN TẬP TỰ ĐỘNG</Text>
            </View>
            <Text style={styles.actionBannerTitle}>Bắt đầu phiên học ngay</Text>
            <Text style={styles.actionBannerSubtitle}>
              Tối ưu hóa khả năng ghi nhớ dài hạn theo thuật toán SM-2
            </Text>
          </View>
          <View style={styles.actionBannerButton}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* VIP Upgrade Banner (Chỉ hiện khi chưa là hội viên VIP / Đang dùng Free) */}
        {!isPaidActive && (
          <TouchableOpacity
            style={styles.vipBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <View style={styles.vipIconCircle}>
              <Ionicons name="sparkles" size={22} color="#F59E0B" />
            </View>
            <View style={styles.vipTextGroup}>
              <Text style={styles.vipTitle}>Nâng cấp Gói Hội viên LeLa Pro</Text>
              <Text style={styles.vipSubtitle}>Mở khóa Gia sư AI, Đề thi TOEIC & VietQR SePay</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7D2FE" />
          </TouchableOpacity>
        )}

        {/* Quick Practice Shortcuts */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trung tâm Luyện tập & Phản xạ</Text>
        <View style={styles.shortcutGrid}>
          {/* Card 1: Khảo Thí */}
          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: isDark ? '#431407' : '#FFF7ED', borderColor: isDark ? '#9A3412' : '#FFEDD5' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('QuizList')}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: isDark ? '#7C2D12' : '#FFEDD5' }]}>
              <Ionicons name="school" size={22} color="#EA580C" />
            </View>
            <Text style={[styles.shortcutTitle, { color: colors.text }]}>Khảo Thí TOEIC</Text>
            <Text style={[styles.shortcutDesc, { color: colors.subtext }]}>Đề thi trắc nghiệm & Tính điểm</Text>
          </TouchableOpacity>

          {/* Card 2: Gia Sư AI Voice (Chuẩn biểu tượng AI hiện đại) */}
          <TouchableOpacity
            style={[
              styles.shortcutCard,
              {
                backgroundColor: isDark ? '#2E1065' : '#FAF5FF',
                borderColor: isDark ? '#6B21A8' : '#D8B4FE',
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VoiceScenarioSelect')}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: isDark ? '#3B0764' : '#F3E8FF', borderWidth: 1, borderColor: '#C084FC' }]}>
              <Ionicons name="sparkles" size={22} color="#8B5CF6" />
            </View>
            <View style={styles.aiTitleRow}>
              <Text style={[styles.shortcutTitle, { color: colors.text }]}>Gia Sư AI</Text>
              <View style={styles.aiBadgeTag}>
                <Text style={styles.aiBadgeTagText}>VOICE</Text>
              </View>
            </View>
            <Text style={[styles.shortcutDesc, { color: colors.subtext }]}>Luyện nói phản xạ 2 chiều</Text>
          </TouchableOpacity>

          {/* Card 3: Word Rain */}
          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: isDark ? '#082F49' : '#F0F9FF', borderColor: isDark ? '#0369A1' : '#E0F2FE' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('WordRainDeckSelect')}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: isDark ? '#0C4A6E' : '#E0F2FE' }]}>
              <Ionicons name="game-controller" size={22} color="#0284C7" />
            </View>
            <Text style={[styles.shortcutTitle, { color: colors.text }]}>Word Rain</Text>
            <Text style={[styles.shortcutDesc, { color: colors.subtext }]}>Game gõ chữ rèn phản xạ</Text>
          </TouchableOpacity>

          {/* Card 4: Kho Bộ Thẻ */}
          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: isDark ? '#3730A3' : '#E0E7FF' }]}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('DecksTab')}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: isDark ? '#312E81' : '#E0E7FF' }]}>
              <Ionicons name="book" size={22} color="#4F46E5" />
            </View>
            <Text style={[styles.shortcutTitle, { color: colors.text }]}>Kho Bộ Thẻ</Text>
            <Text style={[styles.shortcutDesc, { color: colors.subtext }]}>500+ từ vựng theo chủ đề</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Learning Decks Section */}
        {recentDecks.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bộ thẻ học tập</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('DecksTab')}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentDecks.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  style={[styles.deckMiniCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => handleStartStudy(deck)}
                >
                  <View style={styles.deckMiniHeader}>
                    <View style={[styles.deckMiniBadge, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
                      <Text style={styles.deckMiniBadgeText}>{deck.difficulty || 'TOEIC'}</Text>
                    </View>
                    <Ionicons name="play-circle" size={24} color="#EA580C" />
                  </View>
                  <Text style={[styles.deckMiniTitle, { color: colors.text }]} numberOfLines={2}>
                    {deck.title}
                  </Text>
                  <View style={styles.deckMiniMeta}>
                    <Ionicons name="copy-outline" size={13} color={colors.subtext} />
                    <Text style={[styles.deckMiniMetaText, { color: colors.subtext }]}>
                      {deck.totalCards || 0} thẻ
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button: AI & Support Chat */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => navigation.navigate('SupportChat')}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        <View style={styles.chatFabBadge}>
          <Text style={styles.chatFabBadgeText}>AI</Text>
        </View>
      </TouchableOpacity>
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
    paddingBottom: 80,
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  greetingGroup: {
    flex: 1,
    paddingRight: 12,
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  headerDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  avatarInitialText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA580C',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  statIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  goalRatioBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  goalRatioText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
  },
  boldText: {
    fontWeight: '700',
    color: '#EA580C',
  },
  totalLearnedText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBannerLeft: {
    flex: 1,
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bannerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFEDD5',
    letterSpacing: 0.5,
  },
  actionBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionBannerSubtitle: {
    fontSize: 12,
    color: '#FFEDD5',
    lineHeight: 16,
  },
  actionBannerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  vipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vipTextGroup: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  vipSubtitle: {
    fontSize: 11,
    color: '#C7D2FE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  shortcutCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  shortcutIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  aiBadgeTag: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  aiBadgeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  shortcutDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  recentSection: {
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
  },
  horizontalScroll: {
    gap: 12,
    paddingRight: 16,
  },
  deckMiniCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  deckMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deckMiniBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deckMiniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  deckMiniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    height: 38,
    marginBottom: 8,
  },
  deckMiniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deckMiniMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  chatFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  chatFabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chatFabBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
