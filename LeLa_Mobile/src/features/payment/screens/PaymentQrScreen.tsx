import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import paymentService from '../services/paymentService';
import { useAuth } from '../../auth/context/AuthContext';

type PaymentQrRouteProp = RouteProp<RootStackParamList, 'PaymentQr'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentQr'>;

// Danh bạ ngân hàng chuẩn NAPAS / VietQR
interface BankInfo {
  code: string;
  name: string;
  bin: string;
}

const BANK_DIRECTORY: Record<string, BankInfo> = {
  MB: { code: 'MB', name: 'MB Bank (Ngân hàng TMCP Quân Đội)', bin: '970422' },
  MBBANK: { code: 'MB', name: 'MB Bank (Ngân hàng TMCP Quân Đội)', bin: '970422' },
  OCB: { code: 'OCB', name: 'OCB (Ngân hàng TMCP Phương Đông)', bin: '970448' },
  VCB: { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)', bin: '970436' },
  VIETCOMBANK: { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)', bin: '970436' },
  TCB: { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)', bin: '970407' },
  TECHCOMBANK: { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)', bin: '970407' },
  VPB: { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)', bin: '970432' },
  VPBANK: { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)', bin: '970432' },
  ACB: { code: 'ACB', name: 'ACB (Ngân hàng TMCP Á Châu)', bin: '970416' },
  ICB: { code: 'ICB', name: 'VietinBank (Công Thương Việt Nam)', bin: '970415' },
  VIETINBANK: { code: 'ICB', name: 'VietinBank (Công Thương Việt Nam)', bin: '970415' },
  BIDV: { code: 'BIDV', name: 'BIDV (Đầu tư và Phát triển VN)', bin: '970418' },
  TPB: { code: 'TPB', name: 'TPBank (Tiên Phong)', bin: '970423' },
  TPBANK: { code: 'TPB', name: 'TPBank (Tiên Phong)', bin: '970423' },
};

