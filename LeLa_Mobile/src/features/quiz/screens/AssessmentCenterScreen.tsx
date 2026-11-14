import React, { useState, useEffect, useCallback } from 'react';
import { VocabularyQuizLauncher } from '../components/TimedVocabularyQuiz';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { useAuth } from '../../auth/context/AuthContext';
import assessmentService, {
  AssessmentOverviewData,
} from '../services/assessmentService';
import { QuizResponse } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AssessmentTab = 'PLACEMENT' | 'LEVEL_UP' | 'FINAL' | 'PRACTICE';

export const AssessmentCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<AssessmentTab>('PLACEMENT');
  const [overview, setOverview] = useState<AssessmentOverviewData | null>(null);

  const [placementTests, setPlacementTests] = useState<QuizResponse[]>([]);
  const [levelUpTests, setLevelUpTests] = useState<QuizResponse[]>([]);
  const [finalTests, setFinalTests] = useState<QuizResponse[]>([]);
  const [practiceQuizzes, setPracticeQuizzes] = useState<QuizResponse[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadAllData = async () => {
    try {
      const [overviewData, placements, levelUps, finals, practices] = await Promise.all([
        assessmentService.getAssessmentOverview(),
        assessmentService.getPlacementTests(),
        assessmentService.getLevelUpTests(),
        assessmentService.getFinalAssessments(),
        assessmentService.getPracticeQuizzes(),
      ]);

      setOverview(overviewData);
      setPlacementTests(placements);
      setLevelUpTests(levelUps);
      setFinalTests(finals.quizzes);
      setPracticeQuizzes(practices);

      // Nếu học viên đã có level thì ưu tiên hiển thị tab Nâng Cấp hoặc Đánh Giá Đầu Ra
      if (overviewData.isLevelAssigned && activeTab === 'PLACEMENT') {
        if (overviewData.isEligibleForFinal) {
          setActiveTab('FINAL');
        } else {
          setActiveTab('LEVEL_UP');
        }
      }
    } catch (error) {
      console.error('[AssessmentCenterScreen] Lỗi tải dữ liệu khảo thí:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData();
      if (refreshProfile) {
        refreshProfile();
      }
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  const handleStartExam = (quiz: QuizResponse) => {
    navigation.navigate('QuizExam', {
      quizId: quiz.id,
      quizTitle: quiz.title,
    });
  };

  const currentLevelTitle =
    user?.currentLevel?.name ||
    user?.currentLevel?.code ||
    (overview?.isLevelAssigned ? overview.currentLevelName : 'Chưa phân cấp');

  const isUnassigned =
    !user?.currentLevel ||
    currentLevelTitle === 'Chưa phân cấp' ||
    currentLevelTitle === 'UNASSIGNED';

  // Lấy danh sách quiz tương ứng với tab đang chọn
  const getCurrentTabQuizzes = (): QuizResponse[] => {
    switch (activeTab) {
      case 'PLACEMENT':
        return placementTests;
      case 'LEVEL_UP':
        return levelUpTests;
      case 'FINAL':
        return finalTests;
      case 'PRACTICE':
        return practiceQuizzes;
      default:
        return [];
    }
  };

  const renderHeroBanner = () => {
    if (isUnassigned) {
      return (
        <View style={styles.heroAlertCard}>
          <View style={styles.alertHeaderRow}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="alert-circle" size={26} color="#D97706" />
            </View>
            <View style={styles.alertTitleGroup}>
              <Text style={styles.alertTitle}>Bạn chưa phân cấp trình độ</Text>
              <Text style={styles.alertSubtitle}>Trình độ hiện tại: Chưa xác định</Text>
            </View>
          </View>
          <Text style={styles.alertDesc}>
            Hãy thực hiện ngay bài kiểm tra xếp lớp (Placement Test) để hệ thống tự động thiết lập lộ trình học từ vựng và bài tập phù hợp nhất cho bạn.
          </Text>
          <TouchableOpacity
            style={styles.alertCtaButton}
            onPress={() => {
              setActiveTab('PLACEMENT');
              if (placementTests.length > 0) {
                handleStartExam(placementTests[0]);
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.alertCtaText}>Làm Bài Thi Xếp Lớp Ngay (20 Phút)</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    const completed = overview?.completedDecks || 0;
    const total = overview?.totalDecks || 4;
    const progressPercent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    return (
      <View style={styles.heroStatusCard}>
        <View style={styles.heroStatusHeader}>
          <View style={styles.levelBadgeCircle}>
            <Ionicons name="ribbon" size={26} color="#EA580C" />
          </View>
          <View style={styles.levelInfoGroup}>
            <Text style={styles.levelLabel}>TRÌNH ĐỘ ĐANG HỌC</Text>
            <Text style={styles.levelName}>{currentLevelTitle}</Text>
            <Text style={styles.levelExam}>Thang điểm mục tiêu: TOEIC (Tối đa 990)</Text>
          </View>
          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text style={styles.verifiedText}>Đã phân cấp</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Thanh tiến độ mở khóa bài thi Level-Up / Final */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressTitle}>Tiến độ mở khóa bài thi tốt nghiệp Level</Text>
            <Text style={styles.progressPercentText}>{completed}/{total} bộ thẻ ({progressPercent}%)</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {overview?.isEligibleForFinal ? (
            <View style={styles.eligibleRow}>
              <Ionicons name="sparkles" size={14} color="#16A34A" />
              <Text style={styles.eligibleText}>
                Bạn đã đủ điều kiện! Có thể làm Bài thi Đánh giá Đầu ra để thăng hạng ngay.
              </Text>
            </View>
          ) : (
            <View style={styles.lockRow}>
              <Ionicons name="lock-closed" size={14} color="#D97706" />
              <Text style={styles.lockText}>
                {overview?.lockMessage || `Hoàn thành ${Math.max(1, total - completed)} bộ thẻ nữa để mở khóa thi.`}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTabSwitcher = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'PLACEMENT' && styles.tabChipActive]}
          onPress={() => setActiveTab('PLACEMENT')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="compass-outline"
            size={16}
            color={activeTab === 'PLACEMENT' ? '#EA580C' : '#64748B'}
          />
          <Text style={[styles.tabChipText, activeTab === 'PLACEMENT' && styles.tabChipTextActive]}>
            Thi Xếp Lớp ({placementTests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'LEVEL_UP' && styles.tabChipActive]}
          onPress={() => setActiveTab('LEVEL_UP')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trending-up-outline"
            size={16}
            color={activeTab === 'LEVEL_UP' ? '#EA580C' : '#64748B'}
          />
          <Text style={[styles.tabChipText, activeTab === 'LEVEL_UP' && styles.tabChipTextActive]}>
            Nâng Cấp ({levelUpTests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'FINAL' && styles.tabChipActive]}
          onPress={() => setActiveTab('FINAL')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trophy-outline"
            size={16}
            color={activeTab === 'FINAL' ? '#EA580C' : '#64748B'}
          />
          <Text style={[styles.tabChipText, activeTab === 'FINAL' && styles.tabChipTextActive]}>
            Đầu Ra / Final ({finalTests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'PRACTICE' && styles.tabChipActive]}
          onPress={() => setActiveTab('PRACTICE')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={activeTab === 'PRACTICE' ? '#EA580C' : '#64748B'}
          />
          <Text style={[styles.tabChipText, activeTab === 'PRACTICE' && styles.tabChipTextActive]}>
            Luyện Tập ({practiceQuizzes.length})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderAssessmentItem = ({ item }: { item: QuizResponse }) => {
    const timeMin = item.timeLimitSeconds ? Math.floor(item.timeLimitSeconds / 60) : 20;
    const questionsCount = item.totalQuestions || 30;

    let tagColor = '#0284C7';
    let tagBg = '#E0F2FE';
    let tagText = 'Xếp Lớp';

    if (item.quizCategory === 'LEVEL_UP') {
      tagColor = '#D97706';
      tagBg = '#FEF3C7';
      tagText = 'Thăng Cấp';
    } else if (item.quizCategory === 'FINAL' || item.quizCategory === 'FINAL_LEVEL') {
      tagColor = '#7C3AED';
      tagBg = '#EDE9FE';
      tagText = 'Tốt Nghiệp';
    } else if (item.quizCategory === 'NORMAL') {
      tagColor = '#16A34A';
      tagBg = '#DCFCE7';
      tagText = 'Luyện Tập';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryPill, { backgroundColor: tagBg }]}>
            <Text style={[styles.categoryPillText, { color: tagColor }]}>{tagText}</Text>
          </View>
          {item.difficulty && (
            <View style={styles.difficultyPill}>
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'Đánh giá năng lực ngoại ngữ theo chuẩn định dạng khảo thí TOEIC.'}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={15} color="#64748B" />
            <Text style={styles.metaText}>{timeMin} phút</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="help-circle-outline" size={15} color="#64748B" />
            <Text style={styles.metaText}>{questionsCount} câu hỏi</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="ribbon-outline" size={15} color="#64748B" />
            <Text style={styles.metaText}>Max 990 đ</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => handleStartExam(item)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.startBtnText}>Bắt Đầu Làm Bài</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyList = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
        <Text style={styles.emptyTitle}>Chưa có đề thi trong mục này</Text>
        <Text style={styles.emptyDesc}>
          {activeTab === 'FINAL'
            ? 'Hãy hoàn thành thêm các bộ thẻ Flashcard thuộc lộ trình để mở khóa bài thi đầu ra nhé!'
            : 'Các đề thi sẽ được ban chuyên môn cập nhật theo từng tuần học.'}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Đang tải trung tâm khảo thí...</Text>
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
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Trung Tâm Khảo Thí & Đánh Giá</Text>
          <Text style={styles.headerSubtitle}>Kiểm tra đầu vào, thăng cấp & ước lượng TOEIC</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('AssessmentHistory')}
          activeOpacity={0.8}
        >
          <Ionicons name="time" size={16} color="#EA580C" />
          <Text style={styles.historyButtonText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCurrentTabQuizzes()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAssessmentItem}
        ListHeaderComponent={
          <>
            <VocabularyQuizLauncher onFinished={attemptResult => navigation.navigate('QuizResult', { attemptResult })} />
            {renderHeroBanner()}
            {renderTabSwitcher()}
          </>
        }
        ListEmptyComponent={renderEmptyList}
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#FED7AA',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroAlertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    elevation: 2,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTitleGroup: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  alertDesc: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 14,
  },
  alertCtaButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alertCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  heroStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadgeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelInfoGroup: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  levelExam: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  progressSection: {
    marginTop: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 4,
  },
  eligibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eligibleText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    flex: 1,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lockText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
    flex: 1,
  },
  tabContainer: {
    marginBottom: 16,
  },
  tabScroll: {
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  difficultyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AssessmentCenterScreen;

