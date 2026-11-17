import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { deckService } from '../services/deck.service';
import { deckTestService, DeckTestStatusResponse } from '../services/deckTestService';
import { TimedVocabularyQuiz } from '../../quiz/components/TimedVocabularyQuiz';
import type { TimedQuizView } from '../../quiz/components/useTimedVocabularyQuiz';
import { DeckResponse, FlashcardResponse } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { speakEnglish } from '../../../utils/speech';

type DeckDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'DeckDetail'>;

type RouteParams = {
  DeckDetail: {
    deckId: number;
    initialDeck?: DeckResponse;
  };
};

export const DeckDetailScreen: React.FC = () => {
  const navigation = useNavigation<DeckDetailNavProp>();
  const route = useRoute<RouteProp<RouteParams, 'DeckDetail'>>();
  const { deckId, initialDeck } = route.params;

  const [deck, setDeck] = useState<DeckResponse | null>(initialDeck || null);
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!initialDeck);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [deckTestStatus, setDeckTestStatus] = useState<DeckTestStatusResponse | null>(null);
  const [timedQuizView, setTimedQuizView] = useState<TimedQuizView | null>(null);
  const [isStartingTest, setIsStartingTest] = useState<boolean>(false);

  const refreshTestStatus = async () => {
    try {
      const status = await deckTestService.getStatus(deckId);
      setDeckTestStatus(status);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadDeckData = async () => {
      try {
        const [deckData, cardsPage, testStatus] = await Promise.all([
          deckService.getDeckById(deckId),
          deckService.getDeckCards(deckId, 0, 50),
          deckTestService.getStatus(deckId).catch(() => null),
        ]);
        setDeck(deckData);
        setCards(cardsPage.content || []);
        setDeckTestStatus(testStatus);
      } catch (error) {
        console.error('[DeckDetailScreen] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeckData();
  }, [deckId]);

  const handleStartDeckTest = async () => {
    if (isStartingTest) return;
    setIsStartingTest(true);
    try {
      const view = await deckTestService.start(deckId);
      setTimedQuizView(view);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Không thể bắt đầu bài thi. Vui lòng thử lại sau.';
      Alert.alert('Không thể bắt đầu bài thi', msg);
    } finally {
      setIsStartingTest(false);
    }
  };

  const handleStartStudy = async () => {
    setIsEnrolling(true);
    try {
      // Tự động ghi danh nếu chưa
      await deckService.enrollDeck(deckId).catch(() => {});
      navigation.navigate('FlashcardStudy', {
        deckId,
        deckTitle: deck?.title || 'Học từ vựng',
      });
    } catch (error) {
      console.error('[DeckDetailScreen] Enroll error:', error);
      navigation.navigate('FlashcardStudy', {
        deckId,
        deckTitle: deck?.title || 'Học từ vựng',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading || !deck) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>Đang tải thông tin bộ thẻ...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Chi tiết Bộ thẻ
        </Text>
        <View style={styles.placeholderIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Deck Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.deckIconBox}>
            <Ionicons name="library" size={36} color="#ea580c" />
          </View>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.deckDesc}>{deck.description || 'Bộ từ vựng tiếng Anh theo chuẩn TOEIC.'}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="copy-outline" size={14} color="#ea580c" />
              <Text style={styles.metaBadgeText}>{deck.totalCards || cards.length} Thẻ từ</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.metaBadgeText, { color: '#475569' }]}>{deck.difficulty}</Text>
            </View>
            {deck.levelName ? (
              <View style={[styles.metaBadge, { backgroundColor: '#e0e7ff' }]}>
                <Text style={[styles.metaBadgeText, { color: '#4338ca' }]}>{deck.levelName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Start Study CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartStudy}
          disabled={isEnrolling}
          activeOpacity={0.8}
        >
          {isEnrolling ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="play" size={20} color="#ffffff" style={styles.ctaIcon} />
              <Text style={styles.ctaText}>Bắt đầu học ngay (SRS)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Topic Test Section */}
        {deckTestStatus && (
          <View style={styles.topicTestCard}>
            <View style={styles.topicTestHeader}>
              <View style={styles.topicTestTitleRow}>
                <Ionicons name="school" size={20} color="#ea580c" />
                <Text style={styles.topicTestTitle}>Bài thi theo chủ đề</Text>
              </View>
              {!deckTestStatus.hasEnoughCards ? (
                <View style={[styles.testBadge, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={[styles.testBadgeText, { color: '#64748b' }]}>Chưa đủ dữ liệu</Text>
                </View>
              ) : deckTestStatus.hasPassed ? (
                <View style={[styles.testBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.testBadgeText, { color: '#16a34a' }]}>
                    Đã đạt ({deckTestStatus.bestScore}%)
                  </Text>
                </View>
              ) : deckTestStatus.eligible ? (
                <View style={[styles.testBadge, { backgroundColor: '#ffedd5' }]}>
                  <Text style={[styles.testBadgeText, { color: '#ea580c' }]}>Sẵn sàng thi</Text>
                </View>
              ) : (
                <View style={[styles.testBadge, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={[styles.testBadgeText, { color: '#64748b' }]}>Đang khóa</Text>
                </View>
              )}
            </View>

            {!deckTestStatus.hasEnoughCards ? (
              <View style={styles.topicTestAlert}>
                <Ionicons name="information-circle-outline" size={18} color="#94a3b8" />
                <Text style={styles.topicTestAlertText}>
                  Bộ thẻ này chưa đủ dữ liệu cho bài thi ({deckTestStatus.totalValidCards}/{deckTestStatus.minValidCardsRequired} thẻ hợp lệ).
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.topicTestDesc}>
                  10 câu trắc nghiệm (20s/câu) + 2 màn ghép cặp (60s/màn). Điểm đạt: 70%.
                </Text>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>
                      Tiến độ học: {deckTestStatus.learnedCards}/{deckTestStatus.requiredLearnedCards} thẻ yêu cầu
                    </Text>
                    <Text style={styles.progressPercent}>
                      {deckTestStatus.requiredLearnedCards > 0
                        ? Math.min(100, Math.round((deckTestStatus.learnedCards / deckTestStatus.requiredLearnedCards) * 100))
                        : 0}%
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${
                            deckTestStatus.requiredLearnedCards > 0
                              ? Math.min(100, Math.round((deckTestStatus.learnedCards / deckTestStatus.requiredLearnedCards) * 100))
                              : 0
                          }%`,
                          backgroundColor: deckTestStatus.eligible ? '#16a34a' : '#ea580c',
                        },
                      ]}
                    />
                  </View>
                </View>

                {!deckTestStatus.eligible && deckTestStatus.lockReason && (
                  <View style={styles.lockReasonBox}>
                    <Ionicons name="lock-closed-outline" size={16} color="#d97706" />
                    <Text style={styles.lockReasonText}>{deckTestStatus.lockReason}</Text>
                  </View>
                )}

                {deckTestStatus.eligible && (
                  <TouchableOpacity
                    style={[
                      styles.startTestButton,
                      deckTestStatus.hasPassed && { backgroundColor: '#059669' },
                    ]}
                    onPress={handleStartDeckTest}
                    disabled={isStartingTest}
                    activeOpacity={0.8}
                  >
                    {isStartingTest ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={deckTestStatus.hasPassed ? 'refresh' : 'clipboard-outline'}
                          size={18}
                          color="#ffffff"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.startTestButtonText}>
                          {deckTestStatus.hasPassed ? 'Thi lại cải thiện điểm' : 'Làm bài thi chủ đề'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Card List Preview */}
        <View style={styles.cardListSection}>
          <Text style={styles.sectionTitle}>Danh sách từ vựng ({cards.length})</Text>

          {cards.map((card, idx) => (
            <View key={card.id || idx} style={styles.cardItem}>
              <View style={styles.cardIndexBadge}>
                <Text style={styles.cardIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.cardItemBody}>
                <View style={styles.cardWordRow}>
                  <Text style={styles.cardWord}>{card.frontText || card.word}</Text>
                  {card.phonetic ? <Text style={styles.cardPhonetic}>{card.phonetic}</Text> : null}
                </View>
                <Text style={styles.cardMeaning}>{card.backText || card.vietnameseMeaning}</Text>
              </View>
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => speakEnglish(card.frontText || card.word || '')}
              >
                <Ionicons name="volume-high" size={20} color="#ea580c" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!timedQuizView}
        animationType="slide"
        onRequestClose={() => setTimedQuizView(null)}
      >
        {timedQuizView && (
          <TimedVocabularyQuiz
            initial={timedQuizView}
            onFinished={(result) => {
              setTimedQuizView(null);
              refreshTestStatus();
              navigation.navigate('QuizResult', { attemptResult: result });
            }}
          />
        )}
      </Modal>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  placeholderIcon: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deckIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deckTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  deckDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    borderRadius: 16,
    height: 54,
    marginBottom: 24,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardListSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  cardIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  cardItemBody: {
    flex: 1,
  },
  cardWordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  cardWord: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardPhonetic: {
    fontSize: 12,
    color: '#ea580c',
    fontStyle: 'italic',
  },
  cardMeaning: {
    fontSize: 13,
    color: '#475569',
  },
  speakButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  topicTestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  topicTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topicTestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicTestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  testBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  testBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topicTestAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  topicTestAlertText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  topicTestDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  lockReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 12,
  },
  lockReasonText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    flex: 1,
  },
  startTestButton: {
    backgroundColor: '#ea580c',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startTestButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

