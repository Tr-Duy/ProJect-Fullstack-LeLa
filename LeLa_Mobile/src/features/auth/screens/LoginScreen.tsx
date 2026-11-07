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
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useTheme } from '../../../context/ThemeContext';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login, loginWithAuthResponse } = useAuth();
  const { isDark, colors } = useTheme();

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('doantruongduy');
  const [password, setPassword] = useState<string>('04122003Duy@');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginPress = async () => {
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc email và mật khẩu.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(usernameOrEmail, password);
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác.';
      setErrorMessage(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLoginPress = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const authData = await authService.loginWithGoogle();
      if (authData) {
        await loginWithAuthResponse(authData);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Đăng nhập Google thất bại hoặc đã bị hủy.';
      setErrorMessage(msg);
      Alert.alert('Đăng nhập Google', msg);
    } finally {
      setIsGoogleLoading(false);
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
          {/* Header & Logo */}
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
              Nền tảng Học Từ vựng & Khảo thí TOEIC Thông minh
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Đăng nhập tài khoản</Text>

            {/* Error Message */}
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#450A0A' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FCA5A5' }]}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Username/Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Tên đăng nhập hoặc Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={usernameOrEmail}
                  onChangeText={(val) => {
                    setUsernameOrEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Nhập username hoặc email"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mật khẩu</Text>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.subtext} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Nhập mật khẩu"
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

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.submitButton, (isSubmitting || isGoogleLoading) && styles.submitButtonDisabled]}
              onPress={handleLoginPress}
              disabled={isSubmitting || isGoogleLoading}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Đang xác thực...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Separator "HOẶC TIẾP TỤC VỚI" */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { backgroundColor: colors.card, color: colors.subtext }]}>
                HOẶC TIẾP TỤC VỚI
              </Text>
            </View>

            {/* Google OAuth Login Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                { backgroundColor: isDark ? '#334155' : '#FFFFFF', borderColor: isDark ? '#475569' : '#E2E8F0' },
                isGoogleLoading && styles.googleButtonDisabled,
              ]}
              onPress={handleGoogleLoginPress}
              disabled={isSubmitting || isGoogleLoading}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#EA580C" size="small" />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>Đang kết nối Google...</Text>
                </View>
              ) : (
                <View style={styles.googleContentRow}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>Đăng nhập bằng Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link Footer */}
            <View style={styles.registerFooterRow}>
              <Text style={[styles.footerText, { color: colors.subtext }]}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                <Text style={styles.registerLinkText}>Đăng ký ngay</Text>
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
    paddingVertical: 28,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
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
    marginTop: 6,
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
  dividerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    position: 'absolute',
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  googleButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  registerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  registerLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
});

export default LoginScreen;
