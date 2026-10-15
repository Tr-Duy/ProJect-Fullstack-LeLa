import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  GlobalOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordStrength } from '../components/PasswordStrength';
import { apiClient } from '../../../shared/lib/api';
import { authApi } from '../api/auth.api';
import { languagesApi } from '../../master-data/api/languages.api';
import { celebrate } from '../../../ui/motion/celebrate';
import type { LelaMood } from '../../../shared/components/ui/Lela';

export function RegisterPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetLanguageId, setTargetLanguageId] = useState<number | undefined>(undefined);
  const [nativeLanguageId, setNativeLanguageId] = useState<number | undefined>(undefined);

  // Field validation & availability states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password visibility & CapsLock
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // UI & Submission state
  const [focusedField, setFocusedField] = useState<'username' | 'fullName' | 'email' | 'password' | 'confirmPassword' | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch languages
  const { data: languagesData, isLoading: isLoadingLangs } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.getAll(),
  });

  const languages = languagesData?.data || [];

  // Automatically select English (en) for target and Vietnamese (vi) for native
  useEffect(() => {
    if (languages.length > 0) {
      if (!targetLanguageId) {
        const enLang = languages.find((l) => l.languageCode?.toLowerCase() === 'en');
        if (enLang) setTargetLanguageId(enLang.id);
        else setTargetLanguageId(languages[0].id);
      }
      if (!nativeLanguageId) {
        const viLang = languages.find((l) => l.languageCode?.toLowerCase() === 'vi');
        if (viLang) setNativeLanguageId(viLang.id);
        else setNativeLanguageId(languages[0].id);
      }
    }
  }, [languages, targetLanguageId, nativeLanguageId]);

  // Username live check debounced
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 30) {
      setUsernameStatus('invalid');
      setUsernameError('Tên đăng nhập từ 3 - 30 ký tự.');
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9._]{2,29}$/.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameError('Bắt đầu bằng chữ cái, chỉ chứa chữ, số, dấu chấm/gạch dưới.');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const exists = await authApi.checkUsername(trimmed);
        if (exists) {
          setUsernameStatus('invalid');
          setUsernameError('Tên đăng nhập này đã có người sử dụng.');
        } else {
          setUsernameStatus('valid');
          setUsernameError(null);
        }
      } catch {
        setUsernameStatus('valid');
        setUsernameError(null);
      }
    }, 400);

    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    };
  }, [username]);

  // Email live check debounced
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailStatus('idle');
      setEmailError(null);
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailStatus('invalid');
      setEmailError('Định dạng email chưa hợp lệ.');
      return;
    }

    setEmailStatus('checking');
    setEmailError(null);

    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    emailTimerRef.current = setTimeout(async () => {
      try {
        const exists = await authApi.checkEmail(trimmed.toLowerCase());
        if (exists) {
          setEmailStatus('invalid');
          setEmailError('Email này đã được sử dụng.');
        } else {
          setEmailStatus('valid');
          setEmailError(null);
        }
      } catch {
        setEmailStatus('valid');
        setEmailError(null);
      }
    }, 400);

    return () => {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, [email]);

  // Mascot mood
  let lelaMood: LelaMood = 'idle';
  if (isSuccess) {
    lelaMood = 'cheer';
  } else if (errorMessage) {
    lelaMood = 'sad';
  } else if (focusedField === 'password') {
    lelaMood = showPassword ? 'peek' : 'cover';
  } else if (focusedField === 'confirmPassword') {
    lelaMood = showConfirmPassword ? 'peek' : 'cover';
  } else {
    lelaMood = 'idle';
  }

  // Mascot pupil offset based on typing length
  const activeLen = focusedField === 'email' ? email.length : username.length;
  const lelaPupilOffset = Math.max(-4, Math.min(4, (activeLen - 4) * 0.7));

  const handleKeyEvents = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 350);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSuccess) return;

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim() || trimmedUsername;

    // Local validation
    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      triggerShake();
      return;
    }

    if (usernameStatus === 'invalid') {
      setErrorMessage(usernameError || 'Tên đăng nhập không hợp lệ.');
      triggerShake();
      return;
    }

    if (emailStatus === 'invalid') {
      setErrorMessage(emailError || 'Email không hợp lệ.');
      triggerShake();
      return;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?])(?=\S+$).{8,100}$/;
    if (!passwordPattern.test(password)) {
      setErrorMessage('Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      triggerShake();
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload = {
        username: trimmedUsername,
        email: trimmedEmail.toLowerCase(),
        password,
        fullName: trimmedFullName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
        nativeLanguageId: nativeLanguageId || 2,
        targetLanguageId: targetLanguageId || 1,
        dailyGoalCards: 20,
      };

      const res = await apiClient.post('/auth/register', payload);
      if (res.data.success) {
        setIsSuccess(true);
        celebrate({ eventKey: 'register-success-celebrate' });

        setTimeout(() => {
          navigate('/login', {
            state: {
              registeredUsername: trimmedUsername,
              registeredPassword: password,
            },
          });
        }, 800);
      } else {
        throw new Error(res.data.message || 'Đăng ký không thành công');
      }
    } catch (err: any) {
      triggerShake();
      if (!err.response) {
        setErrorMessage('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.');
      } else {
        setErrorMessage(err.response.data?.message || 'Đăng ký không thành công. Bạn vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout lelaMood={lelaMood} lelaPupilOffset={lelaPupilOffset} backTo="/" backText="Về trang chủ">
      <motion.div
        initial={reduce ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={`space-y-5 ${isShaking ? 'shake-card' : ''}`}
      >
        {/* Header */}
        <div className="space-y-1 text-left">
          <h2 className="font-display font-semibold text-[1.75rem] sm:text-[1.875rem] text-[var(--text)] tracking-tight leading-tight">
            Tạo tài khoản
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
            Bắt đầu hành trình chinh phục từ vựng TOEIC cùng LeLa.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* Username */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="reg-username" className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
                Tên đăng nhập <span className="text-[var(--danger)]">*</span>
              </label>
              {usernameStatus === 'checking' && (
                <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1">
                  <LoadingOutlined className="text-xs" /> Đang kiểm tra...
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-sm">
                <UserOutlined />
              </span>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                autoComplete="username"
                autoFocus
                placeholder="Ví dụ: hoctuvung_lela"
                className={`w-full h-11 sm:h-12 pl-10 pr-9 rounded-[14px] bg-[#FFFDF9] border text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60 ${
                  usernameStatus === 'valid'
                    ? 'border-[var(--success)] focus:border-[var(--success)]'
                    : usernameStatus === 'invalid'
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[var(--border)] focus:border-[var(--brand)]'
                }`}
              />
              <span className="absolute right-3 pointer-events-none text-base">
                {usernameStatus === 'valid' && <CheckCircleFilled className="text-[var(--success)]" />}
                {usernameStatus === 'invalid' && <CloseCircleFilled className="text-[var(--danger)]" />}
              </span>
            </div>
            {usernameError && (
              <p role="alert" className="text-[11px] text-[var(--danger)] font-medium pt-0.5">
                {usernameError}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1 text-left">
            <label htmlFor="reg-fullname" className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
              Họ và tên
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-sm">
                <UserOutlined />
              </span>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                autoComplete="name"
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full h-11 sm:h-12 pl-10 pr-3.5 rounded-[14px] bg-[#FFFDF9] border border-[var(--border)] text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="reg-email" className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
                Email <span className="text-[var(--danger)]">*</span>
              </label>
              {emailStatus === 'checking' && (
                <span className="text-[11px] text-[var(--text-3)] flex items-center gap-1">
                  <LoadingOutlined className="text-xs" /> Đang kiểm tra...
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-sm">
                <MailOutlined />
              </span>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                placeholder="name@example.com"
                className={`w-full h-11 sm:h-12 pl-10 pr-9 rounded-[14px] bg-[#FFFDF9] border text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60 ${
                  emailStatus === 'valid'
                    ? 'border-[var(--success)] focus:border-[var(--success)]'
                    : emailStatus === 'invalid'
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[var(--border)] focus:border-[var(--brand)]'
                }`}
              />
              <span className="absolute right-3 pointer-events-none text-base">
                {emailStatus === 'valid' && <CheckCircleFilled className="text-[var(--success)]" />}
                {emailStatus === 'invalid' && <CloseCircleFilled className="text-[var(--danger)]" />}
              </span>
            </div>
            {emailError && (
              <p role="alert" className="text-[11px] text-[var(--danger)] font-medium pt-0.5">
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1 text-left">
            <label htmlFor="reg-password" className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
              Mật khẩu <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-sm">
                <LockOutlined />
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onKeyDown={handleKeyEvents}
                onKeyUp={handleKeyEvents}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự, gồm số, hoa & ký tự đặc biệt"
                className="w-full h-11 sm:h-12 pl-10 pr-11 rounded-[14px] bg-[#FFFDF9] border border-[var(--border)] text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 text-[var(--text-3)] hover:text-[var(--text)] p-1 text-base transition-colors cursor-pointer"
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>

            {/* Caps Lock Detection */}
            {capsLockOn && (
              <div role="alert" className="text-xs text-[var(--warning)] font-medium flex items-center gap-1.5 pt-0.5">
                <span>⚠️</span>
                <span>Caps Lock đang bật</span>
              </div>
            )}

            {/* 4-segment Strength Meter */}
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1 text-left">
            <label htmlFor="reg-confirmPassword" className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
              Nhập lại mật khẩu <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-sm">
                <LockOutlined />
              </span>
              <input
                id="reg-confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                autoComplete="new-password"
                placeholder="Nhập lại chính xác mật khẩu trên"
                className={`w-full h-11 sm:h-12 pl-10 pr-11 rounded-[14px] bg-[#FFFDF9] border text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60 ${
                  confirmPassword && confirmPassword === password
                    ? 'border-[var(--success)] focus:border-[var(--success)]'
                    : confirmPassword && confirmPassword !== password
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[var(--border)] focus:border-[var(--brand)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 text-[var(--text-3)] hover:text-[var(--text)] p-1 text-base transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p role="alert" className="text-[11px] text-[var(--danger)] font-medium pt-0.5">
                Mật khẩu xác nhận chưa khớp!
              </p>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-1 text-left">
            <label htmlFor="reg-language" className="block text-xs sm:text-sm font-semibold text-[var(--text)]">
              Ngôn ngữ muốn học
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-sm">
                <GlobalOutlined />
              </span>
              <select
                id="reg-language"
                value={targetLanguageId || ''}
                onChange={(e) => setTargetLanguageId(Number(e.target.value))}
                className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-[14px] bg-[#FFFDF9] border border-[var(--border)] text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] cursor-pointer"
              >
                {isLoadingLangs && <option value="">Đang tải danh sách ngôn ngữ...</option>}
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} ({lang.nativeName || lang.languageCode?.toUpperCase()})
                  </option>
                ))}
                {languages.length === 0 && !isLoadingLangs && (
                  <option value={1}>Tiếng Anh (English - TOEIC)</option>
                )}
              </select>
            </div>
          </div>

          {/* Inline Error Notice */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-[12px] bg-[var(--danger-50)] border border-[var(--danger)]/20 text-xs font-medium text-[var(--danger)] text-left flex items-start gap-2 animate-fade-in"
            >
              <span className="text-sm shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button (48px / 52px mobile, --brand bg, #2A1300 semibold, btn-shine) */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className={`w-full h-12 sm:h-12 rounded-[14px] bg-[var(--brand)] text-[#2A1300] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[var(--shadow-sm)] btn-shine cursor-pointer pt-0 mt-3 ${
              loading || isSuccess ? 'opacity-80 cursor-not-allowed' : 'hover:bg-[var(--brand-600)] active:scale-[0.98]'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckOutlined className="text-base text-[#2A1300]" />
                <span>Tạo tài khoản thành công!</span>
              </>
            ) : loading ? (
              <>
                <LoadingOutlined className="text-base text-[#2A1300]" />
                <span>Đang tạo tài khoản...</span>
              </>
            ) : (
              <span>Tạo tài khoản</span>
            )}
          </button>
        </form>

        {/* Footer: Already have an account */}
        <div className="text-center text-xs text-[var(--text-2)] pt-1">
          <span>Đã có tài khoản? </span>
          <Link to="/login" className="text-[var(--brand-700)] font-semibold link-sweep cursor-pointer">
            Đăng nhập ngay
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export default RegisterPage;
