import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { QuizAttemptResponse } from '../../../types';
import { quizService } from '../services/quizService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterCategory = 'ALL' | 'PLACEMENT' | 'LEVEL_UP' | 'FINAL' | 'PRACTICE';

interface FilterOption {
  key: FilterCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'ALL', label: 'Tất cả', icon: 'grid-outline' },
  { key: 'PLACEMENT', label: 'Thi Xếp Lớp', icon: 'school-outline' },
  { key: 'LEVEL_UP', label: 'Thăng Cấp', icon: 'trending-up-outline' },
  { key: 'FINAL', label: 'Khảo Thí TOEIC', icon: 'ribbon-outline' },
  { key: 'PRACTICE', label: 'Luyện Tập', icon: 'fitness-outline' },
];

export const AssessmentHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [attempts, setAttempts] = useState<QuizAttemptResponse[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    loadHistory(0, true);
  }, []);

  const loadHistory = async (targetPage = 0, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }
    try {
      const res = await quizService.getQuizHistory(targetPage, 30);
      const items = res?.content || [];

      if (targetPage === 0) {
        setAttempts(items);
      } else {
        setAttempts((prev) => [...prev, ...items]);
      }

      setPage(targetPage);
      setHasMore(targetPage + 1 < res.totalPages && items.length > 0);
    } catch (error) {
      console.error('[AssessmentHistoryScreen] Lỗi khi tải lịch sử bài thi:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory(0, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    loadHistory(page + 1, false);
  };

  // Lọc danh sách theo chip bộ lọc
  const filteredAttempts = useMemo(() => {
    if (selectedFilter === 'ALL') return attempts;
    return attempts.filter((item) => {
      const cat = item.quizCategory;
      if (selectedFilter === 'PLACEMENT') return cat === 'PLACEMENT';
      if (selectedFilter === 'LEVEL_UP') return cat === 'LEVEL_UP';
      if (selectedFilter === 'FINAL') return cat === 'FINAL' || cat === 'FINAL_LEVEL';
      if (selectedFilter === 'PRACTICE') return !cat || cat === 'PRACTICE';
      return true;
    });
  }, [attempts, selectedFilter]);

  // Thống kê tổng quan từ danh sách toàn bộ lượt thi
  const summaryStats = useMemo(() => {
    const total = attempts.length;
    if (total === 0) {
      return { total: 0, highestScore: 0, avgPercent: 0, passRate: 0 };
    }

    let highestToeic = 0;
    let sumPercent = 0;
    let passedCount = 0;

    attempts.forEach((a) => {
      if (a.estimatedToeicScore && Number(a.estimatedToeicScore) > highestToeic) {
        highestToeic = Math.round(Number(a.estimatedToeicScore));
      }
      sumPercent += Number(a.scorePercent || 0);
      if (a.passed) {
        passedCount += 1;
      }
    });

    const avgPercent = Math.round(sumPercent / total);
    const passRate = Math.round((passedCount / total) * 100);

    return {
      total,
      highestScore: highestToeic > 0 ? highestToeic : avgPercent,
      isToeicHighest: highestToeic > 0,
      avgPercent,
      passRate,
    };
  }, [attempts]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} • ${day}/${month}/${year}`;
  };

  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'PLACEMENT':
        return {
          title: 'Xếp Lớp Đầu Vào',
          bgColor: '#fff7ed',
          textColor: '#ea580c',
          borderColor: '#fed7aa',
          icon: 'school' as const,
        };
      case 'LEVEL_UP':
        return {
          title: 'Thi Thăng Cấp',
          bgColor: '#eff6ff',
          textColor: '#2563eb',
          borderColor: '#bfdbfe',
          icon: 'trending-up' as const,
        };
      case 'FINAL':
      case 'FINAL_LEVEL':
        return {
          title: 'Tốt Nghiệp Level',
          bgColor: '#faf5ff',
          textColor: '#9333ea',
          borderColor: '#e9d5ff',
          icon: 'ribbon' as const,
        };
      case 'PRACTICE':
      default:
        return {
          title: 'Luyện Tập Tự Do',
          bgColor: '#f0fdf4',
          textColor: '#16a34a',
          borderColor: '#bbf7d0',
          icon: 'fitness' as const,
        };
    }
  };

  const handleOpenReview = (attempt: QuizAttemptResponse) => {
    navigation.navigate('AssessmentReviewDetail', {
      publicId: attempt.publicId,
    });
  };

  const renderHeader = () => (
    <View>
      {/* Thẻ Thống kê Tóm tắt */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTitleGroup}>
            <Text style={styles.summaryTitle}>Tổng Quan Khảo Thí</Text>
            <Text style={styles.summarySubtitle}>Lịch sử quá trình ôn luyện & đánh giá</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name="sparkles" size={14} color="#ea580c" />
            <Text style={styles.summaryBadgeText}>{summaryStats.total} lượt thi</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Cột 1: Điểm cao nhất */}
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {summaryStats.highestScore}
              {summaryStats.isToeicHighest ? '' : '%'}
            </Text>
            <Text style={styles.statLabel}>
              {summaryStats.isToeicHighest ? 'Điểm TOEIC cao nhất' : 'Điểm cao nhất'}
            </Text>
          </View>

          <View style={styles.statDivider} />

          {/* Cột 2: Điểm TB */}
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{summaryStats.avgPercent}%</Text>
            <Text style={styles.statLabel}>Điểm chính xác TB</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Cột 3: Tỷ lệ đạt */}
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>
              {summaryStats.passRate}%
            </Text>
            <Text style={styles.statLabel}>Tỷ lệ đạt chuẩn</Text>
          </View>
        </View>
      </View>

      {/* Bộ Lọc Danh Mục (Filter Chips) */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterListContent}
          renderItem={({ item }) => {
            const isActive = selectedFilter === item.key;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(item.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={isActive ? '#ffffff' : '#64748b'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  const renderAttemptItem = ({ item }: { item: QuizAttemptResponse }) => {
    const config = getCategoryConfig(item.quizCategory);
    const isPassed = item.passed === true;

    // Hiển thị điểm số TOEIC hoặc tỷ lệ đúng
    const hasToeicScore = item.estimatedToeicScore !== undefined && item.estimatedToeicScore !== null;
    const scoreDisplay = hasToeicScore
      ? `${Math.round(Number(item.estimatedToeicScore))} TOEIC`
      : `${Math.round(Number(item.scorePercent || 0))}%`;

    const timeSpentMinutes = Math.floor((item.timeSpentSeconds || 0) / 60);
    const timeSpentSeconds = (item.timeSpentSeconds || 0) % 60;
    const durationText =
      timeSpentMinutes > 0
        ? `${timeSpentMinutes}p ${timeSpentSeconds}s`
        : `${timeSpentSeconds}s`;

    return (
      <TouchableOpacity
        style={styles.attemptCard}
        onPress={() => handleOpenReview(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeaderRow}>
          {/* Badge phân loại */}
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: config.bgColor, borderColor: config.borderColor },
            ]}
          >
            <Ionicons name={config.icon} size={13} color={config.textColor} />
            <Text style={[styles.categoryBadgeText, { color: config.textColor }]}>
              {config.title}
            </Text>
          </View>

          {/* Badge trạng thái Đạt / Chưa đạt */}
          <View
            style={[
              styles.statusBadge,
              isPassed ? styles.statusBadgePassed : styles.statusBadgeFailed,
            ]}
          >
            <Ionicons
              name={isPassed ? 'checkmark-circle' : 'close-circle'}
              size={13}
              color={isPassed ? '#16a34a' : '#dc2626'}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isPassed ? styles.statusBadgeTextPassed : styles.statusBadgeTextFailed,
              ]}
            >
              {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
            </Text>
          </View>
        </View>

        {/* Tiêu đề bài thi */}
        <Text style={styles.quizTitle} numberOfLines={2}>
          {item.quizTitle || `Đề thi #${item.quizId}`}
        </Text>

        {/* Thông tin nộp bài & thời gian làm */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>{formatDate(item.submittedAt || item.startedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>{durationText}</Text>
          </View>
        </View>

        {/* Footer: Kết quả chi tiết & Nút xem */}
        <View style={styles.cardFooter}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{scoreDisplay}</Text>
            <Text style={styles.scoreDetail}>
              ({item.correctAnswers ?? 0}/{item.totalQuestions ?? 0} câu đúng)
            </Text>
          </View>

          <View style={styles.reviewActionBtn}>
            <Text style={styles.reviewActionText}>Xem đáp án</Text>
            <Ionicons name="chevron-forward" size={14} color="#ea580c" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="document-text-outline" size={44} color="#ea580c" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có lịch sử làm bài</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'ALL'
          ? 'Bạn chưa hoàn thành bài thi nào. Hãy thử sức ngay với các đề thi chuẩn hóa để kiểm tra năng lực!'
          : `Không tìm thấy bài thi nào trong danh mục "${
              FILTER_OPTIONS.find((f) => f.key === selectedFilter)?.label
            }".`}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AssessmentCenter')}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={16} color="#ffffff" />
        <Text style={styles.emptyButtonText}>Bắt đầu làm bài thi ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header Điều hướng */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch Sử Khảo Thí</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#ea580c" />
        </TouchableOpacity>
      </View>

      {/* Nội dung danh sách */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loadingText}>Đang tải lịch sử bài thi...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAttempts}
          keyExtractor={(item, index) => item.publicId || String(item.id || index)}
          renderItem={renderAttemptItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#ea580c']}
              tintColor="#ea580c"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#ea580c" />
                <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryTitleGroup: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterListContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  attemptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgePassed: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeFailed: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeTextPassed: {
    color: '#16a34a',
  },
  statusBadgeTextFailed: {
    color: '#dc2626',
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ea580c',
  },
  scoreDetail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  reviewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  reviewActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    color: '#64748b',
  },
});
export default AssessmentHistoryScreen;
