import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { typingGameService } from '../services/typingGameService';
import {
  TypingRunResponse,
  TypingWordDto,
  TypingWordEventDto,
  TypingRunResultResponse,
} from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'WordRainGame'>;
type GameRouteProp = RouteProp<RootStackParamList, 'WordRainGame'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYABLE_HEIGHT = SCREEN_HEIGHT * 0.42; // Vùng bầu trời mưa chữ

export const WordRainGameScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<GameRouteProp>();
  const { deckId, deckTitle, mode = 'EASY', initialRun } = route.params || {};

  // Trạng thái khởi tạo & dữ liệu Backend
  const [loading, setLoading] = useState<boolean>(!initialRun);
  const [runData, setRunData] = useState<TypingRunResponse | null>(initialRun || null);
  const [words, setWords] = useState<TypingWordDto[]>(initialRun?.words || []);

  // Chỉ số trong game
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Nhập liệu và sự kiện gõ
  const [inputText, setInputText] = useState<string>('');
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [wrongKeystrokes, setWrongKeystrokes] = useState<number>(0);
  const [clearedWordsCount, setClearedWordsCount] = useState<number>(0);
  const [events, setEvents] = useState<TypingWordEventDto[]>([]);

  // Hiệu ứng và kết quả
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<TypingRunResultResponse | null>(null);
  const [wordHitSuccess, setWordHitSuccess] = useState<boolean>(false);

  // Animation rơi từ đỉnh xuống đáy
  const fallAnim = useRef(new Animated.Value(0)).current;
  const wordStartTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<any>(null);

  // 1. Tải dữ liệu ban đầu nếu chưa có initialRun
  useEffect(() => {
    let isMounted = true;

    const initRun = async () => {
      if (initialRun) return;

      try {
        setLoading(true);
        let targetDeckId = deckId;
        if (!targetDeckId) {
          const decks = await typingGameService.getTypingDecks();
          if (!decks || decks.length === 0) {
            Alert.alert('Thông báo', 'Hiện chưa có bộ thẻ luyện gõ nào sẵn sàng.', [
              { text: 'Quay lại', onPress: () => navigation.goBack() },
            ]);
            return;
          }
          targetDeckId = decks[0].deckId;
        }

        const run = await typingGameService.startRun(targetDeckId, mode);
        if (!isMounted) return;

        setRunData(run);
        setWords(run.words || []);
        setLives(run.livesLeft || 3);
        setStage(run.currentStage || 1);
      } catch (error: any) {
        console.error('Lỗi khởi tạo game Word Rain:', error);
        Alert.alert(
          'Lỗi khởi tạo',
          error?.response?.data?.message || 'Không thể tạo phiên chơi mới. Vui lòng thử lại.',
          [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initRun();

    return () => {
      isMounted = false;
      Speech.stop();
    };
  }, [deckId, mode]);

  // 2. Kích hoạt hiệu ứng rơi cho từ vựng hiện tại
  useEffect(() => {
    if (loading || isGameOver || isVictory || isPaused || words.length === 0) return;
    if (currentIndex >= words.length) {
      handleGameComplete(true);
      return;
    }

    // Thời gian rơi: EASY = 6000ms, HARD = 3600ms (giảm dần nhẹ theo stage)
    const baseDuration = mode === 'HARD' ? 3600 : 5800;
    const stageMultiplier = Math.max(0.7, 1 - (stage - 1) * 0.08);
    const dropDuration = Math.round(baseDuration * stageMultiplier);

    fallAnim.setValue(0);
    wordStartTimeRef.current = Date.now();
    setWordHitSuccess(false);

    const animation = Animated.timing(fallAnim, {
      toValue: 1,
      duration: dropDuration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        // Từ đã chạm đáy mà chưa được gõ
        handleWordMissed();
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentIndex, words, loading, isPaused, isGameOver, isVictory, stage]);

  // 3. Xử lý khi từ bị rơi chạm đáy (Missed)
  const handleWordMissed = () => {
    const currentWord = words[currentIndex];
    const duration = Date.now() - wordStartTimeRef.current;

    const event: TypingWordEventDto = {
      flashcardId: currentWord.flashcardId,
      result: 'MISSED',
      wrongKeystrokes: 1,
      clientDurationMs: duration,
    };
    setEvents((prev) => [...prev, event]);

    // Trừ 1 mạng và reset combo — dùng functional update tránh stale closure
    setLives((prevLives) => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        // Phải defer để tránh setState trong render cycle
        setTimeout(() => handleGameOver(), 0);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
      return newLives;
    });
    setCombo(0);
    setInputText('');
  };

  // 4. Xử lý khi gõ đúng từ
  const handleWordCleared = (wordText: string) => {
    const currentWord = words[currentIndex];
    const duration = Date.now() - wordStartTimeRef.current;

    fallAnim.stopAnimation();
    setWordHitSuccess(true);

    // Tính điểm thưởng combo — dùng functional update tránh stale
    setCombo((prevCombo) => {
      const nextCombo = prevCombo + 1;
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      const points = Math.round(100 * (1 + nextCombo * 0.15));
      setScore((prev) => prev + points);
      return nextCombo;
    });
    setClearedWordsCount((prev) => prev + 1);

    const event: TypingWordEventDto = {
      flashcardId: currentWord.flashcardId,
      result: 'CLEARED',
      wrongKeystrokes: 0,
      clientDurationMs: duration,
    };
    setEvents((prev) => [...prev, event]);

    // Phát âm từ vựng tiếng Anh vừa gõ đúng
    try {
      Speech.speak(wordText, {
        language: 'en-US',
        rate: 1.0,
      });
    } catch (e) {
      // Ignored
    }

    // Xóa ô nhập và chuyển sang từ kế tiếp sau 350ms
    setInputText('');
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 350);
  };

  // 5. Lắng nghe thay đổi khi người dùng gõ phím
  const handleTextChange = (text: string) => {
    setInputText(text);
    setTotalKeystrokes((prev) => prev + 1);

    if (words.length === 0 || currentIndex >= words.length) return;
    const currentWord = words[currentIndex];
    const targetWord = currentWord.word.trim().toLowerCase();
    const cleanInput = text.trim().toLowerCase();

    // So khớp từ hoàn chỉnh
    if (cleanInput === targetWord) {
      handleWordCleared(currentWord.word);
    } else if (cleanInput.length > 0 && !targetWord.startsWith(cleanInput)) {
      setWrongKeystrokes((prev) => prev + 1);
    }
  };

  // 6. Xử lý Game Over (Hết mạng)
  const handleGameOver = () => {
    setIsGameOver(true);
    fallAnim.stopAnimation();
    finishRunSession('LIVES_DEPLETED');
  };

  // 7. Xử lý Chiến thắng (Gõ hết từ)
  const handleGameComplete = (isWin: boolean) => {
    setIsVictory(isWin);
    fallAnim.stopAnimation();
    finishRunSession(isWin ? 'VICTORY' : 'USER_QUIT');
  };

  // 8. Gửi kết quả lên máy chủ
  const finishRunSession = async (reason: string) => {
    if (!runData || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const totalTimeSec = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));

      const result = await typingGameService.finishRun(runData.publicId, {
        events,
        reason,
        totalTimeSeconds: totalTimeSec,
        correctWords: clearedWordsCount,
        totalKeystrokes,
      });

      setGameResult(result);
    } catch (error) {
      console.error('Lỗi khi nộp kết quả lượt chơi:', error);
      // Tạo kết quả dự phòng offline nếu có sự cố mạng
      setGameResult({
        publicId: runData.publicId,
        deckId: runData.deckId,
        deckTitle: runData.deckTitle || deckTitle || 'Mưa từ vựng',
        mode: runData.mode,
        status: reason === 'VICTORY' ? 'COMPLETED' : 'GAME_OVER',
        score,
        stageReached: stage,
        totalStages: runData.totalStages || 1,
        wordsCleared: clearedWordsCount,
        wordsMissed: words.length - clearedWordsCount,
        accuracy: totalKeystrokes > 0 ? Math.round((clearedWordsCount / words.length) * 100) : 100,
        wpm: Math.round((clearedWordsCount / Math.max(1, (Date.now() - gameStartTimeRef.current) / 60000))),
        maxCombo,
        xpEarned: clearedWordsCount * 5,
        dailyXpRemaining: 100,
        isNewHighScore: false,
        reviewWords: words.map((w) => ({
          flashcardId: w.flashcardId,
          word: w.word,
          meaning: w.meaning,
          phonetic: w.phonetic,
          result: 'CLEARED',
          wrongKeystrokes: 0,
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 9. Nút thoát khỏi trò chơi
  const handleExit = () => {
    setIsPaused(true);
    Alert.alert(
      'Tạm dừng trò chơi',
      'Bạn có chắc chắn muốn dừng phiên chơi hiện tại? Điểm số phiên này sẽ bị hủy.',
      [
        {
          text: 'Tiếp tục chơi',
          style: 'cancel',
          onPress: () => setIsPaused(false),
        },
        {
          text: 'Thoát game',
          style: 'destructive',
          onPress: async () => {
            if (runData) {
              await typingGameService.abandonRun(runData.publicId);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  // 10. Chơi lại phiên mới
  const handleRestart = async () => {
    setIsGameOver(false);
    setIsVictory(false);
    setGameResult(null);
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setCurrentIndex(0);
    setClearedWordsCount(0);
    setTotalKeystrokes(0);
    setWrongKeystrokes(0);
    setEvents([]);
    setInputText('');
    gameStartTimeRef.current = Date.now();

    try {
      setLoading(true);
      const newRun = await typingGameService.startRun(deckId || 1, mode);
      setRunData(newRun);
      setWords(newRun.words || []);
    } catch (e) {
      console.error('Lỗi khi khởi động lại lượt chơi:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Đang chuẩn bị các giọt mưa từ vựng...</Text>
      </SafeAreaView>
    );
  }

  // --- MÀN HÌNH TỔNG KẾT (KẾT THÚC HOẶC CHIẾN THẮNG) ---
  if (isGameOver || isVictory || gameResult) {
    const isWin = isVictory || gameResult?.status === 'COMPLETED';

    return (
      <SafeAreaView style={styles.resultSafeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.resultContainer} showsVerticalScrollIndicator={false}>
          {/* Huy hiệu kết quả */}
          <View style={[styles.resultBanner, isWin ? styles.resultBannerWin : styles.resultBannerOver]}>
            <Ionicons
              name={isWin ? 'trophy' : 'skull'}
              size={56}
              color={isWin ? '#eab308' : '#ef4444'}
            />
            <Text style={styles.resultTitle}>
              {isWin ? 'XUẤT SẮC! HOÀN THÀNH' : 'GAME OVER (HẾT MẠNG)'}
            </Text>
            <Text style={styles.resultSubtitle}>
              {deckTitle || runData?.deckTitle || 'Mưa từ vựng'}
            </Text>
          </View>

          {/* Lưới điểm số WPM, Accuracy, XP */}
          <View style={styles.statsCard}>
            <View style={styles.statGridRow}>
              <View style={styles.statCol}>
                <Ionicons name="speedometer-outline" size={24} color="#38bdf8" />
                <Text style={styles.statBigValue}>{gameResult?.wpm ?? 0}</Text>
                <Text style={styles.statSubLabel}>WPM (Từ/Phút)</Text>
              </View>

              <View style={styles.statCol}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#4ade80" />
                <Text style={styles.statBigValue}>{gameResult?.accuracy ?? 100}%</Text>
                <Text style={styles.statSubLabel}>Độ chính xác</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statGridRow}>
              <View style={styles.statCol}>
                <Ionicons name="star-outline" size={24} color="#f59e0b" />
                <Text style={styles.statBigValue}>{gameResult?.score ?? score}</Text>
                <Text style={styles.statSubLabel}>Tổng điểm</Text>
              </View>

              <View style={styles.statCol}>
                <Ionicons name="flame-outline" size={24} color="#ea580c" />
                <Text style={styles.statBigValue}>x{gameResult?.maxCombo ?? maxCombo}</Text>
                <Text style={styles.statSubLabel}>Max Combo</Text>
              </View>

              <View style={styles.statCol}>
                <Ionicons name="sparkles" size={24} color="#a855f7" />
                <Text style={styles.statBigValue}>+{gameResult?.xpEarned ?? clearedWordsCount * 5}</Text>
                <Text style={styles.statSubLabel}>XP Nhận</Text>
              </View>
            </View>
          </View>

          {/* Danh sách từ cần ôn lại */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewHeading}>
              Từ vựng trong phiên ({clearedWordsCount}/{words.length} đúng)
            </Text>

            {words.map((w, idx) => (
              <View key={w.flashcardId || idx} style={styles.reviewItem}>
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewWord}>{w.word}</Text>
                  {w.phonetic ? <Text style={styles.reviewPhonetic}>{w.phonetic}</Text> : null}
                  <Text style={styles.reviewMeaning}>{w.meaning}</Text>
                </View>

                <TouchableOpacity
                  style={styles.reviewSpeechBtn}
                  onPress={() => Speech.speak(w.word, { language: 'en-US' })}
                >
                  <Ionicons name="volume-high" size={20} color="#38bdf8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Nút hành động */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.replayBtn} onPress={handleRestart} activeOpacity={0.8}>
              <Ionicons name="reload" size={18} color="#ffffff" />
              <Text style={styles.replayBtnText}>Chơi lại bộ này</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color="#94a3b8" />
              <Text style={styles.menuBtnText}>Quay về danh sách</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- MÀN HÌNH CHƠI GAME CHÍNH (BẦU TRỜ MƯA CHỮ) ---
  const currentWord = words[currentIndex];
  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, PLAYABLE_HEIGHT],
  });

  return (
    <SafeAreaView style={styles.gameSafeArea} edges={['top']}>
      {/* 1. Header game: Điểm, Trái tim, Stage, Nút thoát */}
      <View style={styles.gameHeader}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>

        {/* Thanh sinh mệnh Hearts */}
        <View style={styles.heartsRow}>
          {[1, 2, 3].map((heartIndex) => (
            <Ionicons
              key={heartIndex}
              name={heartIndex <= lives ? 'heart' : 'heart-dislike'}
              size={22}
              color={heartIndex <= lives ? '#ef4444' : '#475569'}
              style={{ marginHorizontal: 2 }}
            />
          ))}
        </View>

        {/* Điểm số */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
          {combo > 1 && (
            <View style={styles.comboBadge}>
              <Text style={styles.comboText}>x{combo} 🔥</Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Bầu trời mưa chữ (Playable Arena) */}
      <View style={styles.arenaContainer}>
        {/* Vạch cảnh báo nguy hiểm dưới đáy */}
        <View style={styles.dangerLine}>
          <Text style={styles.dangerLineText}>VẠCH NGUY HIỂM</Text>
        </View>

        {/* Giọt từ vựng đang rơi */}
        {currentWord ? (
          <Animated.View
            style={[
              styles.droppingWordBox,
              wordHitSuccess && styles.droppingWordSuccess,
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.wordPill}>
              <Text style={[styles.wordPillText, wordHitSuccess && styles.wordPillTextSuccess]}>
                {currentWord.word}
              </Text>
              {currentWord.meaning ? (
                <Text style={styles.wordPillMeaning} numberOfLines={1}>
                  {currentWord.meaning}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* Thanh tiến độ từ vựng */}
        <View style={styles.wordCounterPill}>
          <Text style={styles.wordCounterText}>
            Từ: {currentIndex + 1} / {words.length}
          </Text>
        </View>
      </View>

      {/* 3. Khu vực tương tác nhập liệu với KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputAreaContainer}
      >
        <View style={styles.inputCard}>
          <Text style={styles.inputHint}>Gõ đúng từ tiếng Anh đang rơi:</Text>

          <View style={styles.inputRow}>
            <Ionicons name="keypad-outline" size={20} color="#38bdf8" style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Nhập từ tại đây..."
              placeholderTextColor="#64748b"
              autoFocus={true}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="done"
            />
            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => setInputText('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  gameSafeArea: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  exitBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
    fontVariant: ['tabular-nums'],
  },
  comboBadge: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  comboText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  arenaContainer: {
    height: PLAYABLE_HEIGHT + 70,
    backgroundColor: '#0a0f1d',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  dangerLine: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ef4444',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  dangerLineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 1,
    marginBottom: 4,
  },
  droppingWordBox: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
  },
  droppingWordSuccess: {
    transform: [{ scale: 1.15 }],
  },
  wordPill: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  wordPillText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  wordPillTextSuccess: {
    color: '#4ade80',
  },
  wordPillMeaning: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },
  wordCounterPill: {
    position: 'absolute',
    top: 10,
    left: 16,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wordCounterText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  inputAreaContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  inputHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  clearBtn: {
    padding: 4,
  },
  resultSafeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  resultContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  resultBanner: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  resultBannerWin: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#eab308',
  },
  resultBannerOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#ef4444',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  statGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
  },
  statBigValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  reviewSection: {
    width: '100%',
    marginBottom: 24,
  },
  reviewHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewTextContainer: {
    flex: 1,
  },
  reviewWord: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38bdf8',
  },
  reviewPhonetic: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  reviewMeaning: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
  },
  reviewSpeechBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  replayBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  menuBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