export default function PaymentQrScreen() {
  const route = useRoute<PaymentQrRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { refreshProfile } = useAuth();
  const { checkoutData } = route.params;

  // Xác định thông tin ngân hàng thụ hưởng đồng bộ 100%
  const rawBankName = (checkoutData.bankName || 'MB').trim();
  const normalizedKey = rawBankName.toUpperCase().replace(/[^A-Z]/g, '');
  const bankConfig: BankInfo = BANK_DIRECTORY[normalizedKey] || {
    code: rawBankName,
    name: `${rawBankName} Bank`,
    bin: '970422', // Fallback MB Bank
  };

  const beneficiaryAccount = (checkoutData.bankAccountNumber && checkoutData.bankAccountNumber.trim() !== '')
    ? checkoutData.bankAccountNumber.trim()
    : '0339999999';

  const beneficiaryName = (checkoutData.bankAccountName && checkoutData.bankAccountName.trim() !== '')
    ? checkoutData.bankAccountName.trim().toUpperCase()
    : 'CONG TY LELA';

  const paymentCode = checkoutData.paymentCode || '';
  const amount = checkoutData.amount || 0;

  // Trạng thái mã QR (Base64 data URL)
  const [qrBase64Image, setQrBase64Image] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>(checkoutData.status || 'PENDING');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState<boolean>(false);
  const [isCheckingManual, setIsCheckingManual] = useState<boolean>(false);

  // Đếm ngược 5 phút (300 giây) theo đúng yêu cầu
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Gọi API sinh mã VietQR thuần túy (qr_only không kèm viền/khung app ngân hàng ngoài)
  const fetchPureVietQr = useCallback(async () => {
    setIsGeneratingQr(true);
    try {
      const response = await fetch('https://api.vietqr.io/v2/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LeLaMobileApp/1.0',
        },
        body: JSON.stringify({
          accountNo: beneficiaryAccount,
          accountName: beneficiaryName,
          acqId: bankConfig.bin,
          amount: amount,
          addInfo: paymentCode,
          format: 'text',
          template: 'qr_only', // Chỉ lấy mã QR vuông vắn thuần túy
        }),
      });

      const data = await response.json();
      if (data && data.code === '00' && data.data?.qrDataURL) {
        setQrBase64Image(data.data.qrDataURL);
      } else {
        // Fallback sang QR generator tiêu chuẩn nếu VietQR bận
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
          `https://img.vietqr.io/image/${bankConfig.code}-${beneficiaryAccount}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(
            paymentCode
          )}&accountName=${encodeURIComponent(beneficiaryName)}`
        )}`;
        setQrBase64Image(fallbackUrl);
      }
    } catch (error) {
      console.warn('Lỗi gọi API VietQR generate, chuyển sang fallback URL:', error);
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
        `00020101021238540010A00000072701240006${bankConfig.bin}0110${beneficiaryAccount}0208QRIBFTTA5303704540${amount}5802VN62${paymentCode.length + 4}08${paymentCode.length}${paymentCode}6304`
      )}`;
      setQrBase64Image(fallbackUrl);
    } finally {
      setIsGeneratingQr(false);
    }
  }, [beneficiaryAccount, beneficiaryName, bankConfig, amount, paymentCode]);

  useEffect(() => {
    fetchPureVietQr();
  }, [fetchPureVietQr]);

  // 2. Bộ đếm ngược 5 phút
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          stopPolling();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 3. Polling ngầm trạng thái thanh toán từ SePay Webhook
  useEffect(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  const startPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await paymentService.getPaymentStatus(checkoutData.paymentId);
        if (status === 'COMPLETED' || status === 'PAID' || status === 'SUCCEEDED') {
          handlePaymentSuccess();
        } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
          setPaymentStatus(status);
          stopPolling();
        }
      } catch (error) {
        // Lỗi tạm thời mạng khi polling - thử lại ở nhịp tiếp theo
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handlePaymentSuccess = async () => {
    stopPolling();
    setPaymentStatus('COMPLETED');
    setIsSuccessModalVisible(true);

    try {
      Speech.speak('Thanh toán thành công! Chúc mừng bạn đã nâng cấp gói hội viên LeLa.', {
        language: 'vi-VN',
        rate: 1.0,
      });
    } catch (e) {
      // Ignored
    }

    if (refreshProfile) {
      try {
        await refreshProfile();
      } catch (e) {
        // Ignored
      }
    }
  };

  const handleManualCheck = async () => {
    try {
      setIsCheckingManual(true);
      const status = await paymentService.getPaymentStatus(checkoutData.paymentId);
      if (status === 'COMPLETED' || status === 'PAID' || status === 'SUCCEEDED') {
        handlePaymentSuccess();
      } else {
        Alert.alert(
          'Đang chờ thanh toán',
          'Hệ thống chưa nhận được thông báo chuyển khoản cho mã này. Vui lòng kiểm tra lại số tiền và nội dung chuyển khoản rồi chờ trong giây lát.'
        );
      }
    } catch (error: any) {
      Alert.alert('Thông báo', 'Hệ thống đang kiểm tra lại giao dịch, vui lòng thử lại sau vài giây.');
    } finally {
      setIsCheckingManual(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      Alert.alert('Đã sao chép', text);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const handleFinish = () => {
    setIsSuccessModalVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Xác nhận quay lại',
              'Đơn hàng thanh toán của bạn vẫn được lưu trong hệ thống. Bạn có chắc muốn quay lại?',
              [
                { text: 'Ở lại', style: 'cancel' },
                { text: 'Quay lại', onPress: () => navigation.goBack() },
              ]
            );
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Thanh toán VietQR</Text>
          <Text style={styles.headerSubtitle}>Tự động kích hoạt gói trong 30 giây</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Countdown 5 Minutes Banner */}
        <View style={styles.countdownBanner}>
          <Ionicons name="time-outline" size={20} color="#EA580C" />
          <Text style={styles.countdownText}>
            Đơn hàng hết hạn sau: <Text style={styles.countdownHighlight}>{formatTimer(timeLeftSeconds)}</Text>
          </Text>
        </View>

        {/* Khung Mã QR Thuần Túy (Pure VietQR) */}
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <View style={styles.vietQrBadge}>
              <Text style={styles.vietQrBadgeText}>VietQR • NAPAS 247</Text>
            </View>
            <Text style={styles.qrInstructions}>
              Quét mã bằng ứng dụng {bankConfig.name.split(' ')[0]} hoặc ngân hàng bất kỳ
            </Text>
          </View>

          {/* Vùng Render Mã QR Sạch Sẽ */}
          <View style={styles.qrImageFrame}>
            {isGeneratingQr ? (
              <View style={styles.qrLoadingBox}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.qrLoadingText}>Đang tạo mã VietQR chuẩn...</Text>
              </View>
            ) : qrBase64Image ? (
              <Image
                source={{ uri: qrBase64Image }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrLoadingBox}>
                <Ionicons name="qr-code-outline" size={64} color="#94A3B8" />
                <Text style={styles.qrLoadingText}>Chuyển khoản theo thông tin bên dưới</Text>
              </View>
            )}
          </View>

          {/* Status Bar Polling Real-time */}
          <View style={styles.pollingStatusContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.pollingStatusText}>Đang chờ xác nhận chuyển khoản...</Text>
          </View>
        </View>

        {/* Chi tiết chuyển khoản & Sao chép nhanh */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Thông tin chuyển khoản chính xác 100%</Text>
          <Text style={styles.detailsNotice}>
            Vui lòng nhập đúng Số tiền và Nội dung chuyển khoản để hệ thống tự động duyệt.
          </Text>

          {/* Ngân hàng thụ hưởng (Khớp 100% với mã QR) */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Text style={styles.infoLabel}>Ngân hàng thụ hưởng</Text>
              <Text style={styles.bankNameHighlight}>{bankConfig.name}</Text>
            </View>
            <View style={styles.bankTag}>
              <Text style={styles.bankTagText}>{bankConfig.code}</Text>
            </View>
          </View>

          {/* Số tài khoản & Nút sao chép */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Text style={styles.infoLabel}>Số tài khoản thụ hưởng</Text>
              <Text style={styles.accountNumberText}>{beneficiaryAccount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, copiedField === 'account' && styles.copyButtonActive]}
              onPress={() => copyToClipboard(beneficiaryAccount, 'account')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedField === 'account' ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copiedField === 'account' ? '#10B981' : '#4F46E5'}
              />
              <Text
                style={[
                  styles.copyButtonText,
                  copiedField === 'account' && styles.copyButtonTextActive,
                ]}
              >
                {copiedField === 'account' ? 'Đã sao chép' : 'Sao chép STK'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chủ tài khoản (Chính xác theo doanh nghiệp thụ hưởng) */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Text style={styles.infoLabel}>Chủ tài khoản thụ hưởng</Text>
              <Text style={styles.beneficiaryNameText}>{beneficiaryName}</Text>
            </View>
          </View>

          {/* Số tiền cần chuyển */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelGroup}>
              <Text style={styles.infoLabel}>Số tiền cần chuyển</Text>
              <Text style={styles.amountText}>{formatVND(amount)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, copiedField === 'amount' && styles.copyButtonActive]}
              onPress={() => copyToClipboard(String(amount), 'amount')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedField === 'amount' ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copiedField === 'amount' ? '#10B981' : '#4F46E5'}
              />
              <Text
                style={[
                  styles.copyButtonText,
                  copiedField === 'amount' && styles.copyButtonTextActive,
                ]}
              >
                {copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép tiền'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* NỘI DUNG CHUYỂN KHOẢN (MEMO QUAN TRỌNG NHẤT) */}
          <View style={styles.memoBox}>
            <View style={styles.memoHeader}>
              <Ionicons name="alert-circle" size={18} color="#D97706" />
              <Text style={styles.memoTitle}>Nội dung chuyển khoản (Bắt buộc giữ nguyên)</Text>
            </View>
            <View style={styles.memoRow}>
              <Text style={styles.memoCodeText}>{paymentCode}</Text>
              <TouchableOpacity
                style={styles.copyMemoButton}
                onPress={() => copyToClipboard(paymentCode, 'memo')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedField === 'memo' ? 'checkmark' : 'copy'}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.copyMemoButtonText}>
                  {copiedField === 'memo' ? 'Đã sao chép' : 'Sao chép mã'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.memoNoticeText}>
              Hệ thống tự động duyệt gói ngay sau khi nhận được chuyển khoản có mã {paymentCode}.
            </Text>
          </View>
        </View>

        {/* Nút kiểm tra trạng thái thủ công */}
        <TouchableOpacity
          style={styles.manualCheckButton}
          onPress={handleManualCheck}
          disabled={isCheckingManual}
          activeOpacity={0.8}
        >
          {isCheckingManual ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <View style={styles.manualCheckInner}>
              <Ionicons name="refresh-outline" size={20} color="#4F46E5" />
              <Text style={styles.manualCheckButtonText}>Tôi đã chuyển khoản thành công</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Chúc Mừng Thanh Toán Thành Công */}
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Thanh toán thành công!</Text>
            <Text style={styles.successDesc}>
              Gói cước <Text style={styles.boldText}>{checkoutData.planName}</Text> của bạn đã được kích hoạt thành công.
            </Text>
            <View style={styles.successDetailBox}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Mã giao dịch:</Text>
                <Text style={styles.successDetailVal}>{paymentCode}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Số tiền:</Text>
                <Text style={styles.successDetailVal}>{formatVND(amount)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleFinish} activeOpacity={0.85}>
              <Text style={styles.confirmButtonText}>Bắt đầu trải nghiệm ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  countdownText: {
    fontSize: 13,
    color: '#9A3412',
    fontWeight: '500',
  },
  countdownHighlight: {
    fontWeight: '800',
    color: '#EA580C',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  vietQrBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  vietQrBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  qrInstructions: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  qrImageFrame: {
    width: 260,
    height: 260,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrLoadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  qrLoadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  pollingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  pollingStatusText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  detailsNotice: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 17,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabelGroup: {
    flex: 1,
    paddingRight: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  bankNameHighlight: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  bankTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bankTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  accountNumberText: {
    fontSize: 17,
    color: '#1E293B',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  beneficiaryNameText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  amountText: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: '800',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  copyButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  copyButtonTextActive: {
    color: '#10B981',
  },
  memoBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  memoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  memoTitle: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
  },
  memoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  memoCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1,
  },
  copyMemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 4,
  },
  copyMemoButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  memoNoticeText: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 8,
    lineHeight: 16,
  },
  manualCheckButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCheckInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualCheckButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  successIconWrapper: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  successDetailBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  successDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
