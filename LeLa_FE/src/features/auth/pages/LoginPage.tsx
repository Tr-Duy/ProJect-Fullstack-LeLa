import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { apiClient } from '../../../shared/lib/api';
import { Button, Form, Input, App, Checkbox, Divider } from 'antd';
import { MailOutlined, LockOutlined, ArrowLeftOutlined, GoogleOutlined } from '@ant-design/icons';
import { BackgroundPattern } from '../../landing/components/BackgroundPattern';
import { useGoogleLoginWithWake } from '../hooks/useGoogleLoginWithWake';
import { GoogleLoginWakeModal } from '../components/GoogleLoginWakeModal';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const {
    isWaking,
    isOpen: isWakeModalOpen,
    status: wakeStatus,
    elapsedSeconds: wakeElapsedSeconds,
    startWakeAndLogin,
    handleClose: handleCloseWakeModal,
  } = useGoogleLoginWithWake();

  useEffect(() => {
    if (location.state?.registeredUsername) {
      form.setFieldsValue({
        usernameOrEmail: location.state.registeredUsername,
        password: location.state.registeredPassword
      });
    } else {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      if (rememberMe) {
        form.setFieldsValue({
          usernameOrEmail: localStorage.getItem('savedUsername') || '',
          password: localStorage.getItem('savedPassword') || '',
          rememberMe: true
        });
      }
    }
  }, [location.state, form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = { 
        usernameOrEmail: values.usernameOrEmail, 
        password: values.password 
      };
        
      const res = await apiClient.post('/auth/login', payload);
      if (res.data.success && res.data.data) {
        if (values.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedUsername', values.usernameOrEmail);
          localStorage.setItem('savedPassword', values.password);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('savedPassword');
        }

        login(res.data.data);
        message.success('Đăng nhập thành công!');
        const isAdmin = Array.isArray(res.data.data.user?.roles)
          ? res.data.data.user.roles.includes('ADMIN')
          : res.data.data.user?.role === 'ADMIN';
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else if (!res.data.data.user?.currentLevel) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error('Đăng nhập thất bại');
      }
    } catch (err: any) {
      if (!err.response) {
        message.error('Không thể kết nối máy chủ.');
      } else if (err.response.status === 401) {
        message.error(err.response.data?.message || 'Thông tin đăng nhập không đúng.');
      } else if (err.response.status >= 500) {
        message.error('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        message.error(err.response.data?.message || 'Đăng nhập thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3EE] p-4 relative font-sans">
      <BackgroundPattern />
      <div className="z-10 w-full max-w-md">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 font-bold text-brand-navy hover:text-brand-coral transition-colors"
        >
          <ArrowLeftOutlined /> Quay lại trang chủ
        </button>

        <div className="brutal-card brutal-shadow bg-white p-8 border-[3px] border-black">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase text-brand-navy mb-2 tracking-tighter">Đăng Nhập</h1>
            <p className="font-bold text-gray-500">Chào mừng trở lại với LeLa!</p>
          </div>


          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} className="space-y-4">
            <Form.Item
              name="usernameOrEmail"
              label={<span className="font-bold uppercase text-brand-navy">Tên đăng nhập hoặc Email</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email!' }]}
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />} 
                placeholder="Ví dụ: lela_user" 
                className="brutal-border brutal-shadow-sm h-14 font-bold text-lg"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="font-bold uppercase text-brand-navy">Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="Nhập mật khẩu của bạn" 
                className="brutal-border brutal-shadow-sm h-14 font-bold text-lg"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="rememberMe" valuePropName="checked" className="mb-0">
              <Checkbox className="font-bold text-brand-navy">Ghi nhớ tài khoản</Checkbox>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full brutal-pill !bg-brand-coral !text-white h-14 font-black text-xl uppercase tracking-wider hover:!translate-y-[-2px] hover:!shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all mt-4"
            >
              Đăng Nhập
            </Button>

            <Divider className="border-gray-300">
              <span className="font-bold text-gray-500">HOẶC</span>
            </Divider>

            <Button
              type="default"
              icon={<GoogleOutlined />}
              loading={isWaking}
              disabled={loading || isWaking}
              onClick={startWakeAndLogin}
              className="w-full brutal-pill h-14 font-bold text-lg mb-4 hover:!translate-y-[-2px] hover:!shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] hover:!border-black transition-all flex items-center justify-center gap-2"
            >
              Đăng nhập bằng Google
            </Button>

            <div className="text-center mt-6 font-bold text-gray-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-brand-navy underline hover:text-brand-coral">
                Đăng ký ngay
              </Link>
            </div>
          </Form>
        </div>
      </div>

      <GoogleLoginWakeModal
        isOpen={isWakeModalOpen}
        status={wakeStatus}
        elapsedSeconds={wakeElapsedSeconds}
        onRetry={startWakeAndLogin}
        onClose={handleCloseWakeModal}
      />
    </div>
  );
}
