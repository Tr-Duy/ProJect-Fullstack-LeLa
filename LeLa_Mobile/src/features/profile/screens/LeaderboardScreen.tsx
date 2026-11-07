import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import statsService from '../services/statsService';
import { LeaderboardEntry } from '../../../types';
import { useAuth } from '../../auth/context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PeriodType = 'weekly' | 'monthly';

export const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadLeaderboardData();
  }, [period]);

  const loadLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const [listData, myRankData] = await Promise.all([
        statsService.getLeaderboard(period, 0, 50),
        statsService.getMyLeaderboardRank(),
      ]);

      setRankings(listData || []);
      setMyRank(myRankData);
    } catch (error) {
      console.error('[LeaderboardScreen] Lỗi tải BXH:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLeaderboardData();
  };

  // Tách Top 3 và Danh sách từ hạng 4 trở xuống
  const top1 = rankings[0] || null;
  const top2 = rankings[1] || null;
  const top3 = rankings[2] || null;
  const restRankings = rankings.slice(3);

  // Tìm thứ hạng của người dùng trong danh sách nếu myRank API chưa có
  const currentUserId = user?.id ? Number(user.id) : null;
  const userInListIndex = rankings.findIndex(
    (item) => item.userId === currentUserId || item.username === user?.username
  );

  const effectiveMyRankNumber = myRank?.rank || (userInListIndex >= 0 ? userInListIndex + 1 : '--');
  const effectiveMyScore = myRank?.totalScore || myRank?.xpScore || user?.xpTotal || 0;

  const renderRankItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rankNo = index + 4;
    const isCurrentUser = item.userId === currentUserId || item.username === user?.username;

    return (
      <View style={[styles.rankRow, isCurrentUser && styles.currentUserRow]}>
        <View style={styles.rankNumberContainer}>
          <Text style={styles.rankNumberText}>#{rankNo}</Text>
        </View>

        <View style={styles.avatarMini}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>
              {(item.fullName || item.username || 'U')[0].toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.fullName || item.username || 'Học viên'}
            {isCurrentUser && ' (Bạn)'}
          </Text>
          <View style={styles.userSubRow}>
            {item.streakDays ? (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#EA580C" />
                <Text style={styles.streakText}>{item.streakDays} ngày</Text>
              </View>
            ) : null}
            {item.cardsMastered ? (
              <Text style={styles.cardsCountText}>{item.cardsMastered} từ</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.totalScore || item.xpScore || 0}</Text>
          <Text style={styles.scoreUnit}>XP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Bảng Xếp Hạng Thi Đua</Text>
          <Text style={styles.headerSubtitle}>Tích lũy XP qua các bài học Flashcard & Quiz</Text>
        </View>
      </View>

      {/* Period Toggle Tabs */}
      <View style={styles.periodTabsContainer}>
        <TouchableOpacity
          style={[styles.periodTab, period === 'weekly' && styles.periodTabActive]}
          onPress={() => setPeriod('weekly')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={period === 'weekly' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.periodTabText, period === 'weekly' && styles.periodTabTextActive]}
          >
            Bảng Tuần Này
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodTab, period === 'monthly' && styles.periodTabActive]}
          onPress={() => setPeriod('monthly')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trophy-outline"
            size={16}
            color={period === 'monthly' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[styles.periodTabText, period === 'monthly' && styles.periodTabTextActive]}
          >
            Bảng Tháng Này
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Đang cập nhật bảng xếp hạng...</Text>
        </View>
      ) : (
        <FlatList
          data={restRankings}
          keyExtractor={(item, index) => `${item.userId || index}`}
          renderItem={renderRankItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#EA580C']}
              tintColor="#EA580C"
            />
          }
          ListHeaderComponent={
            <View style={styles.podiumContainer}>
              {/* Top 2: Bạc */}
              <View style={[styles.podiumItem, styles.podiumRank2]}>
                <View style={styles.podiumMedalBadge}>
                  <Text style={styles.podiumMedalEmoji}>🥈</Text>
                </View>
                <View style={[styles.podiumAvatarFrame, styles.silverBorder]}>
                  {top2?.avatarUrl ? (
                    <Image source={{ uri: top2.avatarUrl }} style={styles.podiumAvatarImg} />
                  ) : (
                    <Text style={styles.podiumAvatarText}>
                      {(top2?.fullName || top2?.username || '2')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {top2?.fullName || top2?.username || 'Học viên #2'}
                </Text>
                <View style={styles.podiumPill}>
                  <Text style={styles.podiumPillText}>{top2?.totalScore || top2?.xpScore || 0} XP</Text>
                </View>
                <View style={[styles.podiumBar, styles.podiumBar2]}>
                  <Text style={styles.podiumRankNo}>2</Text>
                </View>
              </View>

              {/* Top 1: Vàng (Cao nhất ở giữa) */}
              <View style={[styles.podiumItem, styles.podiumRank1]}>
                <View style={styles.crownWrapper}>
                  <Ionicons name="sparkles" size={20} color="#FBBF24" />
                </View>
                <View style={styles.podiumMedalBadgeGold}>
                  <Text style={styles.podiumMedalEmoji}>🥇</Text>
                </View>
                <View style={[styles.podiumAvatarFrameGold, styles.goldBorder]}>
                  {top1?.avatarUrl ? (
                    <Image source={{ uri: top1.avatarUrl }} style={styles.podiumAvatarImgGold} />
                  ) : (
                    <Text style={styles.podiumAvatarTextGold}>
                      {(top1?.fullName || top1?.username || '1')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.podiumNameGold} numberOfLines={1}>
                  {top1?.fullName || top1?.username || 'Học viên #1'}
                </Text>
                <View style={styles.podiumPillGold}>
                  <Text style={styles.podiumPillTextGold}>
                    {top1?.totalScore || top1?.xpScore || 0} XP
                  </Text>
                </View>
                <View style={[styles.podiumBar, styles.podiumBar1]}>
                  <Text style={styles.podiumRankNoGold}>1</Text>
                </View>
              </View>

              {/* Top 3: Đồng */}
              <View style={[styles.podiumItem, styles.podiumRank3]}>
                <View style={styles.podiumMedalBadge}>
                  <Text style={styles.podiumMedalEmoji}>🥉</Text>
                </View>
                <View style={[styles.podiumAvatarFrame, styles.bronzeBorder]}>
                  {top3?.avatarUrl ? (
                    <Image source={{ uri: top3.avatarUrl }} style={styles.podiumAvatarImg} />
                  ) : (
                    <Text style={styles.podiumAvatarText}>
                      {(top3?.fullName || top3?.username || '3')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {top3?.fullName || top3?.username || 'Học viên #3'}
                </Text>
                <View style={styles.podiumPill}>
                  <Text style={styles.podiumPillText}>{top3?.totalScore || top3?.xpScore || 0} XP</Text>
                </View>
                <View style={[styles.podiumBar, styles.podiumBar3]}>
                  <Text style={styles.podiumRankNo}>3</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có học viên nào trong bảng này.</Text>
            </View>
          }
        />
      )}

      {/* Sticky Bottom Row: Thứ hạng của chính người dùng */}
      <View style={styles.stickyUserBottomBar}>
        <View style={styles.stickyRankGroup}>
          <Text style={styles.stickyRankLabel}>Thứ hạng của bạn</Text>
          <Text style={styles.stickyRankVal}>#{effectiveMyRankNumber}</Text>
        </View>

        <View style={styles.stickyAvatarCircle}>
          <Ionicons name="person" size={20} color="#EA580C" />
        </View>

        <View style={styles.stickyUserInfo}>
          <Text style={styles.stickyUserName} numberOfLines={1}>
            {user?.fullName || user?.username || 'Bạn'}
          </Text>
          <Text style={styles.stickyUserStreak}>
            Streak: {user?.streakCurrent || 0} ngày liên tục 🔥
          </Text>
        </View>

        <View style={styles.stickyScoreGroup}>
          <Text style={styles.stickyScoreVal}>{effectiveMyScore}</Text>
          <Text style={styles.stickyScoreUnit}>XP</Text>
        </View>
      </View>
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
  periodTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  periodTabActive: {
    backgroundColor: '#EA580C',
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
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
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumRank1: {
    zIndex: 2,
  },
  podiumRank2: {
    marginTop: 20,
  },
  podiumRank3: {
    marginTop: 30,
  },
  crownWrapper: {
    marginBottom: -4,
  },
  podiumMedalBadge: {
    marginBottom: 4,
  },
  podiumMedalBadgeGold: {
    marginBottom: 4,
  },
  podiumMedalEmoji: {
    fontSize: 20,
  },
  podiumAvatarFrame: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 6,
  },
  silverBorder: {
    borderColor: '#CBD5E1',
  },
  bronzeBorder: {
    borderColor: '#FDBA74',
  },
  podiumAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  podiumAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#475569',
  },
  podiumAvatarFrameGold: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    marginBottom: 6,
  },
  goldBorder: {
    borderColor: '#FBBF24',
  },
  podiumAvatarImgGold: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  podiumAvatarTextGold: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D97706',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  podiumNameGold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  podiumPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  podiumPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  podiumPillGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  podiumPillTextGold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  podiumBar: {
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumBar1: {
    height: 90,
    backgroundColor: '#FBBF24',
  },
  podiumBar2: {
    height: 70,
    backgroundColor: '#CBD5E1',
  },
  podiumBar3: {
    height: 55,
    backgroundColor: '#FED7AA',
  },
  podiumRankNo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  podiumRankNoGold: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentUserRow: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  rankNumberContainer: {
    width: 34,
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  userSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '600',
  },
  cardsCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
  },
  scoreUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: '#94A3B8',
  },
  stickyUserBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyRankGroup: {
    alignItems: 'center',
    marginRight: 14,
  },
  stickyRankLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stickyRankVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
  },
  stickyAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stickyUserInfo: {
    flex: 1,
  },
  stickyUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stickyUserStreak: {
    fontSize: 11,
    color: '#FDBA74',
    marginTop: 2,
  },
  stickyScoreGroup: {
    alignItems: 'flex-end',
  },
  stickyScoreVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
  },
  stickyScoreUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
});

export default LeaderboardScreen;

