import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import subscriptionService, {
  ActiveSubscriptionDetail,
} from '../services/subscriptionService';
import { PaymentResponse } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SubscriptionManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [activeSub, setActiveSub] = useState<ActiveSubscriptionDetail | null>(null);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [subData, payList] = await Promise.all([
        subscriptionService.getMyActiveSubscriptions(),
        subscriptionService.getPaymentHistory(0, 30),
      ]);
      setActiveSub(subData);
      setPayments(payList);
    } catch (error) {
      console.error('[SubscriptionManagementScreen] Lỗi tải dữ liệu gói & hóa đơn:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const formatCurrency = (val?: number) => {
    if (typeof val !== 'number') return '0 đ';
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Vĩnh viễn';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    const upper = (status || '').toUpperCase();
    if (upper === 'PAID' || upper === 'COMPLETED' || upper === 'SUCCESS') {
      return {
        label: 'Đã thanh toán',
        bg: '#DCFCE7',
        color: '#16A34A',
        icon: 'checkmark-circle' as const,
      };
    }
    if (upper === 'PENDING') {
      return {
        label: 'Chờ thanh toán',
        bg: '#FFEDD5',
        color: '#EA580C',
        icon: 'time' as const,
      };
    }
    return {
      label: 'Đã hủy / Lỗi',
      bg: '#FEE2E2',
      color: '#DC2626',
      icon: 'close-circle' as const,
    };
  };

  const renderHeader = () => {
    const isVip = activeSub && activeSub.status === 'ACTIVE';

    return (
      <View style={styles.headerComponent}>
        {/* Active Subscription Banner Card */}
        <View style={[styles.subHeroCard, isVip ? styles.subHeroVip : styles.subHeroFree]}>
          <View style={styles.subHeroTop}>
            <View style={[styles.planIconCircle, isVip ? styles.planIconVip : styles.planIconFree]}>
              <Ionicons
                name={isVip ? 'diamond' : 'cube-outline'}
                size={26}
                color={isVip ? '#D97706' : '#0284C7'}
              />
            </View>
            <View style={styles.planTitleGroup}>
              <View style={styles.badgeRow}>
                <Text style={styles.planName}>{activeSub?.planName || 'Gói Miễn Phí'}</Text>
                <View style={[styles.statusPill, isVip ? styles.statusPillVip : styles.statusPillFree]}>
                  <Text style={[styles.statusPillText, isVip ? styles.statusPillTextVip : styles.statusPillTextFree]}>
                    {isVip ? 'ĐANG HOẠT ĐỘNG' : 'MIỄN PHÍ'}
                  </Text>
                </View>
              </View>
              <Text style={styles.planDesc}>{activeSub?.planDescription}</Text>
            </View>
          </View>

          {/* Thời hạn sử dụng */}
          <View style={styles.expiryBox}>
            <View style={styles.expiryRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.expiryLabel}>Thời hạn sử dụng:</Text>
              <Text style={styles.expiryValue}>
                {isVip
                  ? activeSub?.expiresAt
                    ? formatDate(activeSub.expiresAt)
                    : 'Vĩnh viễn (Trọn đời)'
                  : 'Không giới hạn thời gian'}
              </Text>
            </View>
            {isVip && activeSub?.daysRemaining !== undefined && (
              <View style={styles.remainingPill}>
                <Ionicons name="flame" size={13} color="#EA580C" />
                <Text style={styles.remainingPillText}>Còn {activeSub.daysRemaining} ngày</Text>
              </View>
            )}
          </View>

          {/* Quyền lợi mở khóa */}
          <View style={styles.perksContainer}>
            <Text style={styles.perksTitle}>Đặc quyền tài khoản hiện tại:</Text>
            {activeSub?.features?.map((perk, idx) => (
              <View key={idx} style={styles.perkRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={isVip ? '#16A34A' : '#0284C7'}
                  style={styles.perkIcon}
                />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          {/* Action Upgrade / Extend Button */}
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('SubscriptionPlans')}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.upgradeBtnText}>
              {isVip ? 'Gia Hạn / Nâng Cấp Gói VIP Mới' : 'Nâng Cấp Lên LeLa Pro Ngay'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Section Heading: Lịch sử giao dịch */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.historyIconCircle}>
              <Ionicons name="receipt-outline" size={18} color="#EA580C" />
            </View>
            <Text style={styles.sectionTitle}>Lịch Sử Giao Dịch Thanh Toán</Text>
          </View>
          <View style={styles.historyCountBadge}>
            <Text style={styles.historyCountText}>{payments.length} đơn</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentItem = ({ item }: { item: PaymentResponse }) => {
    const badge = getStatusBadge(item.status);
    const code = item.paymentCode || item.providerTransactionId || `LELA_PAY_${item.id}`;

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentCardHeader}>
          <View style={styles.payCodeGroup}>
            <View style={[styles.statusIconWrap, { backgroundColor: badge.bg }]}>
              <Ionicons name={badge.icon} size={18} color={badge.color} />
            </View>
            <View>
              <Text style={styles.payCodeText}>{code}</Text>
              <Text style={styles.payDateText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.payDivider} />

        <View style={styles.paymentCardFooter}>
          <View>
            <Text style={styles.footerLabel}>Hình thức thanh toán</Text>
            <Text style={styles.footerMethod}>
              {item.bankName ? `VietQR (${item.bankName})` : 'Chuyển khoản SePay'}
            </Text>
          </View>

          <View style={styles.amountGroup}>
            <Text style={styles.footerLabel}>Số tiền giao dịch</Text>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>Chưa có lịch sử giao dịch</Text>
        <Text style={styles.emptyDesc}>
          Khi bạn thực hiện mua gói cước hội viên qua VietQR SePay, các hóa đơn thanh toán sẽ tự động lưu lại tại đây.
        </Text>
        <TouchableOpacity
          style={styles.emptyExploreBtn}
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          <Text style={styles.emptyExploreText}>Khám phá các gói học LeLa Pro</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Đang tải thông tin gói & lịch sử mua hàng...</Text>
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
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Gói Hội Viên & Lịch Sử</Text>
          <Text style={styles.headerSubtitle}>Quản lý đặc quyền học tập & hóa đơn VietQR</Text>
        </View>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPaymentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerLoading: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#EA580C',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FED7AA',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerComponent: {
    marginBottom: 8,
  },
  subHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  subHeroVip: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF7',
  },
  subHeroFree: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  subHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  planIconVip: {
    backgroundColor: '#FEF3C7',
  },
  planIconFree: {
    backgroundColor: '#E0F2FE',
  },
  planTitleGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillVip: {
    backgroundColor: '#FEF3C7',
  },
  statusPillFree: {
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextVip: {
    color: '#B45309',
  },
  statusPillTextFree: {
    color: '#64748B',
  },
  planDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  expiryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  expiryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  expiryValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  remainingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remainingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  perksContainer: {
    marginBottom: 18,
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  perkIcon: {
    marginRight: 8,
  },
  perkText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  upgradeBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payCodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  payDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  paymentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  footerMethod: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  amountGroup: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyExploreBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyExploreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SubscriptionManagementScreen;

