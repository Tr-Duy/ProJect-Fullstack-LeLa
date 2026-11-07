import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { quizService } from '../services/quizService';
import { QuizResponse } from '../../../types';

type QuizListNavProp = NativeStackNavigationProp<RootStackParamList, 'QuizList'>;

export const QuizListScreen: React.FC = () => {
  const navigation = useNavigation<QuizListNavProp>();
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchQuizzes = async () => {
    try {
      const data = await quizService.getQuizzes({ size: 30 });
      setQuizzes(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bài thi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuizzes();
  };

  const handleStartQuiz = (quiz: QuizResponse) => {
    navigation.navigate('QuizExam', {
      quizId: quiz.id,
      quizTitle: quiz.title,
    });
  };

  const renderQuizItem = ({ item }: { item: QuizResponse }) => {
    const timeLimitMinutes = item.timeLimitSeconds ? Math.floor(item.timeLimitSeconds / 60) : 15;

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => handleStartQuiz(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.quizCategory || 'TOEIC'}
            </Text>
          </View>
          {item.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyBadgeText}>{item.difficulty}</Text>
            </View>
          )}
        </View>

        <Text style={styles.quizTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.quizDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>{item.totalQuestions || 20} câu hỏi</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>{timeLimitMinutes} phút</Text>
            </View>
          </View>

          <View style={styles.startBadge}>
            <Text style={styles.startBadgeText}>Làm bài</Text>
            <Ionicons name="play" size={12} color="#ffffff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khảo Thí & Đề Thi TOEIC</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loadingText}>Đang tải danh sách bài thi...</Text>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuizItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#ea580c']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Chưa có đề thi nào</Text>
              <Text style={styles.emptySubtitle}>Các đề thi TOEIC mới sẽ sớm được cập nhật</Text>
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
  backButton: {
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  quizCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  difficultyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 6,
  },
  quizDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ea580c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  startBadgeText: {
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
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
});

