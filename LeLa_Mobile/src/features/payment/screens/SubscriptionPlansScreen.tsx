import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import paymentService from '../services/paymentService';
import { SubscriptionPlanResponse, UserSubscriptionResponse } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SubscriptionPlans'>;

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, subsData] = await Promise.all([
        paymentService.getSubscriptionPlans(),
        paymentService.getMySubscriptions(0, 5).catch(() => ({ content: [] })),
      ]);

      // Sắp xếp các gói theo thứ tự displayOrder hoặc id
      const sortedPlans = (plansData || []).sort(
        (a, b) => (a.displayOrder ?? a.id) - (b.displayOrder ?? b.id)
      );
      setPlans(sortedPlans);

      // Tìm gói đang ACTIVE
      const currentActive = (subsData?.content || []).find((s) => s.status === 'ACTIVE');
      if (currentActive) {
        setActiveSubscription(currentActive);
      }
    } catch (error: any) {
      console.error('Lỗi tải danh sách gói cước:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách gói cước. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlanResponse) => {
    if (activeSubscription && activeSubscription.planId === plan.id) {
      Alert.alert('Thông báo', 'Bạn hiện đang sử dụng gói hội viên này.');
      return;
    }

    try {
      setPurchasingPlanId(plan.id);
      const checkout = await paymentService.createCheckout(plan.id);
      navigation.navigate('PaymentQr', { checkoutData: checkout });
    } catch (error: any) {
      console.error('Lỗi khởi tạo đơn hàng thanh toán:', error);
      const msg = error.response?.data?.message || 'Không thể tạo đơn hàng thanh toán. Vui lòng thử lại.';
      Alert.alert('Thanh toán thất bại', msg);
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle?.toUpperCase()) {
      case 'MONTHLY':
        return '/tháng';
      case 'QUARTERLY':
        return '/3 tháng';
      case 'YEARLY':
        return '/năm';
      case 'LIFETIME':
        return 'trọn đời';
      default:
        return '';
    }
  };

  const parseFeatures = (plan: SubscriptionPlanResponse): string[] => {
    if (plan.featuresJson) {
      try {
        const parsed = JSON.parse(plan.featuresJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback sang cấu hình mặc định
      }
    }

    const defaultFeatures: string[] = [];
    if (plan.maxCardsPerDeck && plan.maxCardsPerDeck > 0) {
      defaultFeatures.push(`Lên đến ${plan.maxCardsPerDeck} từ/bộ thẻ`);
    } else {
      defaultFeatures.push('Không giới hạn từ vựng mỗi bộ thẻ');
    }

    if (plan.maxDailyReviews && plan.maxDailyReviews > 0) {
      defaultFeatures.push(`Ôn tập tối đa ${plan.maxDailyReviews} thẻ/ngày`);
    } else {
      defaultFeatures.push('Ôn tập Flashcard SM-2 không giới hạn');
    }

    if (plan.quizEnabled) {
      defaultFeatures.push('Mở khóa toàn bộ đề thi TOEIC & Mock Tests');
    }
    if (plan.leaderboardEnabled) {
      defaultFeatures.push('Vinh danh Bảng xếp hạng thi đua tuần & tháng');
    }
    if (plan.offlineEnabled) {
      defaultFeatures.push('Chế độ học Offline không cần kết nối mạng');
    }

    defaultFeatures.push('Luyện nói 2 chiều với Gia sư AI chuẩn bản xứ');
    defaultFeatures.push('Trò chơi luyện gõ Word Rain không giới hạn');
    defaultFeatures.push('Hỗ trợ giải đáp thắc mắc ưu tiên 24/7');

    return defaultFeatures;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Đang tải danh sách gói hội viên...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nâng cấp Hội viên</Text>
          <Text style={styles.headerSubtitle}>Mở khóa toàn bộ tiềm năng học tiếng Anh</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner giới thiệu */}
        <View style={styles.vipBanner}>
          <View style={styles.vipBadge}>
            <Ionicons name="sparkles" size={16} color="#F59E0B" />
            <Text style={styles.vipBadgeText}>LeLa Premium Pass</Text>
          </View>
          <Text style={styles.vipTitle}>Bứt phá tiếng Anh cùng AI</Text>
          <Text style={styles.vipDesc}>
            Trải nghiệm lộ trình học thông minh, ôn luyện Spaced Repetition tối ưu và trò chuyện phản xạ 1:1 với Gia sư AI.
          </Text>
        </View>

        {/* Danh sách các gói */}
        <View style={styles.plansList}>
          {plans.map((plan, index) => {
            const isCurrentActive = activeSubscription?.planId === plan.id;
            const isPopular = plan.planCode?.toUpperCase().includes('PRO') || index === 1;
            const isPurchasing = purchasingPlanId === plan.id;
            const features = parseFeatures(plan);

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isPopular && styles.popularPlanCard,
                  isCurrentActive && styles.activePlanCard,
                ]}
              >
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>PHỔ BIẾN NHẤT</Text>
                  </View>
                )}

                {isCurrentActive && (
                  <View style={styles.currentActiveBadge}>
                    <Text style={styles.currentActiveBadgeText}>GÓI HIỆN TẠI</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>

                {/* Giá tiền */}
                <View style={styles.priceContainer}>
                  <Text style={styles.priceAmount}>{formatPrice(plan.price)}</Text>
                  <Text style={styles.priceCycle}>{getBillingCycleText(plan.billingCycle)}</Text>
                </View>

                {/* Phân cách */}
                <View style={styles.divider} />

                {/* Danh sách tính năng */}
                <View style={styles.featuresList}>
                  {features.map((feature, fIndex) => (
                    <View key={fIndex} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Nút hành động */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isPopular && styles.popularActionButton,
                    isCurrentActive && styles.disabledActionButton,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={isCurrentActive || isPurchasing}
                  activeOpacity={0.8}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Ionicons
                        name={isCurrentActive ? 'checkmark-done' : 'card-outline'}
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionButtonText}>
                        {isCurrentActive ? 'Đang sử dụng' : 'Nâng cấp ngay'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Cam kết & Bảo mật */}
        <View style={styles.guaranteeContainer}>
          <View style={styles.guaranteeItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
            <Text style={styles.guaranteeText}>Thanh toán VietQR an toàn qua cổng SePay</Text>
          </View>
          <View style={styles.guaranteeItem}>
            <Ionicons name="flash-outline" size={20} color="#6B7280" />
            <Text style={styles.guaranteeText}>Kích hoạt tự động ngay sau khi chuyển khoản</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  vipBanner: {
    backgroundColor: '#312E81',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  vipBadgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  vipTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  vipDesc: {
    fontSize: 13,
    color: '#C7D2FE',
    lineHeight: 18,
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  popularPlanCard: {
    borderColor: '#6366F1',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  activePlanCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  currentActiveBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  planDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4F46E5',
  },
  priceCycle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 10,
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularActionButton: {
    backgroundColor: '#6366F1',
  },
  disabledActionButton: {
    backgroundColor: '#94A3B8',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  guaranteeContainer: {
    marginTop: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
});
