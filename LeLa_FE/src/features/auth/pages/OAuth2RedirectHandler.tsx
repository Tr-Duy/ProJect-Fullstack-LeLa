import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { apiClient } from '../../../shared/lib/api';
import { App } from 'antd';
import { BackgroundPattern } from '../../landing/components/BackgroundPattern';

export function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { message } = App.useApp();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      handled.current = true;
      message.error('Đăng nhập bằng Google thất bại hoặc bị hủy.');
      navigate('/login', { replace: true });
      return;
    }

    if (code) {
      handled.current = true;
      // Clean up the URL so the code doesn't stay in history
      window.history.replaceState({}, document.title, '/dashboard');
      
      const exchangeCode = async () => {
        try {
          const res = await apiClient.post('/auth/oauth2/exchange', { code });
          if (res.data.success && res.data.data) {
            login(res.data.data);
            message.success('Đăng nhập thành công!');
            const isAdmin = Array.isArray(res.data.data.user?.roles)
              ? res.data.data.user.roles.includes('ADMIN')
              : res.data.data.user?.role === 'ADMIN';
            if (isAdmin) {
              navigate('/admin/dashboard', { replace: true });
            } else if (!res.data.data.user?.currentLevel) {
              navigate('/onboarding', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            throw new Error('Xác thực thất bại');
          }
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Lỗi khi xác thực tài khoản Google.');
          navigate('/login', { replace: true });
        }
      };

      exchangeCode();
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, navigate, login, message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3EE] p-4 relative font-sans">
      <BackgroundPattern />
      <div className="z-10 w-full max-w-md">
        <div className="brutal-card brutal-shadow bg-white p-8 border-[3px] border-black text-center">
          <h2 className="text-2xl font-black uppercase text-brand-navy mb-4">Đang xác thực...</h2>
          <p className="font-bold text-gray-500">Vui lòng đợi trong giây lát.</p>
        </div>
      </div>
    </div>
  );
}
