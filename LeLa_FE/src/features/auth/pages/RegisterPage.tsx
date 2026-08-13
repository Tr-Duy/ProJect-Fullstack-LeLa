import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Form, Input, Select, App } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { BackgroundPattern } from '../../landing/components/BackgroundPattern';
import { BrutalNumberInput } from '../../../shared/components/ui/BrutalNumberInput';
import { apiClient } from '../../../shared/lib/api';
import { useQuery } from '@tanstack/react-query';
import { languagesApi } from '../../master-data/api/languages.api';
import { authApi } from '../api/auth.api';

const TIMEZONES = Intl.supportedValuesOf('timeZone');

export function RegisterPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Default values
  useEffect(() => {
    form.setFieldsValue({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dailyGoalCards: 20
    });
  }, [form]);

  // Fetch languages
  const { data: languagesData, isLoading: isLoadingLangs } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.getAll()
  });

  const languages = languagesData?.data || [];

  const handleNext = async () => {
    try {
      if (currentStep === 1) {
        await form.validateFields(['username', 'email', 'password', 'confirmPassword', 'fullName']);
      } else if (currentStep === 2) {
        await form.validateFields(['timezone']);
      }
      setCurrentStep(prev => prev + 1);
    } catch (error) {
      // Form validation failed
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // Remove confirmPassword to prevent backend unknown property errors if any
      const { confirmPassword, ...submitData } = values;
      const res = await apiClient.post('/auth/register', submitData);
      if (res.data.success) {
        message.success('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => navigate('/login', { 
          state: { 
            registeredUsername: submitData.username, 
            registeredPassword: submitData.password 
          } 
        }), 1500);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3EE] p-4 relative font-sans">
      <BackgroundPattern />
      <div className="z-10 w-full max-w-lg">
        <button
          onClick={() => currentStep > 1 ? handleBack() : navigate('/')}
          className="mb-6 flex items-center gap-2 font-bold text-brand-navy hover:text-brand-coral transition-colors"
        >
          <ArrowLeftOutlined /> {currentStep > 1 ? 'Quay lại bước trước' : 'Quay lại trang chủ'}
        </button>

        <div className="brutal-card brutal-shadow bg-white p-8 border-[3px] border-black">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase text-brand-navy mb-2 tracking-tighter">Tạo Tài Khoản</h1>
            <p className="font-bold text-gray-500">Bước {currentStep} / 3</p>

            {/* Progress indicators */}
            <div className="flex gap-2 justify-center mt-4">
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  className={`h-3 w-12 rounded-full border-2 border-black ${step === currentStep ? 'bg-brand-coral' : step < currentStep ? 'bg-brand-navy' : 'bg-gray-200'
                    }`}
                />
              ))}
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="space-y-4"
          >
            {/* STEP 1: Account Basics */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <Form.Item
                name="username"
                label={<span className="font-bold uppercase text-brand-navy">Tên đăng nhập</span>}
                validateTrigger={['onBlur', 'onChange']}
                validateFirst
                hasFeedback
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                  { min: 3, message: 'Tên đăng nhập tối thiểu 3 ký tự!' },
                  {
                    validator: async (_, value) => {
                      if (!value || value.length < 3) return Promise.resolve();
                      try {
                        const exists = await authApi.checkUsername(value);
                        if (exists) {
                          return Promise.reject(new Error('Tên đăng nhập này đã có người sử dụng.'));
                        }
                      } catch (err) {
                        // Ignore backend validation errors (e.g. 403, 500) and let submit handle it
                        return Promise.resolve();
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input prefix={<UserOutlined className="text-gray-400" />} className="brutal-border brutal-shadow-sm h-14 font-bold text-lg" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="font-bold uppercase text-brand-navy">Email</span>}
                validateTrigger={['onBlur', 'onChange']}
                validateFirst
                hasFeedback
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                  {
                    validator: async (_, value) => {
                      if (!value || !/^\S+@\S+\.\S+$/.test(value)) return Promise.resolve();
                      try {
                        const exists = await authApi.checkEmail(value);
                        if (exists) {
                          return Promise.reject(new Error('Email này đã được đăng ký.'));
                        }
                      } catch (err) {
                        return Promise.resolve();
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input prefix={<MailOutlined className="text-gray-400" />} className="brutal-border brutal-shadow-sm h-14 font-bold text-lg" />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="font-bold uppercase text-brand-navy">Mật khẩu</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải từ 6 ký tự!' }
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} className="brutal-border brutal-shadow-sm h-14 font-bold text-lg" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<span className="font-bold uppercase text-brand-navy">Xác nhận mật khẩu</span>}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-gray-400" />} className="brutal-border brutal-shadow-sm h-14 font-bold text-lg" />
              </Form.Item>

              <Form.Item
                name="fullName"
                label={<span className="font-bold uppercase text-brand-navy">Họ và Tên</span>}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input prefix={<UserOutlined className="text-gray-400" />} className="brutal-border brutal-shadow-sm h-14 font-bold text-lg" />
              </Form.Item>
            </div>

            {/* STEP 2: Location (Timezone) */}
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <Form.Item
                name="timezone"
                label={<span className="font-bold uppercase text-brand-navy">Múi giờ của bạn</span>}
                rules={[{ required: true, message: 'Vui lòng chọn múi giờ!' }]}
              >
                <Select
                  showSearch
                  className="h-14 w-full font-bold [&_.ant-select-selector]:!brutal-border [&_.ant-select-selector]:!brutal-shadow-sm [&_.ant-select-selector]:!rounded-none"
                  options={TIMEZONES.map(tz => ({ label: tz, value: tz }))}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </div>

            {/* STEP 3: Learning Goals */}
            <div className={currentStep === 3 ? 'block' : 'hidden'}>
              <Form.Item
                name="nativeLanguageId"
                label={<span className="font-bold uppercase text-brand-navy">Ngôn ngữ mẹ đẻ</span>}
                rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ mẹ đẻ!' }]}
              >
                <Select
                  loading={isLoadingLangs}
                  className="h-14 w-full font-bold [&_.ant-select-selector]:!brutal-border [&_.ant-select-selector]:!brutal-shadow-sm [&_.ant-select-selector]:!rounded-none"
                  options={languages.map(l => ({ label: l.name, value: l.id }))}
                />
              </Form.Item>

              <Form.Item
                name="targetLanguageId"
                label={<span className="font-bold uppercase text-brand-navy">Ngôn ngữ muốn học</span>}
                rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ muốn học!' }]}
              >
                <Select
                  loading={isLoadingLangs}
                  className="h-14 w-full font-bold [&_.ant-select-selector]:!brutal-border [&_.ant-select-selector]:!brutal-shadow-sm [&_.ant-select-selector]:!rounded-none"
                  options={languages.map(l => ({ label: l.name, value: l.id }))}
                />
              </Form.Item>

              <Form.Item
                name="dailyGoalCards"
                label={<span className="font-bold uppercase text-brand-navy">Mục tiêu học (số thẻ mỗi ngày)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mục tiêu!' }]}
              >
                <BrutalNumberInput min={1} max={100} step={1} />
              </Form.Item>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t-[3px] border-black flex gap-4">
              {currentStep < 3 ? (
                <Button
                  type="default"
                  onClick={handleNext}
                  className="w-full brutal-pill !bg-brand-navy !text-white h-14 font-black text-xl uppercase tracking-wider hover:!translate-y-[-2px] hover:!shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Tiếp Tục
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full brutal-pill !bg-brand-coral !text-white h-14 font-black text-xl uppercase tracking-wider hover:!translate-y-[-2px] hover:!shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Hoàn Tất Đăng Ký
                </Button>
              )}
            </div>

            {currentStep === 1 && (
              <div className="text-center mt-6 font-bold text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-brand-navy underline hover:text-brand-coral">
                  Đăng nhập
                </Link>
              </div>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}
