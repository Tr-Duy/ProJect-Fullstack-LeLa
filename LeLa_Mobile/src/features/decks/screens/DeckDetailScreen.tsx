import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { deckService } from '../services/deck.service';
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

  useEffect(() => {
    const loadDeckData = async () => {
      try {
        const [deckData, cardsPage] = await Promise.all([
          deckService.getDeckById(deckId),
          deckService.getDeckCards(deckId, 0, 50),
        ]);
        setDeck(deckData);
        setCards(cardsPage.content || []);
      } catch (error) {
        console.error('[DeckDetailScreen] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeckData();
  }, [deckId]);

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
});

