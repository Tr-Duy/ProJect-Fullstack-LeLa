import { TimedVocabularyQuiz } from '../components/TimedVocabularyQuiz';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { quizService } from '../services/quizService';
import {
  QuizAttemptDetailResponse,
  QuizQuestionResponse,
  QuizOptionResponse,
} from '../../../types';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type QuizExamNavProp = NativeStackNavigationProp<RootStackParamList, 'QuizExam'>;
type QuizExamRouteProp = RouteProp<RootStackParamList, 'QuizExam'>;

const { width } = Dimensions.get('window');

export const QuizExamScreen: React.FC = () => {
  const navigation = useNavigation<QuizExamNavProp>();
  const route = useRoute<QuizExamRouteProp>();
  const { quizId: paramQuizId, quizTitle: paramQuizTitle } = route.params || {};

  // State quản lý bài thi
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attempt, setAttempt] = useState<QuizAttemptDetailResponse | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Lưu trữ câu trả lời: { [attemptQuestionId]: selectedAttemptOptionId }
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  // State đồng hồ đếm ngược (tính theo giây)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900); // Mặc định 15 phút
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State modal bảng danh sách câu hỏi
  const [isPaletteVisible, setIsPaletteVisible] = useState<boolean>(false);

  // State phát âm thanh câu hỏi qua expo-speech
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // 1. Khởi tạo bài thi khi vào màn hình
  useEffect(() => {
    let isMounted = true;

    const initializeExam = async () => {
      try {
        setLoading(true);
        let targetQuizId = paramQuizId;

        // Nếu không truyền quizId, tự động tìm bài quiz đầu tiên có sẵn
        if (!targetQuizId) {
          const list = await quizService.getQuizzes({ size: 1 });
          if (!list || list.length === 0) {
            Alert.alert('Thông báo', 'Hiện chưa có bài thi nào sẵn sàng trong hệ thống.', [
              { text: 'Quay lại', onPress: () => navigation.goBack() },
            ]);
            return;
          }
          targetQuizId = list[0].id;
        }

        // Bắt đầu lượt thi và nhận snapshot câu hỏi
        const attemptData = await quizService.startAttempt(targetQuizId);
        if (!isMounted) return;

        setAttempt(attemptData);
        const questionList = attemptData.questions || [];
        setQuestions(attemptData.timedScreen ? [...questionList].sort((a, b) => Number(['MULTIPLE_CHOICE_MEANING', 'MATCHING_PAIRS'].includes(a.questionType || '')) - Number(['MULTIPLE_CHOICE_MEANING', 'MATCHING_PAIRS'].includes(b.questionType || ''))) : questionList);

        // Thiết lập thời gian làm bài
        const limit = attemptData.timeSpentSeconds
          ? Math.max(60, 900 - attemptData.timeSpentSeconds)
          : 900;
        setRemainingSeconds(limit);
      } catch (error: any) {
        console.error('Lỗi khởi tạo bài thi:', error);
        Alert.alert(
          'Không thể tải bài thi',
          error?.response?.data?.message || 'Có lỗi kết nối đến máy chủ. Vui lòng thử lại sau.',
          [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeExam();

    return () => {
      isMounted = false;
    };
  }, [paramQuizId]);

  // 2. Quản lý đồng hồ đếm ngược
  useEffect(() => {
    if (loading || submitting || !attempt || attempt.timedScreen) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOutSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading, submitting, attempt]);

  // 3. Giải phóng âm thanh khi rời màn hình hoặc đổi câu
  const stopSpeech = () => {
    try {
      Speech.stop();
      setIsSpeaking(false);
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    stopSpeech();
    return () => {
      stopSpeech();
    };
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // 4. Xử lý phát / dừng âm thanh đọc câu hỏi qua expo-speech
  const handleToggleSpeech = (textToSpeak?: string) => {
    if (!textToSpeak) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Speech.speak(textToSpeak, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // 5. Chọn đáp án cho câu hỏi hiện tại
  const handleSelectOption = (questionId: number, optionId: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // 6. Xử lý hết giờ làm bài
  const handleTimeOutSubmit = async () => {
    Alert.alert(
      'Hết giờ làm bài!',
      'Thời gian làm bài thi đã kết thúc. Hệ thống đang tiến hành thu và chấm điểm bài làm của bạn.',
      [{ text: 'Đồng ý', onPress: () => performSubmit() }]
    );
  };

  // 7. Xác nhận nộp bài sớm
  const handlePromptSubmit = () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = questions.length;
    const unansweredCount = totalCount - answeredCount;

    let message = `Bạn đã hoàn thành ${answeredCount}/${totalCount} câu hỏi.`;
    if (unansweredCount > 0) {
      message += `\nCòn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`;
    } else {
      message += `\nBạn có muốn nộp bài và xem điểm số ngay bây giờ?`;
    }

    Alert.alert('Xác nhận nộp bài', message, [
      { text: 'Làm tiếp', style: 'cancel' },
      {
        text: 'Nộp bài ngay',
        style: 'default',
        onPress: () => performSubmit(),
      },
    ]);
  };

  // 8. Thực hiện gọi API nộp bài
  const performSubmit = async () => {
    if (!attempt || submitting) return;

    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeech();

      // Định dạng mảng câu trả lời gửi lên Backend
      const answersPayload = questions.map((q) => ({
        attemptQuestionId: q.id,
        selectedAttemptOptionId: userAnswers[q.id] || null,
        answerText: null,
      }));

      const result = await quizService.submitAttempt(attempt.id, answersPayload);

      // Chuyển hướng sang màn hình Kết quả thi
      navigation.replace('QuizResult', { attemptResult: result });
    } catch (error: any) {
      console.error('Lỗi khi nộp bài thi:', error);
      Alert.alert(
        'Lỗi nộp bài',
        error?.response?.data?.message || 'Không thể gửi bài thi lên máy chủ. Vui lòng thử lại.',
        [{ text: 'Thử lại', onPress: () => performSubmit() }, { text: 'Hủy' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 9. Nút thoát khỏi bài thi
  const handleExit = () => {
    Alert.alert(
      'Thoát bài thi?',
      'Bài làm đang diễn ra. Nếu thoát bây giờ, tiến trình làm bài có thể bị hủy hoặc tính điểm chưa hoàn thành.',
      [
        { text: 'Tiếp tục làm', style: 'cancel' },
        {
          text: 'Thoát ra',
          style: 'destructive',
          onPress: () => {
            stopSpeech();
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Định dạng thời gian MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Đang tải đề thi TOEIC...</Text>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={56} color="#94a3b8" />
        <Text style={styles.emptyTitle}>Đề thi chưa có câu hỏi</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (attempt?.timedScreen && ['MULTIPLE_CHOICE_MEANING', 'MATCHING_PAIRS'].includes(currentQuestion?.questionType || '')) {
    return <TimedVocabularyQuiz initial={attempt.timedScreen} legacyAnswers={Object.entries(userAnswers).map(([id, option]) => ({attemptQuestionId: Number(id), selectedAttemptOptionId: option}))} onFinished={attemptResult => navigation.replace('QuizResult', { attemptResult })} />;
  }
  const selectedOptionId = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isTimeWarning = remainingSeconds <= 60;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Header bài thi */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleExit} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>

        {/* Đồng hồ đếm ngược */}
        <View style={[styles.timerBadge, isTimeWarning && styles.timerBadgeWarning]}>
          <Ionicons
            name="timer-outline"
            size={18}
            color={isTimeWarning ? '#dc2626' : '#ea580c'}
          />
          <Text style={[styles.timerText, isTimeWarning && styles.timerTextWarning]}>
            {formatTimer(remainingSeconds)}
          </Text>
        </View>

        {/* Nút nộp bài */}
        <TouchableOpacity
          style={styles.submitHeaderBtn}
          onPress={handlePromptSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitHeaderBtnText}>Nộp bài</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Thanh tiến độ câu hỏi */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfoRow}>
          <Text style={styles.questionIndexText}>
            Câu <Text style={styles.questionHighlight}>{currentIndex + 1}</Text> / {questions.length}
          </Text>
          <TouchableOpacity
            style={styles.paletteTrigger}
            onPress={() => setIsPaletteVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="grid-outline" size={16} color="#ea580c" />
            <Text style={styles.paletteTriggerText}>
              Đã làm: {Object.keys(userAnswers).length}/{questions.length}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* 3. Nội dung câu hỏi & danh sách phương án */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          {/* Nút nghe đọc câu hỏi qua expo-speech */}
          <View style={styles.audioActionRow}>
            <TouchableOpacity
              style={[styles.audioBtn, isSpeaking && styles.audioBtnActive]}
              onPress={() => handleToggleSpeech(currentQuestion.questionText)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSpeaking ? 'pause' : 'volume-high'}
                size={20}
                color={isSpeaking ? '#ffffff' : '#ea580c'}
              />
              <Text
                style={[
                  styles.audioBtnText,
                  isSpeaking && styles.audioBtnTextActive,
                ]}
              >
                {isSpeaking ? 'Dừng đọc' : 'Nghe câu hỏi'}
              </Text>
            </TouchableOpacity>

            {currentQuestion.points ? (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>+{currentQuestion.points} điểm</Text>
              </View>
            ) : null}
          </View>

          {/* Ảnh minh họa câu hỏi nếu có (TOEIC Part 1 - Photographs) */}
          {currentQuestion.questionImageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentQuestion.questionImageUrl }}
                style={styles.questionImage}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {/* Văn bản câu hỏi */}
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </View>

        {/* Danh sách các lựa chọn A, B, C, D */}
        <View style={styles.optionsList}>
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            currentQuestion.options.map((opt: QuizOptionResponse, idx: number) => {
              const isSelected = selectedOptionId === opt.id;
              const optionLabel = opt.optionKey || String.fromCharCode(65 + idx); // A, B, C, D

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(currentQuestion.id, opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                    <Text
                      style={[styles.optionBadgeText, isSelected && styles.optionBadgeTextSelected]}
                    >
                      {optionLabel}
                    </Text>
                  </View>

                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.optionText}
                  </Text>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noOptionsText}>Câu hỏi này chưa có lựa chọn trả lời.</Text>
          )}
        </View>
      </ScrollView>

      {/* 4. Thanh điều hướng câu trước / câu sau */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={() => {
            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          }}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentIndex === 0 ? '#cbd5e1' : '#475569'}
          />
          <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>
            Câu trước
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navGridBtn}
          onPress={() => setIsPaletteVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="grid" size={20} color="#ea580c" />
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, styles.navSubmitBtn]}
            onPress={handlePromptSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.navSubmitBtnText}>Nộp bài</Text>
            <Ionicons name="checkmark-done" size={20} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.navNextBtn]}
            onPress={() => {
              if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.navNextBtnText}>Câu tiếp</Text>
            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. Modal Bảng danh sách câu hỏi (Palette Modal) */}
      <Modal
        visible={isPaletteVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaletteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Danh Sách Câu Hỏi</Text>
              <TouchableOpacity
                onPress={() => setIsPaletteVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Chú giải trạng thái */}
            <View style={styles.modalLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#ea580c' }]} />
                <Text style={styles.legendLabel}>Đang làm</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendLabel}>Đã trả lời</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#f1f5f9' }]} />
                <Text style={styles.legendLabel}>Chưa làm</Text>
              </View>
            </View>

            {/* Lưới các câu hỏi 1..N */}
            <ScrollView contentContainerStyle={styles.gridContainer}>
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = userAnswers[q.id] !== undefined;

                let boxBg = '#f1f5f9';
                let textColor = '#475569';
                let borderColor = '#e2e8f0';

                if (isCurrent) {
                  boxBg = '#fff7ed';
                  borderColor = '#ea580c';
                  textColor = '#ea580c';
                } else if (isAnswered) {
                  boxBg = '#dcfce7';
                  borderColor = '#86efac';
                  textColor = '#16a34a';
                }

                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.gridItem,
                      { backgroundColor: boxBg, borderColor: borderColor },
                    ]}
                    onPress={() => {
                      setCurrentIndex(idx);
                      setIsPaletteVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gridItemText, { color: textColor }]}>{idx + 1}</Text>
                    {isAnswered && !isCurrent && (
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#16a34a"
                        style={styles.gridCheckmark}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={() => {
                setIsPaletteVisible(false);
                handlePromptSubmit();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitBtnText}>Nộp bài ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Overlay khi đang nộp bài */}
      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.submittingText}>Hệ thống đang chấm điểm bài thi...</Text>
        </View>
      )}
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
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#ea580c',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
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
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  timerBadgeWarning: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#ea580c',
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: '#dc2626',
  },
  submitHeaderBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  submitHeaderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionIndexText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  questionHighlight: {
    color: '#ea580c',
    fontWeight: '800',
    fontSize: 16,
  },
  paletteTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
  },
  paletteTriggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
    marginLeft: 5,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  audioActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  audioBtnActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  audioBtnText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#ea580c',
  },
  audioBtnTextActive: {
    color: '#ffffff',
  },
  pointsBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#f1f5f9',
  },
  questionImage: {
    width: '100%',
    height: '100%',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#fffaf5',
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionBadgeSelected: {
    backgroundColor: '#ea580c',
  },
  optionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  optionBadgeTextSelected: {
    color: '#ffffff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 21,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ea580c',
    fontWeight: '700',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: '#ea580c',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ea580c',
  },
  noOptionsText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 20,
    fontStyle: 'italic',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 4,
  },
  navBtnTextDisabled: {
    color: '#cbd5e1',
  },
  navGridBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  navNextBtn: {
    backgroundColor: '#ea580c',
  },
  navNextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4,
  },
  navSubmitBtn: {
    backgroundColor: '#16a34a',
  },
  navSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  gridItem: {
    width: (width - 40 - 40) / 5,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridItemText: {
    fontSize: 15,
    fontWeight: '700',
  },
  gridCheckmark: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  modalSubmitBtn: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  submittingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
