import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { studyService } from '../services/studyService';
import { FlashcardResponse } from '../../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

type RouteParams = {
  FlashcardStudy: {
    deckId?: number;
    deckTitle?: string;
  };
};

export const FlashcardStudyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'FlashcardStudy'>>();
  const deckId = route.params?.deckId;
  const deckTitle = route.params?.deckTitle || 'Phiên học SRS';

  // State quản lý danh sách thẻ & vị trí hiện tại
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Thống kê kết quả phiên học
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [ratingCounts, setRatingCounts] = useState<{ [key: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // Đo thời gian phản xạ người học
  const cardStartTimeRef = useRef<number>(Date.now());

  // Animation lật thẻ 3D
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // Lấy dữ liệu thẻ học từ API
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoading(true);
      try {
        const studyCards = await studyService.getStudyCards(deckId, 'srs');
        setCards(studyCards);
        cardStartTimeRef.current = Date.now();
      } catch (error) {
        console.error('[FlashcardStudyScreen] Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [deckId]);

  // Phát âm tiếng Anh bản xứ chuẩn
  const playWordAudio = useCallback((textToSpeak: string) => {
    if (!textToSpeak) return;
    try {
      Speech.stop();
      Speech.speak(textToSpeak, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (err) {
      console.warn('[FlashcardStudyScreen] Speech error:', err);
    }
  }, []);

  // Tự động phát âm khi chuyển sang thẻ mới
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      const currentCard = cards[currentIndex];
      const word = currentCard.frontText || currentCard.word || '';
      playWordAudio(word);
    }
  }, [currentIndex, cards, playWordAudio]);

  // Hàm lật thẻ mượt mà
  const flipCard = () => {
    if (isSubmitting) return;

    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(false));
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(true));
    }
  };

  // Reset góc quay thẻ khi đổi thẻ
  const resetCardFlip = () => {
    flipAnimation.setValue(0);
    setIsFlipped(false);
  };

  // Xử lý gửi đánh giá phản xạ SM-2
  const handleRatingPress = async (rating: 1 | 2 | 3 | 4) => {
    if (isSubmitting || currentIndex >= cards.length) return;

    setIsSubmitting(true);
    const responseTimeMs = Date.now() - cardStartTimeRef.current;
    const currentCard = cards[currentIndex];

    try {
      // Gửi đánh giá lên backend
      const reviewRes = await studyService.submitReview(
        currentCard.id,
        rating,
        responseTimeMs
      );

      const xp = reviewRes?.xpAwarded ?? 10;
      setEarnedXp((prev) => prev + xp);
      setRatingCounts((prev) => ({
        ...prev,
        [rating]: (prev[rating] || 0) + 1,
      }));
    } catch (err) {
      console.warn('[FlashcardStudyScreen] Submit review error:', err);
      // Vẫn tiếp tục cho phép học viên ôn thẻ kế tiếp
      setEarnedXp((prev) => prev + 10);
      setRatingCounts((prev) => ({
        ...prev,
        [rating]: (prev[rating] || 0) + 1,
      }));
    } finally {
      // Chuyển thẻ tiếp theo
      resetCardFlip();
      setCurrentIndex((prev) => prev + 1);
      cardStartTimeRef.current = Date.now();
      setIsSubmitting(false);
    }
  };

  // Biến đổi góc quay cho hiệu ứng 3D Flip
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  // MÀN HÌNH LOADING
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Đang chuẩn bị thẻ học SRS...</Text>
      </SafeAreaView>
    );
  }

  // MÀN HÌNH KHÔNG CÓ THẺ CẦN ÔN
  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="checkmark-done-circle" size={68} color="#16a34a" />
        </View>
        <Text style={styles.emptyTitle}>Tuyệt vời! Không còn thẻ đến hạn</Text>
        <Text style={styles.emptySubtitle}>
          Bạn đã hoàn thành toàn bộ mục tiêu ôn tập cho bộ thẻ này hôm nay. Hãy quay lại sau hoặc khám phá thêm bộ thẻ mới!
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Quay về</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // MÀN HÌNH TỔNG KẾT KHI HOÀN THÀNH TOÀN BỘ PHIÊN
  if (currentIndex >= cards.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.summaryContainer}>
          <View style={styles.trophyBadge}>
            <Ionicons name="trophy" size={54} color="#ea580c" />
          </View>

          <Text style={styles.summaryTitle}>Xuất sắc! Hoàn thành phiên học</Text>
          <Text style={styles.summarySubtitle}>
            Bạn đã ôn tập thành công toàn bộ {cards.length} thẻ từ vựng theo thuật toán SM-2.
          </Text>

          {/* Hộp điểm thưởng XP */}
          <View style={styles.xpCard}>
            <Ionicons name="flash" size={28} color="#d97706" />
            <View style={styles.xpInfo}>
              <Text style={styles.xpNumber}>+{earnedXp} XP</Text>
              <Text style={styles.xpLabel}>Điểm kinh nghiệm nhận được</Text>
            </View>
          </View>

          {/* Bảng phân bổ đánh giá */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>Thống kê mức độ phản xạ</Text>

            <View style={styles.statRow}>
              <View style={styles.statLabelCol}>
                <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.statRowText}>Nhớ tốt / Dễ</Text>
              </View>
              <Text style={styles.statRowValue}>{(ratingCounts[3] || 0) + (ratingCounts[4] || 0)} thẻ</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statLabelCol}>
                <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.statRowText}>Cần suy nghĩ (Khó)</Text>
              </View>
              <Text style={styles.statRowValue}>{ratingCounts[2] || 0} thẻ</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statLabelCol}>
                <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.statRowText}>Chưa nhớ (Học lại)</Text>
              </View>
              <Text style={styles.statRowValue}>{ratingCounts[1] || 0} thẻ</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Hoàn tất & Quay về</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // THÔNG TIN THẺ HIỆN TẠI
  const currentCard = cards[currentIndex];
  const word = currentCard.frontText || currentCard.word || 'Vocabulary';
  const meaning = currentCard.backText || currentCard.vietnameseMeaning || 'Nghĩa của từ';
  const phonetic = currentCard.phonetic || '';
  const partOfSpeech = currentCard.partOfSpeech || '';
  const definition = currentCard.definition || currentCard.definitionEn || '';
  const example = currentCard.exampleText || currentCard.exampleEn || '';
  const exampleTranslation = currentCard.exampleTranslation || currentCard.exampleVi || '';

  // Tiến độ học
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. HEADER & THANH TIẾN ĐỘ */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <View style={styles.progressInfoRow}>
            <Text style={styles.deckTitleText} numberOfLines={1}>
              {deckTitle}
            </Text>
            <Text style={styles.progressCounterText}>
              {currentIndex + 1} / {cards.length}
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={() => playWordAudio(word)}>
          <Ionicons name="volume-medium" size={24} color="#ea580c" />
        </TouchableOpacity>
      </View>

      {/* 2. THẺ FLASHCARD TƯƠNG TÁC (3D FLIP) */}
      <View style={styles.cardWrapper}>
        <TouchableOpacity activeOpacity={0.95} onPress={flipCard} style={styles.touchableCard}>
          {/* MẶT TRƯỚC (FRONT) */}
          <Animated.View
            style={[
              styles.flashcard,
              styles.flashcardFront,
              {
                opacity: frontOpacity,
                transform: [{ rotateY: frontInterpolate }],
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              {partOfSpeech ? (
                <View style={styles.posBadge}>
                  <Text style={styles.posText}>{partOfSpeech}</Text>
                </View>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={styles.speakerCircle}
                onPress={(e) => {
                  e.stopPropagation();
                  playWordAudio(word);
                }}
              >
                <Ionicons name="volume-high" size={24} color="#ea580c" />
              </TouchableOpacity>
            </View>

            <View style={styles.frontBody}>
              <Text style={styles.wordText}>{word}</Text>
              {phonetic ? <Text style={styles.phoneticText}>{phonetic}</Text> : null}
            </View>

            <View style={styles.cardBottomRow}>
              <Ionicons name="sync" size={16} color="#94a3b8" />
              <Text style={styles.hintFlipText}>Chạm để xem định nghĩa & ví dụ</Text>
            </View>
          </Animated.View>

          {/* MẶT SAU (BACK) */}
          <Animated.View
            style={[
              styles.flashcard,
              styles.flashcardBack,
              {
                opacity: backOpacity,
                transform: [{ rotateY: backInterpolate }],
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.backScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.backHeader}>
                <Text style={styles.backWordMini}>{word}</Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    playWordAudio(word);
                  }}
                >
                  <Ionicons name="volume-high" size={20} color="#ea580c" />
                </TouchableOpacity>
              </View>

              <View style={styles.meaningBox}>
                <Text style={styles.meaningText}>{meaning}</Text>
              </View>

              {definition ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Định nghĩa:</Text>
                  <Text style={styles.detailValue}>{definition}</Text>
                </View>
              ) : null}

              {example ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Ví dụ thực tế:</Text>
                  <Text style={styles.exampleEnText}>“{example}”</Text>
                  {exampleTranslation ? (
                    <Text style={styles.exampleViText}>→ {exampleTranslation}</Text>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.cardBottomRow}>
              <Ionicons name="hand-left-outline" size={16} color="#ea580c" />
              <Text style={styles.hintRateText}>Đánh giá mức độ nhớ của bạn ở dưới</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* 3. THANH ĐÁNH GIÁ PHẢN XẠ SM-2 (HIỆN KHI ĐÃ LẬT MẶT SAU) */}
      <View style={styles.ratingContainer}>
        {isFlipped ? (
          <View style={styles.ratingGrid}>
            {/* Rating 1: AGAIN */}
            <TouchableOpacity
              style={[styles.rateBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
              onPress={() => handleRatingPress(1)}
              disabled={isSubmitting}
            >
              <Text style={[styles.rateInterval, { color: '#dc2626' }]}>1 phút</Text>
              <Text style={[styles.rateTitle, { color: '#b91c1c' }]}>1 • Lại</Text>
            </TouchableOpacity>

            {/* Rating 2: HARD */}
            <TouchableOpacity
              style={[styles.rateBtn, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}
              onPress={() => handleRatingPress(2)}
              disabled={isSubmitting}
            >
              <Text style={[styles.rateInterval, { color: '#d97706' }]}>5 phút</Text>
              <Text style={[styles.rateTitle, { color: '#b45309' }]}>2 • Khó</Text>
            </TouchableOpacity>

            {/* Rating 3: GOOD */}
            <TouchableOpacity
              style={[styles.rateBtn, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}
              onPress={() => handleRatingPress(3)}
              disabled={isSubmitting}
            >
              <Text style={[styles.rateInterval, { color: '#16a34a' }]}>1 ngày</Text>
              <Text style={[styles.rateTitle, { color: '#15803d' }]}>3 • Tốt</Text>
            </TouchableOpacity>

            {/* Rating 4: EASY */}
            <TouchableOpacity
              style={[styles.rateBtn, { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }]}
              onPress={() => handleRatingPress(4)}
              disabled={isSubmitting}
            >
              <Text style={[styles.rateInterval, { color: '#0284c7' }]}>4 ngày</Text>
              <Text style={[styles.rateTitle, { color: '#0369a1' }]}>4 • Dễ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.flipActionBtn} onPress={flipCard}>
            <Ionicons name="eye-outline" size={20} color="#ffffff" style={styles.btnIcon} />
            <Text style={styles.flipActionBtnText}>Xem đáp án & giải nghĩa</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deckTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    maxWidth: '70%',
  },
  progressCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 4,
  },
  cardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  touchableCard: {
    width: CARD_WIDTH,
    height: '92%',
  },
  flashcard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    justifyContent: 'space-between',
  },
  flashcardFront: {
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  flashcardBack: {
    borderWidth: 2,
    borderColor: '#fdba74',
    backgroundColor: '#fffdfa',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  posText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  speakerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontBody: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  wordText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  phoneticText: {
    fontSize: 18,
    color: '#ea580c',
    marginTop: 10,
    fontStyle: 'italic',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  hintFlipText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  hintRateText: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '600',
  },
  backScrollView: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  backHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    marginBottom: 14,
  },
  backWordMini: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ea580c',
  },
  meaningBox: {
    backgroundColor: '#ffedd5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9a3412',
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  exampleEnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  exampleViText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
  },
  ratingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: '#f8fafc',
  },
  ratingGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  rateInterval: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  rateTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  flipActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    borderRadius: 14,
    height: 52,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnIcon: {
    marginRight: 8,
  },
  flipActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  summaryContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fed7aa',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 18,
  },
  xpInfo: {
    marginLeft: 14,
  },
  xpNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#b45309',
  },
  xpLabel: {
    fontSize: 12,
    color: '#78350f',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statRowText: {
    fontSize: 13,
    color: '#475569',
  },
  statRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 14,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
