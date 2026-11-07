import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { useTheme } from '../../../context/ThemeContext';

interface PracticeMode {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  borderColor?: string;
  isAi?: boolean;
}

const PRACTICE_MODES: PracticeMode[] = [
  {
    id: 'quiz',
    title: 'Khảo Thí & Đánh Giá Năng Lực',
    description: 'Thi xếp lớp đầu vào (Placement), bài thi nâng cấp Level, đánh giá tốt nghiệp và luyện đề TOEIC.',
    tag: 'Chuẩn TOEIC',
    icon: 'school',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  {
    id: 'srs-cram',
    title: 'Cramming Mode (Ôn Siêu Tốc)',
    description: 'Ôn tập dồn toàn bộ từ vựng trước kỳ thi, bỏ qua chu kỳ giãn cách của thuật toán SM-2.',
    tag: 'Flashcard SRS',
    icon: 'flash',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  {
    id: 'word-rain',
    title: 'Word Rain (Mưa Từ Vựng)',
    description: 'Rèn luyện tốc độ gõ phím và phản xạ ghi nhớ từ vựng tiếng Anh theo thời gian thực.',
    tag: 'Gamification',
    icon: 'game-controller',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  {
    id: 'ai-voice',
    title: 'Luyện Nói Với AI Tutor',
    description: 'Thực hành giao tiếp tiếng Anh qua các tình huống giả lập với trợ lý AI thông minh.',
    tag: '✨ AI Native',
    icon: 'sparkles',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    borderColor: '#C084FC',
    isAi: true,
  },
];

export const PracticeMenuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, colors } = useTheme();

  const handleSelectMode = (mode: PracticeMode) => {
    if (mode.id === 'ai-voice') {
      navigation.navigate('VoiceScenarioSelect');
      return;
    }

    if (mode.id === 'word-rain') {
      navigation.navigate('WordRainDeckSelect');
      return;
    }

    if (mode.id === 'quiz') {
      navigation.navigate('AssessmentCenter');
      return;
    }

    if (mode.id === 'srs-cram') {
      navigation.navigate('FlashcardStudy', undefined);
      return;
    }

    Alert.alert(
      mode.title,
      `Tính năng ${mode.title} đang được kích hoạt và chuẩn bị ra mắt trong phiên bản kế tiếp.`
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trung Tâm Luyện Tập</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>
            Chọn chế độ rèn luyện từ vựng và phản xạ TOEIC chuyên sâu
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {PRACTICE_MODES.map((mode) => {
          const isAi = mode.isAi;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isAi
                    ? isDark ? '#6B21A8' : '#D8B4FE'
                    : colors.border,
                },
                isAi && styles.aiCardHighlight,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectMode(mode)}
            >
              {/* Icon Container */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark
                      ? isAi ? '#3B0764' : '#1E293B'
                      : mode.bgColor,
                    borderColor: mode.borderColor || '#E2E8F0',
                  },
                ]}
              >
                <Ionicons
                  name={mode.icon}
                  size={24}
                  color={isDark && isAi ? '#C084FC' : mode.color}
                />
              </View>

              {/* Mode Info */}
              <View style={styles.contentContainer}>
                <View style={styles.tagRow}>
                  <View
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor: isDark
                          ? isAi ? '#581C87' : '#334155'
                          : mode.bgColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: isDark && isAi ? '#E9D5FF' : mode.color },
                      ]}
                    >
                      {mode.tag}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.modeTitle, { color: colors.text }]}>{mode.title}</Text>
                <Text style={[styles.modeDescription, { color: colors.subtext }]} numberOfLines={2}>
                  {mode.description}
                </Text>
              </View>

              {/* Chevron Arrow */}
              <View style={styles.chevronWrapper}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#64748B' : '#94A3B8'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  container: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  aiCardHighlight: {
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  modeDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  chevronWrapper: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
