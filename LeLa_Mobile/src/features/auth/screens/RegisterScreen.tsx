import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { useTheme } from '../../../context/ThemeContext';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark, colors } = useTheme();

  // Form states
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Visibility states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return false;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setErrorMessage('Tên đăng nhập phải từ 3 đến 30 ký tự.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Định dạng email không hợp lệ (ví dụ: name@example.com).');
      return false;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu cần tối thiểu 8 ký tự để đảm bảo an toàn.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await authService.register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim() || username.trim(),
        password,
      });

      Alert.alert(
        'Đăng ký thành công! 🎉',
        'Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để bắt đầu hành trình chinh phục tiếng Anh cùng LeLa.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ]
      );
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Đăng ký không thành công. Tên đăng nhập hoặc email có thể đã được sử dụng.';
      setErrorMessage(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo Brand */}
          <View style={styles.headerContainer}>
            <View
              style={[
                styles.logoBadge,
                { backgroundColor: isDark ? '#431407' : '#FFEDD5', borderColor: isDark ? '#9A3412' : '#FED7AA' },
              ]}
            >
              <Ionicons name="school" size={40} color="#EA580C" />
            </View>
            <Text style={styles.brandTitle}>LeLa English</Text>
            <Text style={[styles.brandSubtitle, { color: colors.subtext }]}>
              Tạo tài khoản mới để bắt đầu học từ vựng & luyện thi TOEIC cùng AI
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Đăng ký tài khoản</Text>

            {/* Thông báo lỗi nếu có */}
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#450A0A' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FCA5A5' }]}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Trường 1: Tên đăng nhập */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Tên đăng nhập <Text style={styles.requiredMark}>*</Text></Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ví dụ: lela_learner"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Trường 2: Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Địa chỉ Email <Text style={styles.requiredMark}>*</Text></Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Trường 3: Họ và tên */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Họ và tên hiển thị</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="id-card-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>

            {/* Trường 4: Mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mật khẩu <Text style={styles.requiredMark}>*</Text></Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Tối thiểu 8 ký tự"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.subtext}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Trường 5: Xác nhận mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Xác nhận mật khẩu <Text style={styles.requiredMark}>*</Text></Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.subtext}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút Đăng ký */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Đang tạo tài khoản...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Đăng ký ngay</Text>
              )}
            </TouchableOpacity>

            {/* Chân Card: Chuyển về Đăng nhập */}
            <View style={styles.footerLinkRow}>
              <Text style={[styles.footerText, { color: colors.subtext }]}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  flexOne: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#EA580C',
    fontWeight: '800',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#EA580C',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#FDBA74',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
});

export default RegisterScreen;

