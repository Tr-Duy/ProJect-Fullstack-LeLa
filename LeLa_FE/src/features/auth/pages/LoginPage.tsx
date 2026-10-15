import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { resolvePostLoginRedirect } from '../../../shared/utils/auth-redirect';
import { apiClient } from '../../../shared/lib/api';
import { Checkbox } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { AuthLayout } from '../components/AuthLayout';
import { useGoogleLoginWithWake } from '../hooks/useGoogleLoginWithWake';
import { GoogleLoginWakeModal } from '../components/GoogleLoginWakeModal';
import { celebrate } from '../../../ui/motion/celebrate';
import type { LelaMood } from '../../../shared/components/ui/Lela';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const reduce = useReducedMotion();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const {
    isWaking,
    isOpen: isWakeModalOpen,
    status: wakeStatus,
    elapsedSeconds: wakeElapsedSeconds,
    startWakeAndLogin,
    handleClose: handleCloseWakeModal,
  } = useGoogleLoginWithWake();

  // Load saved credentials or registered redirect data
  useEffect(() => {
    if (location.state?.registeredUsername) {
      setUsernameOrEmail(location.state.registeredUsername);
      if (location.state?.registeredPassword) {
        setPassword(location.state.registeredPassword);
      }
    } else {
      const savedRemember = localStorage.getItem('rememberMe') === 'true';
      if (savedRemember) {
        setRememberMe(true);
        setUsernameOrEmail(localStorage.getItem('savedUsername') || '');
        setPassword(localStorage.getItem('savedPassword') || '');
      }
    }
  }, [location.state]);

  // Compute Lela Mascot Mood
  let lelaMood: LelaMood = 'idle';
  if (isSuccess) {
    lelaMood = 'cheer';
  } else if (errorMessage) {
    lelaMood = 'sad';
  } else if (focusedField === 'password') {
    lelaMood = showPassword ? 'peek' : 'cover';
  } else {
    lelaMood = 'idle';
  }

  // Pupil shift based on string length (clamped to ±4px)
  const lelaPupilOffset = Math.max(-4, Math.min(4, (usernameOrEmail.length - 4) * 0.7));

  const handleKeyEvents = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSuccess) return;

    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      triggerShake();
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload = {
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      };

      const res = await apiClient.post('/auth/login', payload);
      if (res.data.success && res.data.data) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedUsername', usernameOrEmail.trim());
          localStorage.setItem('savedPassword', password);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('savedPassword');
        }

        setIsSuccess(true);
        celebrate({ eventKey: 'login-success-celebrate' });

        const resolvedUser = await login(res.data.data);
        const target = resolvePostLoginRedirect(resolvedUser || res.data.data.user);

        setTimeout(() => {
          navigate(target || '/dashboard');
        }, 500);
      } else {
        throw new Error('Đăng nhập thất bại');
      }
    } catch (err: any) {
      triggerShake();
      if (!err.response) {
        setErrorMessage('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.');
      } else if (err.response.status === 401) {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu chưa đúng. Bạn thử lại nhé.');
      } else if (err.response.status >= 500) {
        setErrorMessage('Máy chủ đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.');
      } else {
        setErrorMessage(err.response.data?.message || 'Tên đăng nhập hoặc mật khẩu chưa đúng. Bạn thử lại nhé.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 350);
  };

  return (
    <AuthLayout lelaMood={lelaMood} lelaPupilOffset={lelaPupilOffset} backTo="/" backText="Về trang chủ">
      <motion.div
        initial={reduce ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={`space-y-6 ${isShaking ? 'shake-card' : ''}`}
      >
        {/* Header */}
        <div className="space-y-1.5 text-left">
          <h2 className="font-display font-semibold text-[1.875rem] text-[var(--text)] tracking-tight leading-tight">
            Chào mừng trở lại
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">
            Đăng nhập để tiếp tục chuỗi học của bạn.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Username / Email field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="usernameOrEmail"
              className="block text-sm font-semibold text-[var(--text)]"
            >
              Tên đăng nhập hoặc email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-base">
                <UserOutlined />
              </span>
              <input
                id="usernameOrEmail"
                ref={usernameInputRef}
                type="text"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                autoComplete="username"
                autoFocus
                placeholder="Ví dụ: lela_learner hoặc email"
                className="w-full h-12 pl-10 pr-3.5 rounded-[14px] bg-[#FFFDF9] border border-[var(--border)] text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[var(--text)]"
            >
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[var(--text-3)] pointer-events-none text-base">
                <LockOutlined />
              </span>
              <input
                id="password"
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
                autoComplete="current-password"
                placeholder="Nhập mật khẩu của bạn"
                className="w-full h-12 pl-10 pr-11 rounded-[14px] bg-[#FFFDF9] border border-[var(--border)] text-[var(--text)] text-sm font-medium transition-all focus:outline-none focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.2)] placeholder:text-[var(--text-3)]/60"
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
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="text-[var(--text-2)] font-medium text-xs select-none"
            >
              Ghi nhớ tài khoản
            </Checkbox>

            <span
              className="text-[var(--brand-700)] font-semibold hover:underline cursor-pointer"
              onClick={() => {
                setErrorMessage('Vui lòng liên hệ ban quản trị lela@lela.com để được hỗ trợ đặt lại mật khẩu.');
              }}
            >
              Quên mật khẩu?
            </span>
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

          {/* Submit Button (48px, --brand bg, #2A1300 text, btn-shine) */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className={`w-full h-12 rounded-[14px] bg-[var(--brand)] text-[#2A1300] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[var(--shadow-sm)] btn-shine cursor-pointer ${
              loading || isSuccess ? 'opacity-80 cursor-not-allowed' : 'hover:bg-[var(--brand-600)] active:scale-[0.98]'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckOutlined className="text-base text-[#2A1300]" />
                <span>Đăng nhập thành công!</span>
              </>
            ) : loading ? (
              <>
                <LoadingOutlined className="text-base text-[#2A1300]" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

        {/* Separator "hoặc" */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[var(--border)] w-full" />
          <span className="bg-white px-3 text-[11px] font-medium text-[var(--text-3)] absolute">
            hoặc
          </span>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          disabled={loading || isWaking || isSuccess}
          onClick={startWakeAndLogin}
          className="w-full h-12 rounded-[14px] bg-white border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
        >
          {isWaking ? (
            <>
              <LoadingOutlined className="text-sm text-[var(--brand)]" />
              <span>Đang kết nối tài khoản Google...</span>
            </>
          ) : (
            <>
              {/* Official Google 'G' Logo SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </>
          )}
        </button>

        {/* Footer: Sign up link */}
        <div className="text-center text-xs text-[var(--text-2)] pt-2">
          <span>Chưa có tài khoản? </span>
          <Link
            to="/register"
            className="text-[var(--brand-700)] font-semibold link-sweep cursor-pointer"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      </motion.div>

      <GoogleLoginWakeModal
        isOpen={isWakeModalOpen}
        status={wakeStatus}
        elapsedSeconds={wakeElapsedSeconds}
        onRetry={startWakeAndLogin}
        onClose={handleCloseWakeModal}
      />
    </AuthLayout>
  );
}

export default LoginPage;
