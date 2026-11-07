import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { VoiceReportResponse } from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'VoiceReport'>;
type RouteProps = RouteProp<RootStackParamList, 'VoiceReport'>;

export const VoiceReportScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { report, scenarioTitle } = route.params || {};

  const handleRetake = () => {
    navigation.replace('VoiceScenarioSelect');
  };

  const handleBackHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const isLevelUp = (report?.newLevel || 0) > (report?.oldLevel || 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackHome} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh Giá Đàm Thoại AI</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 2. Thẻ Hero Điểm số tổng quát */}
        <View style={styles.heroCard}>
          <View style={styles.aiTagBadge}>
            <Ionicons name="sparkles" size={14} color="#16a34a" />
            <Text style={styles.aiTagText}>Báo cáo từ AI Tutor</Text>
          </View>

          <Text style={styles.scenarioHeading} numberOfLines={2}>
            {scenarioTitle || 'Tình huống đàm thoại'}
          </Text>

          {/* Vòng tròn điểm Overall Score */}
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{report?.overallScore ?? 85}</Text>
            <Text style={styles.scoreScale}>/ 100 điểm</Text>
          </View>

          {/* Huy hiệu Thăng cấp */}
          {isLevelUp && (
            <View style={styles.levelUpBanner}>
              <Ionicons name="trending-up" size={18} color="#16a34a" />
              <Text style={styles.levelUpText}>
                Chúc mừng bạn đã thăng cấp hội thoại lên Level {report?.newLevel}!
              </Text>
            </View>
          )}

          {/* Điểm thành phần: Grammar, Vocabulary, Fluency */}
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-done" size={18} color="#16a34a" />
              </View>
              <Text style={styles.breakdownValue}>{report?.grammarScore ?? 80}%</Text>
              <Text style={styles.breakdownLabel}>Ngữ pháp</Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="book-outline" size={18} color="#0284c7" />
              </View>
              <Text style={styles.breakdownValue}>{report?.vocabularyScore ?? 85}%</Text>
              <Text style={styles.breakdownLabel}>Vốn từ vựng</Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIconBox, { backgroundColor: '#ffedd5' }]}>
                <Ionicons name="speedometer-outline" size={18} color="#ea580c" />
              </View>
              <Text style={styles.breakdownValue}>{report?.fluencyScore ?? 90}%</Text>
              <Text style={styles.breakdownLabel}>Độ trôi chảy</Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="star" size={18} color="#d97706" />
              </View>
              <Text style={styles.breakdownValue}>+{report?.xpAwarded ?? 50}</Text>
              <Text style={styles.breakdownLabel}>XP thưởng</Text>
            </View>
          </View>
        </View>

        {/* 3. Nhận xét chi tiết từ AI Tutor */}
        {report?.userFeedback && (
          <View style={styles.feedbackSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#16a34a" />
              <Text style={styles.sectionTitle}>Nhận xét của AI Tutor</Text>
            </View>
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackContent}>{report.userFeedback}</Text>
            </View>
          </View>
        )}

        {/* 4. Các từ vựng mục tiêu đã áp dụng */}
        {report?.targetWords && report.targetWords.length > 0 && (
          <View style={styles.feedbackSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="layers-outline" size={18} color="#0284c7" />
              <Text style={styles.sectionTitle}>Từ vựng mục tiêu trong bài</Text>
            </View>

            <View style={styles.targetWordsGrid}>
              {report.targetWords.map((tw, idx) => (
                <View
                  key={tw.flashcardId || idx}
                  style={[
                    styles.targetWordCard,
                    tw.usedCorrectly && styles.targetWordCardUsed,
                  ]}
                >
                  <View style={styles.targetWordRow}>
                    <Text style={styles.targetWordText}>{tw.word}</Text>
                    <Ionicons
                      name={tw.usedCorrectly ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={tw.usedCorrectly ? '#16a34a' : '#94a3b8'}
                    />
                  </View>
                  {tw.meaning ? (
                    <Text style={styles.targetWordMeaning}>{tw.meaning}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Chi tiết góp ý sửa lỗi ngữ pháp (Corrections) */}
        {report?.corrections && report.corrections.length > 0 && (
          <View style={styles.feedbackSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct-outline" size={18} color="#d97706" />
              <Text style={styles.sectionTitle}>Điểm cần cải thiện & Câu mẫu chuẩn</Text>
            </View>

            {report.corrections.map((corr, idx) => (
              <View key={idx} style={styles.correctionCard}>
                <View style={styles.correctionTurnBadge}>
                  <Text style={styles.correctionTurnText}>Lượt {corr.turnNumber}</Text>
                </View>

                {/* Câu gốc của người học */}
                <View style={styles.correctionSentenceRow}>
                  <Text style={styles.sentenceLabel}>Bạn nói:</Text>
                  <Text style={styles.originalText}>"{corr.originalTranscript}"</Text>
                </View>

                {/* Câu chuẩn từ AI */}
                {corr.correctedText ? (
                  <View style={styles.correctionSentenceRow}>
                    <Text style={[styles.sentenceLabel, { color: '#16a34a' }]}>Chuẩn tự nhiên:</Text>
                    <View style={styles.correctedTextBox}>
                      <Text style={styles.correctedText}>"{corr.correctedText}"</Text>
                      <TouchableOpacity
                        style={styles.speechIconBtn}
                        onPress={() => Speech.speak(corr.correctedText!, { language: 'en-US' })}
                      >
                        <Ionicons name="volume-high" size={16} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Danh sách lỗi nếu có */}
                {corr.errors && corr.errors.length > 0 && (
                  <View style={styles.errorsContainer}>
                    {corr.errors.map((e, eIdx) => (
                      <View key={eIdx} style={styles.errorPill}>
                        <Ionicons name="alert-circle" size={12} color="#dc2626" />
                        <Text style={styles.errorPillText}>{e}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 6. Nút hành động */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#ffffff" />
            <Text style={styles.retakeBtnText}>Luyện tình huống khác</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} onPress={handleBackHome} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={18} color="#16a34a" />
            <Text style={styles.homeBtnText}>Quay về menu chính</Text>
          </TouchableOpacity>
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
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  aiTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  scenarioHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0fdf4',
    borderWidth: 6,
    borderColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#16a34a',
  },
  scoreScale: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  levelUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 6,
    marginBottom: 16,
  },
  levelUpText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  feedbackSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedbackContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  targetWordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetWordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: '48%',
    flex: 1,
  },
  targetWordCardUsed: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  targetWordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetWordText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  targetWordMeaning: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  correctionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  correctionTurnBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  correctionTurnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  correctionSentenceRow: {
    marginBottom: 6,
  },
  sentenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  originalText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  correctedTextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  correctedText: {
    flex: 1,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '700',
  },
  speechIconBtn: {
    padding: 4,
    marginLeft: 6,
  },
  errorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  errorPillText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 10,
    gap: 12,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    gap: 8,
  },
  homeBtnText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '700',
  },
});

