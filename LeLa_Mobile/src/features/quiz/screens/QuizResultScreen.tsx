import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import {
  QuizAttemptDetailResponse,
  QuizQuestionResponse,
  QuizOptionResponse,
  QuizAnswerResponse,
  PlacementTestResult,
} from '../../../types';
import { useAuth } from '../../auth/context/AuthContext';
import assessmentService from '../services/assessmentService';

type QuizResultNavProp = NativeStackNavigationProp<RootStackParamList, 'QuizResult'>;
type QuizResultRouteProp = RouteProp<RootStackParamList, 'QuizResult'>;

type FilterTab = 'ALL' | 'INCORRECT' | 'CORRECT';

export const QuizResultScreen: React.FC = () => {
  const navigation = useNavigation<QuizResultNavProp>();
  const route = useRoute<QuizResultRouteProp>();
  const { attemptResult } = route.params;

  const { user, refreshProfile } = useAuth();
  const [placementResult, setPlacementResult] = useState<PlacementTestResult | null>(null);
  const [isProcessingPlacement, setIsProcessingPlacement] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  useEffect(() => {
    handleProcessAssessment();
  }, []);

  const handleProcessAssessment = async () => {
    const isPlacement =
      attemptResult.quizCategory === 'PLACEMENT' ||
      attemptResult.quizTitle?.toLowerCase().includes('placement') ||
      attemptResult.quizTitle?.toLowerCase().includes('xếp lớp');

    const isLevelUp =
      attemptResult.quizCategory === 'LEVEL_UP' ||
      attemptResult.quizCategory === 'FINAL' ||
      attemptResult.quizCategory === 'FINAL_LEVEL' ||
      attemptResult.levelUpPassed;

    if (isPlacement && attemptResult.publicId) {
      setIsProcessingPlacement(true);
      try {
        const res = await assessmentService.submitPlacementResult(attemptResult.publicId);
        setPlacementResult(res);
        if (refreshProfile) {
          await refreshProfile();
        }
      } catch (e) {
        console.warn('Lỗi tự động gán level placement:', e);
      } finally {
        setIsProcessingPlacement(false);
      }
    } else if (isLevelUp) {
      if (refreshProfile) {
        await refreshProfile();
      }
    }
  };

  const questions: QuizQuestionResponse[] = attemptResult.questions || [];
  const answers: QuizAnswerResponse[] = attemptResult.answers || [];

  // Tạo map tra cứu câu trả lời của user theo attemptQuestionId
  const answersMap = new Map<number, QuizAnswerResponse>();
  answers.forEach((ans) => {
    if (ans.attemptQuestionId) {
      answersMap.set(ans.attemptQuestionId, ans);
    }
  });

  const correctCount = attemptResult.correctAnswers ?? 0;
  const totalCount = attemptResult.totalQuestions || questions.length;
  const incorrectCount = Math.max(0, totalCount - correctCount);

  // Lọc câu hỏi theo Tab
  const filteredQuestions = questions.filter((q) => {
    const userAnswer = answersMap.get(q.id);
    const isAnswerCorrect = userAnswer?.isCorrect === true;

    if (activeTab === 'CORRECT') return isAnswerCorrect;
    if (activeTab === 'INCORRECT') return !isAnswerCorrect;
    return true;
  });

  // Chuyển hướng làm lại bài thi
  const handleRetakeQuiz = () => {
    navigation.replace('QuizExam', {
      quizId: attemptResult.quizId,
      quizTitle: attemptResult.quizTitle,
    });
  };

  // Quay về menu chính
  const handleBackToMenu = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={handleBackToMenu} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết Quả Khảo Thí</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 2. Thẻ Hero Tổng Kết Điểm Số */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.statusBadge,
              attemptResult.passed ? styles.statusBadgePassed : styles.statusBadgeFailed,
            ]}
          >
            <Ionicons
              name={attemptResult.passed ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={attemptResult.passed ? '#16a34a' : '#dc2626'}
            />
            <Text
              style={[
                styles.statusBadgeText,
                attemptResult.passed
                  ? styles.statusBadgeTextPassed
                  : styles.statusBadgeTextFailed,
              ]}
            >
              {attemptResult.passed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
            </Text>
          </View>

          <Text style={styles.quizTitle} numberOfLines={2}>
            {attemptResult.quizTitle || 'Bài kiểm tra năng lực TOEIC'}
          </Text>

          {/* Điểm phần trăm */}
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentText}>
              {Math.round(Number(attemptResult.scorePercent || 0))}%
            </Text>
            <Text style={styles.scoreFractionText}>
              {correctCount}/{totalCount} câu đúng
            </Text>
          </View>

          {/* Lưới chỉ số thống kê */}
          <View style={styles.statsGrid}>
            {/* Điểm TOEIC ước lượng */}
            {attemptResult.estimatedToeicScore !== undefined &&
            attemptResult.estimatedToeicScore !== null ? (
              <View style={styles.statBox}>
                <Ionicons name="ribbon-outline" size={22} color="#ea580c" />
                <Text style={styles.statValue}>
                  {Math.round(Number(attemptResult.estimatedToeicScore))}
                </Text>
                <Text style={styles.statLabel}>TOEIC Ước tính</Text>
              </View>
            ) : null}

            {/* Điểm kinh nghiệm XP */}
            <View style={styles.statBox}>
              <Ionicons name="sparkles" size={22} color="#eab308" />
              <Text style={styles.statValue}>+{attemptResult.xpAwarded ?? 0}</Text>
              <Text style={styles.statLabel}>Kinh nghiệm XP</Text>
            </View>

            {/* Thời gian làm */}
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={22} color="#0284c7" />
              <Text style={styles.statValue}>
                {Math.floor((attemptResult.timeSpentSeconds || 0) / 60)}m{' '}
                {(attemptResult.timeSpentSeconds || 0) % 60}s
              </Text>
              <Text style={styles.statLabel}>Thời gian</Text>
            </View>
          </View>

          {/* Thông báo thăng cấp nếu có */}
          {attemptResult.levelUpMessage ? (
            <View style={styles.levelUpCard}>
              <Ionicons name="trending-up" size={20} color="#16a34a" />
              <Text style={styles.levelUpText}>{attemptResult.levelUpMessage}</Text>
            </View>
          ) : null}

          {/* Banner kết quả phân cấp đầu vào (Placement Test) */}
          {isProcessingPlacement ? (
            <View style={styles.placementLoadingCard}>
              <ActivityIndicator size="small" color="#ea580c" />
              <Text style={styles.placementLoadingText}>
                Đang phân tích kết quả và gán trình độ học viên...
              </Text>
            </View>
          ) : placementResult ? (
            <View style={styles.placementSuccessCard}>
              <View style={styles.placementSuccessHeader}>
                <View style={styles.placementIconBox}>
                  <Ionicons name="school" size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.placementSuccessBadge}>TRÌNH ĐỘ ĐƯỢC THIẾT LẬP</Text>
                  <Text style={styles.placementSuccessTitle}>
                    {placementResult.assignedLevel?.name || 'Trình độ Tiêu chuẩn'}
                  </Text>
                </View>
              </View>
              {placementResult.assignedLevel?.description ? (
                <Text style={styles.placementDescText}>
                  {placementResult.assignedLevel.description}
                </Text>
              ) : null}
              <View style={styles.placementFooterRow}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.placementFooterText}>
                  Đã tự động cập nhật vào Hồ sơ học tập của bạn!
                </Text>
              </View>
            </View>
          ) : null}

          {/* Lối tắt mở màn hình Xem Lại Chi Tiết Bài Thi (Exam Review) */}
          {attemptResult.publicId ? (
            <TouchableOpacity
              style={styles.reviewBannerBtn}
              onPress={() =>
                navigation.navigate('AssessmentReviewDetail', {
                  publicId: attemptResult.publicId,
                  quizTitle: attemptResult.quizTitle,
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.reviewBannerIcon}>
                <Ionicons name="eye" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.reviewBannerTitle}>Bảng Tra Cứu & Đáp Án Chuẩn</Text>
                <Text style={styles.reviewBannerSub}>
                  Xem chi tiết giải thích ngữ pháp, từ vựng và bảng palette câu hỏi
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ea580c" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 3. Bộ lọc Xem lại bài thi */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeading}>Xem lại chi tiết bài làm</Text>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
              onPress={() => setActiveTab('ALL')}
            >
              <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
                Tất cả ({questions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'INCORRECT' && styles.tabItemActive]}
              onPress={() => setActiveTab('INCORRECT')}
            >
              <Text style={[styles.tabText, activeTab === 'INCORRECT' && styles.tabTextActive]}>
                Chưa đúng ({incorrectCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'CORRECT' && styles.tabItemActive]}
              onPress={() => setActiveTab('CORRECT')}
            >
              <Text style={[styles.tabText, activeTab === 'CORRECT' && styles.tabTextActive]}>
                Câu đúng ({correctCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Danh sách câu hỏi và giải thích đáp án */}
        <View style={styles.questionsReviewList}>
          {filteredQuestions.length === 0 ? (
            <View style={styles.emptyFilteredBox}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyFilteredText}>Không có câu hỏi nào trong mục này</Text>
            </View>
          ) : (
            filteredQuestions.map((q, index) => {
              const userAnswer = answersMap.get(q.id);
              const isCorrect = userAnswer?.isCorrect === true;
              const selectedOptionId = userAnswer?.selectedAttemptOptionId;

              return (
                <View key={q.id} style={styles.reviewCard}>
                  {/* Tiêu đề câu hỏi & trạng thái đúng/sai */}
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.questionIndexBadge}>
                      <Text style={styles.questionIndexText}>Câu {q.displayOrder || index + 1}</Text>
                    </View>

                    <View
                      style={[
                        styles.resultBadge,
                        isCorrect ? styles.resultBadgeCorrect : styles.resultBadgeIncorrect,
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? 'checkmark' : 'close'}
                        size={14}
                        color={isCorrect ? '#16a34a' : '#dc2626'}
                      />
                      <Text
                        style={[
                          styles.resultBadgeText,
                          isCorrect
                            ? styles.resultBadgeTextCorrect
                            : styles.resultBadgeTextIncorrect,
                        ]}
                      >
                        {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reviewQuestionText}>{q.questionText}</Text>

                  {/* Danh sách các lựa chọn */}
                  <View style={styles.reviewOptionsList}>
                    {q.options?.map((opt: QuizOptionResponse, optIdx: number) => {
                      const isUserSelected = selectedOptionId === opt.id;
                      const isOptionCorrect = opt.isCorrect === true;
                      const optLabel = opt.optionKey || String.fromCharCode(65 + optIdx);

                      let optionCardStyle = styles.reviewOption;
                      let labelBg = '#f1f5f9';
                      let labelColor = '#475569';

                      if (isOptionCorrect) {
                        // Đáp án đúng luôn được highlight xanh
                        optionCardStyle = { ...styles.reviewOption, ...styles.reviewOptionCorrect };
                        labelBg = '#22c55e';
                        labelColor = '#ffffff';
                      } else if (isUserSelected && !isOptionCorrect) {
                        // Người dùng chọn sai highlight đỏ
                        optionCardStyle = { ...styles.reviewOption, ...styles.reviewOptionWrong };
                        labelBg = '#ef4444';
                        labelColor = '#ffffff';
                      }

                      return (
                        <View key={opt.id} style={optionCardStyle}>
                          <View style={[styles.reviewOptionLabel, { backgroundColor: labelBg }]}>
                            <Text style={[styles.reviewOptionLabelText, { color: labelColor }]}>
                              {optLabel}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.reviewOptionText,
                              isOptionCorrect && styles.reviewOptionTextCorrect,
                              isUserSelected && !isOptionCorrect && styles.reviewOptionTextWrong,
                            ]}
                          >
                            {opt.optionText}
                          </Text>

                          {isOptionCorrect && (
                            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                          )}
                          {isUserSelected && !isOptionCorrect && (
                            <Ionicons name="close-circle" size={20} color="#dc2626" />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Lời giải thích chi tiết */}
                  {q.explanation ? (
                    <View style={styles.explanationBox}>
                      <View style={styles.explanationHeader}>
                        <Ionicons name="bulb-outline" size={16} color="#d97706" />
                        <Text style={styles.explanationTitle}>Giải thích chi tiết</Text>
                      </View>
                      <Text style={styles.explanationContent}>{q.explanation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {/* 5. Nút điều hướng hành động cuối trang */}
        <View style={styles.actionButtonsContainer}>
          {attemptResult.publicId ? (
            <TouchableOpacity
              style={styles.reviewDetailActionBtn}
              onPress={() =>
                navigation.navigate('AssessmentReviewDetail', {
                  publicId: attemptResult.publicId,
                  quizTitle: attemptResult.quizTitle,
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="document-text" size={18} color="#ea580c" />
              <Text style={styles.reviewDetailActionText}>Xem bảng câu hỏi chi tiết & giải thích</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={handleRetakeQuiz}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#ffffff" />
            <Text style={styles.retakeBtnText}>Làm lại đề thi này</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={handleBackToMenu}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color="#ea580c" />
            <Text style={styles.homeBtnText}>Về màn hình chính</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusBadgePassed: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeFailed: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  statusBadgeTextPassed: {
    color: '#16a34a',
  },
  statusBadgeTextFailed: {
    color: '#dc2626',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fff7ed',
    borderWidth: 6,
    borderColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scorePercentText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ea580c',
  },
  scoreFractionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  levelUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  levelUpText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  placementLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  placementLoadingText: {
    fontSize: 13,
    color: '#ea580c',
    fontWeight: '600',
    marginLeft: 8,
  },
  placementSuccessCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#fdba74',
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
  },
  placementSuccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  placementIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placementSuccessBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#c2410c',
    letterSpacing: 0.5,
  },
  placementSuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  placementDescText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  placementFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fed7aa',
  },
  placementFooterText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    marginLeft: 6,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ea580c',
    fontWeight: '700',
  },
  questionsReviewList: {
    gap: 16,
  },
  emptyFilteredBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  emptyFilteredText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionIndexBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionIndexText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  resultBadgeCorrect: {
    backgroundColor: '#dcfce7',
  },
  resultBadgeIncorrect: {
    backgroundColor: '#fee2e2',
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  resultBadgeTextCorrect: {
    color: '#16a34a',
  },
  resultBadgeTextIncorrect: {
    color: '#dc2626',
  },
  reviewQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 14,
  },
  reviewOptionsList: {
    gap: 8,
  },
  reviewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewOptionCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  reviewOptionWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  reviewOptionLabel: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewOptionLabelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  reviewOptionTextCorrect: {
    color: '#15803d',
    fontWeight: '700',
  },
  reviewOptionTextWrong: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  explanationBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    marginLeft: 6,
  },
  explanationContent: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 19,
  },
  actionButtonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  reviewBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
  },
  reviewBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewBannerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  reviewDetailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  reviewDetailActionText: {
    color: '#ea580c',
    fontSize: 15,
    fontWeight: '800',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
  },
  homeBtnText: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

