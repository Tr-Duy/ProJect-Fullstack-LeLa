import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import statsService from '../services/statsService';
import { UserStudyStats } from '../../../types';
import { useAuth } from '../../auth/context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const StudyStatsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [stats, setStats] = useState<UserStudyStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await statsService.getUserStudyStats();
      setStats(data);
    } catch (error) {
      console.error('[StudyStatsScreen] Lỗi tải thống kê học tập:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  const maxDailyCards = Math.max(
    ...(stats?.dailyActivities.map((d) => d.cardsCount) || [10]),
    10
  );

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
          <Text style={styles.headerTitle}>Thống Kê Tiến Độ Học</Text>
          <Text style={styles.headerSubtitle}>Phân tích hiệu suất ghi nhớ Spaced Repetition</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Đang tổng hợp dữ liệu học tập...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
          {/* Lưới Thống Kê Tổng Quan (Stats Grid) */}
          <Text style={styles.sectionHeader}>Tổng quan học tập</Text>
          <View style={styles.gridRow}>
            {/* Thẻ thành thạo */}
            <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-done" size={22} color="#16A34A" />
              </View>
              <Text style={styles.statBoxValue}>{stats?.masteredWords || 0}</Text>
              <Text style={styles.statBoxLabel}>Từ vựng đã thuộc</Text>
              <Text style={styles.statBoxSub}>Thành thạo SM-2</Text>
            </View>

            {/* Chuỗi Streak */}
            <View style={[styles.statBox, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="flame" size={22} color="#EA580C" />
              </View>
              <Text style={styles.statBoxValue}>{stats?.streakCurrent || user?.streakCurrent || 0}</Text>
              <Text style={styles.statBoxLabel}>Ngày streak liên tục</Text>
              <Text style={styles.statBoxSub}>Kỷ lục: {user?.streakLongest || stats?.streakCurrent || 0} ngày</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Tổng điểm XP */}
            <View style={[styles.statBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#FDE68A' }]}>
                <Ionicons name="flash" size={22} color="#D97706" />
              </View>
              <Text style={styles.statBoxValue}>{stats?.xpTotal || user?.xpTotal || 0}</Text>
              <Text style={styles.statBoxLabel}>Tổng điểm kinh nghiệm</Text>
              <Text style={styles.statBoxSub}>Tích lũy toàn thời gian</Text>
            </View>

            {/* Tỉ lệ thành thạo */}
            <View style={[styles.statBox, { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' }]}>
              <View style={[styles.statIconBadge, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="pie-chart" size={22} color="#4F46E5" />
              </View>
              <Text style={styles.statBoxValue}>{stats?.masteryPercentage || 0}%</Text>
              <Text style={styles.statBoxLabel}>Tỉ lệ ghi nhớ tối ưu</Text>
              <Text style={styles.statBoxSub}>Hệ số Ease Factor</Text>
            </View>
          </View>

          {/* Biểu đồ Cột Hoạt Động 7 Ngày Gần Nhất */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Hoạt động ôn tập 7 ngày qua</Text>
                <Text style={styles.chartSubtitle}>Số lượng thẻ Flashcard đã tương tác mỗi ngày</Text>
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Số thẻ</Text>
              </View>
            </View>

            <View style={styles.barChartContainer}>
              {stats?.dailyActivities.map((day, idx) => {
                const heightPercent = Math.max(12, Math.round((day.cardsCount / maxDailyCards) * 100));
                const isToday = idx === stats.dailyActivities.length - 1;

                return (
                  <View key={day.date} style={styles.barCol}>
                    <Text style={styles.barTopCount}>{day.cardsCount}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${heightPercent}%` },
                          isToday && styles.barFillToday,
                        ]}
                      />
                    </View>
                    <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                      {day.dayLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Chi tiết phân bổ học tập */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Chỉ số chuyên sâu</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="layers-outline" size={20} color="#EA580C" />
                <Text style={styles.detailLabel}>Tổng số thẻ đã học</Text>
              </View>
              <Text style={styles.detailValue}>{stats?.totalCardsLearned || 0} thẻ</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="time-outline" size={20} color="#0284C7" />
                <Text style={styles.detailLabel}>Thời gian học ước tính</Text>
              </View>
              <Text style={styles.detailValue}>{stats?.totalTimeSpentMinutes || 0} phút</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="document-text-outline" size={20} color="#16A34A" />
                <Text style={styles.detailLabel}>Bài kiểm tra TOEIC đã làm</Text>
              </View>
              <Text style={styles.detailValue}>{stats?.totalQuizzesCompleted || 0} bài</Text>
            </View>
          </View>

          {/* Quick Study Action Button */}
          <TouchableOpacity
            style={styles.startStudyBtn}
            onPress={() =>
              navigation.navigate('FlashcardStudy', {
                deckTitle: 'Phiên ôn tập hôm nay',
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.startStudyBtnText}>Tiếp tục ôn tập Flashcard</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      )}
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
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  statBoxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  statBoxSub: {
    fontSize: 11,
    color: '#64748B',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  barTrack: {
    width: 18,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#FED7AA',
    borderRadius: 9,
  },
  barFillToday: {
    backgroundColor: '#EA580C',
  },
  dayLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
  },
  dayLabelToday: {
    color: '#EA580C',
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  startStudyBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  startStudyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default StudyStatsScreen;

