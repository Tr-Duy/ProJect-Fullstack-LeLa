import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { voiceService } from '../services/voiceService';
import { ConversationScenarioDto, VoiceStatusResponse } from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'VoiceScenarioSelect'>;

export const VoiceScenarioSelectScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [scenarios, setScenarios] = useState<ConversationScenarioDto[]>([]);
  const [status, setStatus] = useState<VoiceStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [startingId, setStartingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [statusData, scenarioList] = await Promise.all([
        voiceService.getVoiceStatus().catch(() => null),
        voiceService.getScenarios().catch(() => []),
      ]);
      setStatus(statusData);
      setScenarios(scenarioList);
    } catch (error: any) {
      console.error('Lỗi tải dữ liệu Voice Scenarios:', error);
      Alert.alert(
        'Lỗi kết nối',
        error?.response?.data?.message || 'Không thể tải danh sách kịch bản hội thoại AI.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tự động tải lại dữ liệu khi màn hình được active/focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStartConversation = async (scenario: ConversationScenarioDto) => {
    try {
      setStartingId(scenario.id);
      const sessionData = await voiceService.startSession(scenario.id, scenario.slug);

      navigation.navigate('VoiceConversation', {
        initialSession: sessionData,
        scenarioTitle: scenario.title,
      });
    } catch (error: any) {
      console.error('Lỗi khởi tạo phiên nói:', error);
      const serverMsg =
        error?.message ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        'Có lỗi xảy ra khi kết nối phòng đàm thoại với AI Tutor (HTTP 500).';

      Alert.alert(
        'Lỗi khởi tạo phòng nói',
        serverMsg,
        [{ text: 'Đồng ý', style: 'default' }]
      );
    } finally {
      setStartingId(null);
    }
  };

  const getLevelBadgeColor = (min?: number) => {
    if (!min || min <= 1) return { bg: '#dcfce7', text: '#16a34a', label: 'A1 - A2' };
    if (min === 2) return { bg: '#e0f2fe', text: '#0284c7', label: 'B1' };
    if (min === 3) return { bg: '#fef3c7', text: '#d97706', label: 'B2' };
    return { bg: '#fce7f3', text: '#db2777', label: 'C1+' };
  };

  const renderScenarioCard = ({ item }: { item: ConversationScenarioDto }) => {
    const isStarting = startingId === item.id;
    const levelBadge = getLevelBadgeColor(item.levelMin);

    return (
      <TouchableOpacity
        style={styles.scenarioCard}
        activeOpacity={0.8}
        onPress={() => handleStartConversation(item)}
        disabled={startingId !== null}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.levelBadge, { backgroundColor: levelBadge.bg }]}>
            <Text style={[styles.levelBadgeText, { color: levelBadge.text }]}>
              {levelBadge.label}
            </Text>
          </View>

          <View style={styles.aiTagBadge}>
            <Ionicons name="sparkles" size={12} color="#16a34a" />
            <Text style={styles.aiTagText}>AI Tutor</Text>
          </View>
        </View>

        <Text style={styles.scenarioTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.scenarioDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Vai trò hội thoại */}
        <View style={styles.rolesContainer}>
          <View style={styles.roleItem}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748b" />
            <Text style={styles.roleLabel}>AI: </Text>
            <Text style={styles.roleValue} numberOfLines={1}>
              {item.aiRole || 'Người phỏng vấn / Hướng dẫn'}
            </Text>
          </View>
          <View style={styles.roleItem}>
            <Ionicons name="person-outline" size={14} color="#64748b" />
            <Text style={styles.roleLabel}>Bạn: </Text>
            <Text style={styles.roleValue} numberOfLines={1}>
              {item.userRole || 'Học viên'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.startBtn}>
            {isStarting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="mic" size={16} color="#ffffff" />
                <Text style={styles.startBtnText}>Bắt đầu luyện nói</Text>
              </>
            )}
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
        <Text style={styles.headerTitle}>Gia Sư Giao Tiếp AI</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* 2. Banner Hạn mức quota hàng ngày */}
      <View style={styles.quotaBanner}>
        <View style={styles.quotaIconBox}>
          <Ionicons name="infinite" size={24} color="#16a34a" />
        </View>
        <View style={styles.quotaInfo}>
          <Text style={styles.quotaTitle}>
            Hạn mức đàm thoại hôm nay
          </Text>
          <Text style={styles.quotaSub}>
            Còn lại:{' '}
            <Text style={styles.quotaHighlight}>
              {status?.remainingTurns ?? status?.remainingQuota ?? 3}
            </Text>{' '}
            / {status?.maxDailyTurns ?? status?.maxSessionsPerDay ?? 3} lượt đàm thoại
          </Text>
        </View>
      </View>

      {/* 3. Danh sách kịch bản hội thoại */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Đang tải các tình huống thực tế...</Text>
        </View>
      ) : (
        <FlatList
          data={scenarios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderScenarioCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#16a34a']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Chưa có tình huống khả dụng</Text>
              <Text style={styles.emptyDesc}>Các tình huống đàm thoại mới sẽ sớm được cập nhật.</Text>
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
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quotaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quotaInfo: {
    flex: 1,
  },
  quotaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  quotaSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  quotaHighlight: {
    color: '#16a34a',
    fontWeight: '800',
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
  scenarioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 4,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 6,
  },
  scenarioDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  rolesContainer: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 4,
    marginBottom: 12,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  roleValue: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  startBtnText: {
    fontSize: 13,
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

