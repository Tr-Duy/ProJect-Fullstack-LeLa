import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../../../api/client';
import { DeckResponse, Page } from '../../../types';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterDifficulty = 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export const DeckListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [decks, setDecks] = useState<DeckResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tìm kiếm & Lọc
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<FilterDifficulty>('ALL');

  const fetchDecks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.get<Page<DeckResponse>>('/decks', {
        params: { page: 0, size: 50 },
      });
      if (response.data && response.data.content) {
        setDecks(response.data.content);
      }
    } catch (error: any) {
      console.error('[DeckListScreen] Error fetching decks:', error);
      setErrorMessage('Không thể tải danh sách bộ thẻ. Kéo xuống để thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDecks(false);
  };

  // Lọc bộ thẻ theo từ khóa tìm kiếm và độ khó
  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty =
        selectedDifficulty === 'ALL' ||
        deck.difficulty?.toUpperCase() === selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [decks, searchQuery, selectedDifficulty]);

  const renderDeckItem = ({ item }: { item: DeckResponse }) => {
    const isBeginner = item.difficulty?.toUpperCase() === 'BEGINNER';
    const isIntermediate = item.difficulty?.toUpperCase() === 'INTERMEDIATE';

    return (
      <TouchableOpacity
        style={styles.deckCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('DeckDetail', { deckId: item.id, initialDeck: item })}
      >
        <View style={styles.deckCardLeft}>
          <View
            style={[
              styles.deckIcon,
              isBeginner && { backgroundColor: '#DCFCE7' },
              isIntermediate && { backgroundColor: '#FEF3C7' },
            ]}
          >
            <Ionicons
              name="folder-open"
              size={24}
              color={isBeginner ? '#16A34A' : isIntermediate ? '#D97706' : '#EA580C'}
            />
          </View>
        </View>

        <View style={styles.deckCardBody}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.difficultyBadge,
                isBeginner && { backgroundColor: '#DCFCE7' },
                isIntermediate && { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  isBeginner && { color: '#16A34A' },
                  isIntermediate && { color: '#D97706' },
                ]}
              >
                {item.difficulty || 'TOEIC'}
              </Text>
            </View>

            {item.levelName ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.levelName}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.deckTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.deckDescription} numberOfLines={2}>
            {item.description || 'Bộ từ vựng trọng tâm ôn thi TOEIC chuẩn đầu ra theo ngữ cảnh.'}
          </Text>

          <View style={styles.deckMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="copy-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{item.totalCards || 0} thẻ</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{item.enrollmentCount || 0} học viên</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.quickStudyBtn}
          onPress={() =>
            navigation.navigate('FlashcardStudy', {
              deckId: item.id,
              deckTitle: item.title,
            })
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play" size={18} color="#EA580C" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Kho Bộ Thẻ Từ Vựng</Text>
            <Text style={styles.headerSubtitle}>Chọn bộ từ vựng mục tiêu để học theo thuật toán SRS</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={handleRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="sync-outline" size={20} color="#EA580C" />
          </TouchableOpacity>
        </View>

        {/* Thanh tìm kiếm */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bộ từ vựng theo tên, chủ đề..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as FilterDifficulty[]).map((diff) => {
            const isSelected = selectedDifficulty === diff;
            const label =
              diff === 'ALL'
                ? 'Tất cả'
                : diff === 'BEGINNER'
                ? 'Cơ bản (350+)'
                : diff === 'INTERMEDIATE'
                ? 'Trung cấp (500+)'
                : 'Nâng cao (750+)';

            return (
              <TouchableOpacity
                key={diff}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedDifficulty(diff)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Đang tải kho bộ thẻ...</Text>
        </View>
      ) : errorMessage && decks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#94A3B8" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDecks()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDecks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDeckItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#EA580C']}
              tintColor="#EA580C"
            />
          }
          ListHeaderComponent={
            filteredDecks.length > 0 ? (
              <Text style={styles.resultCountText}>
                Tìm thấy {filteredDecks.length} bộ từ vựng
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không tìm thấy bộ thẻ phù hợp</Text>
              <Text style={styles.emptyText}>
                Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc độ khó.
              </Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#EA580C',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  resultCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deckCardLeft: {
    marginRight: 14,
  },
  deckIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckCardBody: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  difficultyBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  levelBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  deckTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  deckMetaRow: {
    flexDirection: 'row',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  quickStudyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
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
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
