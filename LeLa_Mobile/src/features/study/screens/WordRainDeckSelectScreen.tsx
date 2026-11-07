import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { typingGameService } from '../services/typingGameService';
import { TypingGameDeckDto, TypingGameMode } from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'WordRainDeckSelect'>;

export const WordRainDeckSelectScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [decks, setDecks] = useState<TypingGameDeckDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [startingDeckId, setStartingDeckId] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<TypingGameMode>('EASY');

  const fetchDecks = async () => {
    try {
      const data = await typingGameService.getTypingDecks();
      setDecks(data);
    } catch (error: any) {
      console.error('Lỗi tải danh sách bộ thẻ Word Rain:', error);
      Alert.alert(
        'Lỗi tải dữ liệu',
        error?.response?.data?.message || 'Không thể tải danh sách bộ thẻ luyện gõ. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDecks();
  };

  const handleSelectDeck = async (deck: TypingGameDeckDto) => {
    try {
      setStartingDeckId(deck.deckId);
      const runData = await typingGameService.startRun(deck.deckId, selectedMode);

      navigation.navigate('WordRainGame', {
        deckId: deck.deckId,
        deckTitle: deck.title,
        mode: selectedMode,
        initialRun: runData,
      });
    } catch (error: any) {
      console.error('Lỗi khi bắt đầu lượt chơi:', error);
      Alert.alert(
        'Không thể bắt đầu',
        error?.response?.data?.message || 'Có lỗi xảy ra khi tạo lượt chơi mới. Vui lòng thử lại.'
      );
    } finally {
      setStartingDeckId(null);
    }
  };

  const renderDeckCard = ({ item }: { item: TypingGameDeckDto }) => {
    const cardColor = item.cardColor || '#0284c7';
    const isStarting = startingDeckId === item.deckId;
    const bestScore = selectedMode === 'EASY' ? item.bestScoreEasy : item.bestScoreHard;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleSelectDeck(item)}
        disabled={startingDeckId !== null}
      >
        <View style={[styles.cardAccent, { backgroundColor: cardColor }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.requiresPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.infoRow}>
              <View style={styles.infoBadge}>
                <Ionicons name="book-outline" size={14} color="#64748b" />
                <Text style={styles.infoText}>{item.totalCards} từ vựng</Text>
              </View>

              <View style={styles.infoBadge}>
                <Ionicons name="trophy-outline" size={14} color="#eab308" />
                <Text style={styles.infoText}>Kỷ lục: {bestScore || 0}</Text>
              </View>
            </View>

            <View style={[styles.playBtn, { backgroundColor: cardColor }]}>
              {isStarting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.playBtnText}>Chơi ngay</Text>
                  <Ionicons name="play" size={12} color="#ffffff" />
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mưa Từ Vựng (Word Rain)</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* 2. Chọn Chế độ chơi (Dễ / Khó) */}
      <View style={styles.modeSelectorSection}>
        <Text style={styles.modeSectionLabel}>Chọn mức độ phản xạ:</Text>
        <View style={styles.modeToggleGroup}>
          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              selectedMode === 'EASY' && styles.modeToggleBtnActiveEasy,
            ]}
            onPress={() => setSelectedMode('EASY')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="leaf-outline"
              size={18}
              color={selectedMode === 'EASY' ? '#ffffff' : '#16a34a'}
            />
            <Text
              style={[
                styles.modeToggleText,
                selectedMode === 'EASY' && styles.modeToggleTextActive,
              ]}
            >
              Dễ (Cơ bản)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              selectedMode === 'HARD' && styles.modeToggleBtnActiveHard,
            ]}
            onPress={() => setSelectedMode('HARD')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flame-outline"
              size={18}
              color={selectedMode === 'HARD' ? '#ffffff' : '#ea580c'}
            />
            <Text
              style={[
                styles.modeToggleText,
                selectedMode === 'HARD' && styles.modeToggleTextActive,
              ]}
            >
              Khó (Tốc độ cao)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Danh sách các bộ thẻ */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Đang tải các bộ từ vựng luyện gõ...</Text>
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.deckId.toString()}
          renderItem={renderDeckCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284c7']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="rainy-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Chưa có bộ từ vựng nào</Text>
              <Text style={styles.emptyDesc}>Các bộ từ vựng mới sẽ sớm được cập nhật.</Text>
            </View>
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
  backBtn: {
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
  modeSelectorSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modeSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  modeToggleBtnActiveEasy: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  modeToggleBtnActiveHard: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modeToggleTextActive: {
    color: '#ffffff',
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
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: {
    width: 6,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  proBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  playBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
});

