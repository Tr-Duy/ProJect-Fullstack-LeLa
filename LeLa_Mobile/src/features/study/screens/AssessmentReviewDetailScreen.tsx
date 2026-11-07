import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import {
  QuizAttemptDetailResponse,
  QuizQuestionResponse,
  QuizAnswerResponse,
} from '../../../types';
import { quizService } from '../services/quizService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, 'AssessmentReviewDetail'>;

const { width } = Dimensions.get('window');

export const AssessmentReviewDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { publicId, attemptId } = route.params || {};

  const flatListRef = useRef<FlatList>(null);
  const paletteScrollRef = useRef<any>(null);

  const [detail, setDetail] = useState<QuizAttemptDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showFullPalette, setShowFullPalette] = useState<boolean>(false);

  useEffect(() => {
    loadAttemptDetail();
  }, [publicId, attemptId]);

  const loadAttemptDetail = async () => {
    const targetId = publicId || attemptId;
    if (!targetId) {
      setErrorMsg('Không tìm thấy mã lượt thi để xem lại.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await quizService.getQuizAttemptDetail(targetId);
      setDetail(data);
    } catch (err: any) {
      console.error('[AssessmentReviewDetailScreen] Lỗi khi tải chi tiết bài thi:', err);
      setErrorMsg(err?.response?.data?.message || 'Không thể tải dữ liệu chi tiết bài thi.');
    } finally {
      setIsLoading(false);
    }
  };

  const questions: QuizQuestionResponse[] = detail?.questions || [];
  const answers: QuizAnswerResponse[] = detail?.answers || [];

  // Tạo Map tra cứu câu trả lời của thí sinh
  const answersMap = useMemo(() => {
    const map = new Map<number, QuizAnswerResponse>();
    answers.forEach((ans) => {
      if (ans.attemptQuestionId) {
        map.set(ans.attemptQuestionId, ans);
      }
    });
    return map;
  }, [answers]);

  // Thống kê số câu
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    questions.forEach((q) => {
      const ans = answersMap.get(q.id);
      if (!ans || (ans.selectedAttemptOptionId == null && !ans.answerText)) {
        skipped += 1;
      } else if (ans.isCorrect === true) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    });

    return {
      correct,
      incorrect,
      skipped,
      total: questions.length,
    };
  }, [questions, answersMap]);

  // Cuộn đến câu hỏi được chỉ định từ Palette
  const handleScrollToQuestion = (index: number) => {
    setCurrentIndex(index);
    if (flatListRef.current && index < questions.length) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  // Làm lại bài thi
  const handleRetake = () => {
    if (detail?.quizId) {
      navigation.replace('QuizExam', {
        quizId: detail.quizId,
        quizTitle: detail.quizTitle,
      });
    }
  };

  // Render từng câu hỏi chi tiết
  const renderQuestionItem = ({ item: question, index }: { item: QuizQuestionResponse; index: number }) => {
    const questionNumber = index + 1;
    const formattedNum = questionNumber < 10 ? `0${questionNumber}` : `${questionNumber}`;
    const userAnswer = answersMap.get(question.id);

    const isAnswered =
      userAnswer && (userAnswer.selectedAttemptOptionId != null || !!userAnswer.answerText);
    const isCorrect = userAnswer?.isCorrect === true;

    // Chuẩn hóa định dạng đề bài (thay ... bằng _____)
    const formattedText = (question.questionText || '').replace(/\.{3,}/g, '_____');

    // Xác định text câu trả lời của user và đáp án chuẩn
    let userText = '(Chưa trả lời)';
    let correctText = '';

    const selectedOption = question.options?.find(
      (o) => o.id === userAnswer?.selectedAttemptOptionId
    );
    if (selectedOption) {
      userText = selectedOption.optionText;
    } else if (userAnswer?.answerText) {
      userText = userAnswer.answerText;
    }

    const correctOption = question.options?.find((o) => o.isCorrect === true);
    if (correctOption) {
      correctText = correctOption.optionText;
    }

    return (
      <View style={styles.questionCard}>
        {/* Header câu hỏi */}
        <View style={styles.questionCardHeader}>
          <View style={styles.questionNumberBadge}>
            <Text style={styles.questionNumberText}>CÂU {formattedNum}</Text>
          </View>

          {/* Trạng thái đúng/sai */}
          {isCorrect ? (
            <View style={[styles.resultBadge, styles.resultBadgeCorrect]}>
              <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
              <Text style={styles.resultTextCorrect}>ĐÚNG</Text>
            </View>
          ) : isAnswered ? (
            <View style={[styles.resultBadge, styles.resultBadgeIncorrect]}>
              <Ionicons name="close-circle" size={15} color="#dc2626" />
              <Text style={styles.resultTextIncorrect}>SAI</Text>
            </View>
          ) : (
            <View style={[styles.resultBadge, styles.resultBadgeSkipped]}>
              <Ionicons name="help-circle" size={15} color="#64748b" />
              <Text style={styles.resultTextSkipped}>BỎ QUA</Text>
            </View>
          )}
        </View>

        {/* Nội dung câu hỏi */}
        <Text style={styles.questionText}>{formattedText}</Text>

        {/* Ảnh câu hỏi nếu có */}
        {question.questionImageUrl ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: question.questionImageUrl }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {/* Khung tóm tắt nhanh nếu làm sai hoặc bỏ qua */}
        {!isCorrect && (
          <View style={styles.quickSummaryBox}>
            <View style={styles.quickSummaryRow}>
              <View style={styles.quickSummaryItemWrong}>
                <View style={styles.summaryLabelRow}>
                  <Text style={styles.summaryLabelWrong}>Câu trả lời của bạn</Text>
                  <Ionicons name="close" size={14} color="#dc2626" />
                </View>
                <Text style={styles.summaryValueWrong} numberOfLines={2}>
                  {userText}
                </Text>
              </View>

              <View style={styles.quickSummaryItemCorrect}>
                <View style={styles.summaryLabelRow}>
                  <Text style={styles.summaryLabelCorrect}>Đáp án đúng</Text>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                </View>
                <Text style={styles.summaryValueCorrect} numberOfLines={2}>
                  {correctText || 'Xem các đáp án bên dưới'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Danh sách 4 đáp án lựa chọn */}
        <View style={styles.optionsList}>
          {question.options?.map((option, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isUserSelected = userAnswer?.selectedAttemptOptionId === option.id;
            const isOptionCorrect = option.isCorrect === true;

            // Xác định giao diện cho option
            let optionContainerStyle = styles.optionItemDefault;
            let optionBadgeStyle = styles.optionLetterCircleDefault;
            let optionLetterTextStyle = styles.optionLetterTextDefault;

            if (isOptionCorrect) {
              optionContainerStyle = styles.optionItemCorrect;
              optionBadgeStyle = styles.optionLetterCircleCorrect;
              optionLetterTextStyle = styles.optionLetterTextActive;
            } else if (isUserSelected && !isOptionCorrect) {
              optionContainerStyle = styles.optionItemIncorrect;
              optionBadgeStyle = styles.optionLetterCircleIncorrect;
              optionLetterTextStyle = styles.optionLetterTextActive;
            }

            return (
              <View key={option.id || optIdx} style={[styles.optionItem, optionContainerStyle]}>
                <View style={[styles.optionLetterCircle, optionBadgeStyle]}>
                  {isOptionCorrect ? (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  ) : isUserSelected ? (
                    <Ionicons name="close" size={16} color="#ffffff" />
                  ) : (
                    <Text style={optionLetterTextStyle}>{letter}</Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isOptionCorrect && styles.optionTextCorrect,
                    isUserSelected && !isOptionCorrect && styles.optionTextIncorrect,
                  ]}
                >
                  {option.optionText}
                </Text>

                {/* Badge trạng thái đáp án */}
                {isOptionCorrect ? (
                  <View style={styles.optionTagCorrect}>
                    <Text style={styles.optionTagCorrectText}>Đáp án đúng</Text>
                  </View>
                ) : isUserSelected ? (
                  <View style={styles.optionTagIncorrect}>
                    <Text style={styles.optionTagIncorrectText}>Bạn chọn</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Khung giải thích đáp án chi tiết (Explanation) */}
        {question.explanation && question.explanation.trim() !== '' ? (
          <View style={styles.explanationBox}>
            <View style={styles.explanationHeader}>
              <Ionicons name="bulb" size={18} color="#d97706" />
              <Text style={styles.explanationTitle}>GIẢI THÍCH CHI TIẾT</Text>
            </View>
            <Text style={styles.explanationContent}>{question.explanation}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loadingText}>Đang tải chi tiết bài làm & giải thích...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Bài Thi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={54} color="#dc2626" />
          <Text style={styles.errorTitle}>Không thể tải bài làm</Text>
          <Text style={styles.errorSubtitle}>{errorMsg || 'Dữ liệu không tồn tại'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadAttemptDetail}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasToeicScore =
    detail.estimatedToeicScore !== undefined && detail.estimatedToeicScore !== null;
  const scoreDisplay = hasToeicScore
    ? `${Math.round(Number(detail.estimatedToeicScore))} TOEIC`
    : `${Math.round(Number(detail.scorePercent || 0))}%`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header Điều Hướng */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Xem Lại Bài Thi</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {detail.quizTitle || 'Bài kiểm tra năng lực'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => setShowFullPalette(!showFullPalette)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showFullPalette ? 'chevron-up' : 'grid-outline'}
            size={18}
            color="#ea580c"
          />
        </TouchableOpacity>
      </View>

      {/* Thẻ Thống Kê Tổng Kết Lượt Thi */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryScoreGroup}>
          <Text style={styles.summaryScoreText}>{scoreDisplay}</Text>
          <Text style={styles.summaryScoreLabel}>
            {detail.passed ? 'ĐẠT YÊU CẦU' : 'CHƯA ĐẠT'}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryMiniStats}>
          <View style={styles.miniStatItem}>
            <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
            <Text style={[styles.miniStatValue, { color: '#16a34a' }]}>
              {stats.correct} Đúng
            </Text>
          </View>
          <View style={styles.miniStatItem}>
            <Ionicons name="close-circle" size={14} color="#dc2626" />
            <Text style={[styles.miniStatValue, { color: '#dc2626' }]}>
              {stats.incorrect} Sai
            </Text>
          </View>
          <View style={styles.miniStatItem}>
            <Ionicons name="help-circle" size={14} color="#64748b" />
            <Text style={styles.miniStatValue}>{stats.skipped} Bỏ qua</Text>
          </View>
        </View>
      </View>

      {/* Thanh Điều Hướng Câu Hỏi (Question Palette Grid / Scroll) */}
      <View style={styles.paletteContainer}>
        {showFullPalette ? (
          <View style={styles.fullGridContainer}>
            <View style={styles.fullGridHeader}>
              <Text style={styles.fullGridTitle}>Danh sách {questions.length} câu hỏi:</Text>
              <TouchableOpacity onPress={() => setShowFullPalette(false)}>
                <Text style={styles.fullGridCloseText}>Thu gọn</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fullGridWrap}>
              {questions.map((q, idx) => {
                const ans = answersMap.get(q.id);
                const isAns = ans && (ans.selectedAttemptOptionId != null || !!ans.answerText);
                const isCor = ans?.isCorrect === true;

                let chipStyle = styles.paletteChipDefault;
                let textStyle = styles.paletteTextDefault;

                if (isCor) {
                  chipStyle = styles.paletteChipCorrect;
                  textStyle = styles.paletteTextCorrect;
                } else if (isAns) {
                  chipStyle = styles.paletteChipIncorrect;
                  textStyle = styles.paletteTextIncorrect;
                }

                return (
                  <TouchableOpacity
                    key={q.id || idx}
                    style={[styles.paletteGridChip, chipStyle, currentIndex === idx && styles.paletteChipActive]}
                    onPress={() => {
                      handleScrollToQuestion(idx);
                      setShowFullPalette(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paletteGridChipText, textStyle]}>{idx + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <ScrollView
            ref={paletteScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteScrollContent}
          >
            {questions.map((q, idx) => {
              const ans = answersMap.get(q.id);
              const isAns = ans && (ans.selectedAttemptOptionId != null || !!ans.answerText);
              const isCor = ans?.isCorrect === true;

              let chipStyle = styles.paletteChipDefault;
              let textStyle = styles.paletteTextDefault;

              if (isCor) {
                chipStyle = styles.paletteChipCorrect;
                textStyle = styles.paletteTextCorrect;
              } else if (isAns) {
                chipStyle = styles.paletteChipIncorrect;
                textStyle = styles.paletteTextIncorrect;
              }

              return (
                <TouchableOpacity
                  key={q.id || idx}
                  style={[
                    styles.paletteChip,
                    chipStyle,
                    currentIndex === idx && styles.paletteChipActive,
                  ]}
                  onPress={() => handleScrollToQuestion(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.paletteChipText, textStyle]}>{idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Danh Sách Chi Tiết Từng Câu Hỏi */}
      <FlatList
        ref={flatListRef}
        data={questions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderQuestionItem}
        contentContainerStyle={styles.questionsListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={11}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
      />

      {/* Bottom Bar: Nút làm lại bài thi */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={handleRetake}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.retakeBtnText}>Làm lại đề thi này</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
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
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryScoreGroup: {
    alignItems: 'flex-start',
  },
  summaryScoreText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ea580c',
  },
  summaryScoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  summaryMiniStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  paletteContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paletteScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  paletteChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  paletteChipDefault: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  paletteChipCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  paletteChipIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  paletteChipActive: {
    borderWidth: 2.5,
    borderColor: '#ea580c',
  },
  paletteChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  paletteTextDefault: {
    color: '#64748b',
  },
  paletteTextCorrect: {
    color: '#15803d',
  },
  paletteTextIncorrect: {
    color: '#b91c1c',
  },
  fullGridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fullGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fullGridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  fullGridCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  fullGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteGridChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  paletteGridChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  questionsListContent: {
    padding: 16,
    paddingBottom: 80,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  questionNumberBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  resultBadgeCorrect: {
    backgroundColor: '#dcfce7',
  },
  resultBadgeIncorrect: {
    backgroundColor: '#fee2e2',
  },
  resultBadgeSkipped: {
    backgroundColor: '#f1f5f9',
  },
  resultTextCorrect: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
  },
  resultTextIncorrect: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  resultTextSkipped: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  questionImage: {
    width: '100%',
    height: 200,
  },
  quickSummaryBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  quickSummaryRow: {
    gap: 8,
  },
  quickSummaryItemWrong: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  quickSummaryItemCorrect: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  summaryLabelWrong: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  summaryLabelCorrect: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  summaryValueWrong: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryValueCorrect: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  optionsList: {
    gap: 8,
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionItemDefault: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  optionItemCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  optionItemIncorrect: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  optionLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionLetterCircleDefault: {
    backgroundColor: '#e2e8f0',
  },
  optionLetterCircleCorrect: {
    backgroundColor: '#16a34a',
  },
  optionLetterCircleIncorrect: {
    backgroundColor: '#dc2626',
  },
  optionLetterTextDefault: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  optionLetterTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: '#15803d',
    fontWeight: '700',
  },
  optionTextIncorrect: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  optionTagCorrect: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  optionTagCorrectText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  optionTagIncorrect: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  optionTagIncorrectText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  explanationBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  explanationContent: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    height: 48,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
export default AssessmentReviewDetailScreen;
