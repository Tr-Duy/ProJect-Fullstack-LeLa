import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Select, Switch, App, Modal, Tabs, Table, Tag } from 'antd';
import { UserOutlined, PictureOutlined, SaveOutlined } from '@ant-design/icons';
import { profileApi, type ProfileUpdateRequest } from '../api/profile.api';
import { languagesApi } from '../../master-data/api/languages.api';
import { BrutalNumberInput } from '../../../shared/components/ui/BrutalNumberInput';
import { userSubscriptionsApi } from '../../subscription/api/user-subscriptions.api';
import { paymentsApi } from '../../subscription/api/payments.api';
import { subscriptionPlansApi } from '../../subscription/api/subscription-plans.api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const TIMEZONES = Intl.supportedValuesOf('timeZone');
const AVATAR_SEEDS = [
  'Felix', 'Luna', 'Oliver', 'Lucy', 'Leo', 'Milo', 'Cleo', 'Bella',
  'Simba', 'Loki', 'Max', 'Chloe', 'Lily', 'Nala', 'Zoe', 'Oscar',
  'Jasper', 'Finn', 'Mia', 'Ruby'
];

export function ProfilePage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getMe(),
  });

  const { data: languagesData, isLoading: isLoadingLangs } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.getAll()
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => userSubscriptionsApi.getAll({ size: 100 }),
  });

  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentsApi.getAll({ size: 100 }),
  });

  const { data: plansData } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: () => subscriptionPlansApi.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProfileUpdateRequest) => profileApi.updateMe(values),
    onSuccess: (res) => {
      message.success('Cập nhật thông tin thành công!');
      queryClient.setQueryData(['profile'], res);
    },
    onError: () => {
      message.error('Cập nhật thất bại. Vui lòng thử lại.');
    }
  });

  const profile = data?.data;
  const languages = languagesData?.data || [];
  const subscriptions = subscriptionsData?.data?.content || [];
  const payments = paymentsData?.data?.content || [];
  const plans = plansData?.data || [];
  
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE');
  let activeSubscription = null;
  if (activeSubscriptions.length > 0 && plans.length > 0) {
    activeSubscription = activeSubscriptions.reduce((highest: any, current: any) => {
      const highestPlan = plans.find((p: any) => p.id === highest.planId);
      const currentPlan = plans.find((p: any) => p.id === current.planId);
      if (!highestPlan || !currentPlan) return highest;
      return currentPlan.price > highestPlan.price ? current : highest;
    }, activeSubscriptions[0]);
  } else if (activeSubscriptions.length > 0) {
    activeSubscription = activeSubscriptions[0];
  }

  const activePlanName = plans.find(p => p.id === activeSubscription?.planId)?.name || `ID: ${activeSubscription?.planId}`;

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        dailyGoalCards: profile.dailyGoalCards || 20,
        nativeLanguageId: profile.nativeLanguageId,
        targetLanguageId: profile.targetLanguageId,
        promptDailyGoal: profile.promptDailyGoal ?? true,
      });
    }
  }, [profile, form]);

  if (isLoading) {
    return <div className="p-8 font-bold">Đang tải...</div>;
  }

  const onFinish = (values: any) => {
    updateMutation.mutate(values);
  };

  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarPreview(e.target.value);
  };

  const generalSettingsContent = (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        fullName: profile?.fullName,
        avatarUrl: profile?.avatarUrl,
        timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        dailyGoalCards: profile?.dailyGoalCards || 20,
        nativeLanguageId: profile?.nativeLanguageId,
        targetLanguageId: profile?.targetLanguageId,
        promptDailyGoal: profile?.promptDailyGoal ?? true,
      }}
      onFinish={onFinish}
      className="flex flex-col gap-6 lg:gap-8"
      requiredMark={false}
    >
      <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white border border-[var(--border)] p-6 sm:p-8">
        <h3 className="text-2xl font-black  text-[#2B1B0E] mb-6 border-b-4 border-[#F05A4A] inline-block pb-1">Thông tin tài khoản</h3>
        
        <div className="space-y-5">
          <Form.Item
            label={<span className="font-bold text-[#2B1B0E]">Họ và Tên</span>}
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input className="border border-[var(--border)] shadow-[var(--shadow-md)]-sm h-14 font-black text-lg" prefix={<UserOutlined className="text-gray-400 mr-2" />} />
          </Form.Item>

          <Form.Item
            label={<span className="font-bold text-[#2B1B0E]">Ảnh đại diện (URL)</span>}
            name="avatarUrl"
          >
            <div className="flex gap-4">
              <Input 
                className="border border-[var(--border)] shadow-[var(--shadow-md)]-sm h-14 font-black text-lg flex-1" 
                prefix={<PictureOutlined className="text-gray-400 mr-2" />} 
                placeholder="https://..." 
                onChange={handleAvatarUrlChange}
              />
              <Button 
                htmlType="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="brutal-pill shadow-[var(--shadow-md)]-sm h-14 px-6 font-black text-lg bg-[#FFD700] hover:!bg-[#FFD700] hover:!text-black hover:!-translate-y-1 transition-all shrink-0"
              >
                🎲 Chọn Avatar
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label={<span className="font-bold text-[#2B1B0E]">Múi giờ (Timezone)</span>}
            name="timezone"
            rules={[{ required: true }]}
          >
            <Select 
              showSearch
              className="h-14 w-full font-black text-lg [&_.ant-select-selector]:!border border-[var(--border)] [&_.ant-select-selector]:!shadow-[var(--shadow-md)]-sm [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!h-14 [&_.ant-select-selection-item]:!leading-[3.25rem] [&_.ant-select-selection-placeholder]:!leading-[3.25rem]"
              options={TIMEZONES.map(tz => ({ label: tz, value: tz }))}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-[#F4F3EE] border border-[var(--border)] p-6 sm:p-8">
        <h3 className="text-2xl font-black  text-[#2B1B0E] mb-6 border-b-4 border-[#2A8B9D] inline-block pb-1">Sở thích học tập</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Form.Item
            name="nativeLanguageId"
            label={<span className="font-bold text-[#2B1B0E]">Ngôn ngữ mẹ đẻ</span>}
            className="mb-0"
          >
            <Select
              loading={isLoadingLangs}
              className="h-14 w-full font-black text-lg [&_.ant-select-selector]:!border border-[var(--border)] [&_.ant-select-selector]:!shadow-[var(--shadow-md)]-sm [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!h-14 [&_.ant-select-selection-item]:!leading-[3.25rem]"
              options={languages.map(l => ({ label: l.name, value: l.id }))}
            />
          </Form.Item>

          <Form.Item
            name="targetLanguageId"
            label={<span className="font-bold text-[#2B1B0E]">Ngôn ngữ muốn học</span>}
            className="mb-0"
          >
            <Select
              loading={isLoadingLangs}
              className="h-14 w-full font-black text-lg [&_.ant-select-selector]:!border border-[var(--border)] [&_.ant-select-selector]:!shadow-[var(--shadow-md)]-sm [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!h-14 [&_.ant-select-selection-item]:!leading-[3.25rem]"
              options={languages.map(l => ({ label: l.name, value: l.id }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="font-bold text-[#2B1B0E]">Mục tiêu hàng ngày (Số thẻ)</span>}
          name="dailyGoalCards"
          rules={[{ required: true }]}
          className="mb-6"
        >
          <BrutalNumberInput min={1} max={100} step={1} />
        </Form.Item>

        <Form.Item
          name="promptDailyGoal"
          valuePropName="checked"
          className="mb-0 bg-white p-5 border border-[var(--border)] shadow-[var(--shadow-md)]-sm flex items-center justify-between transition-transform hover:-translate-y-[2px]"
        >
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1">
              <div className="font-black text-[#2B1B0E] text-lg">Hỏi mục tiêu mỗi ngày</div>
              <div className="text-gray-500 font-bold mt-1 text-sm sm:text-base leading-tight">Hiển thị nhắc nhở nhập số thẻ mục tiêu vào lần học đầu tiên trong ngày.</div>
            </div>
            <Switch className="shrink-0" />
          </div>
        </Form.Item>
      </div>
      <div className="flex justify-end mt-4">
        <Button
          type="primary"
          onClick={() => form.submit()}
          loading={updateMutation.isPending}
          icon={<SaveOutlined />}
          className="rounded-xl !bg-[var(--brand)] !text-[#2A1300] h-12 px-8 font-semibold text-base shadow-[var(--shadow-sm)] hover:!bg-[var(--brand-600)] transition-all btn-shine cursor-pointer"
        >
          Lưu thay đổi
        </Button>
      </div>
    </Form>
  );

  const paymentColumns = [
    { title: 'Mã Giao Dịch', dataIndex: 'providerTransactionId', key: 'txn' },
    { title: 'Phương Thức', dataIndex: 'provider', key: 'provider' },
    { 
      title: 'Số Tiền', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (amount: number, record: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: record.currencyCode || 'VND' }).format(amount)
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'SUCCEEDED' ? 'green' : status === 'FAILED' ? 'red' : 'orange'}>
          {status === 'SUCCEEDED' ? 'THÀNH CÔNG' : status}
        </Tag>
      )
    },
    { 
      title: 'Thời Gian', 
      dataIndex: 'createdAt', 
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    }
  ];

  const billingContent = (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-sm)] bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 text-[var(--text)]">
        <h3 className="text-xl font-bold mb-6 border-b-2 border-[var(--brand)] inline-block pb-1 text-[var(--text)]">Gói cước hiện tại</h3>
        {activeSubscription ? (
          <div>
            <div className="text-lg font-bold mb-2">Bạn đang sử dụng gói: <span className="text-[var(--brand-700)] font-bold">{activePlanName}</span></div>
            <div className="text-[var(--text-2)] text-sm">Trạng thái: <Tag color="green">Đang Hoạt Động</Tag></div>
            <div className="text-[var(--text-2)] text-sm mt-2">Đăng ký ngày: {dayjs(activeSubscription.startedAt).format('DD/MM/YYYY')}</div>
            <Button 
              className="mt-6 rounded-xl !bg-[var(--sun)] !text-[#2A1300] font-semibold h-11 px-6 hover:brightness-105 cursor-pointer"
              onClick={() => navigate('/pricing')}
            >
              Nâng cấp gói khác
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-lg font-bold mb-2">Bạn đang sử dụng Gói Cơ Bản (Miễn phí)</div>
            <div className="text-[var(--text-2)] text-sm mb-6">Bạn chưa đăng ký gói cao cấp nào. Hãy nâng cấp để trải nghiệm thêm nhiều tính năng!</div>
            <Button 
              className="rounded-xl !bg-[var(--brand)] !text-[#2A1300] font-semibold h-11 px-6 hover:!bg-[var(--brand-600)] btn-shine cursor-pointer"
              onClick={() => navigate('/pricing')}
            >
              Xem bảng giá & nâng cấp
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white border border-[var(--border)] p-6 sm:p-8">
        <h3 className="text-2xl font-black  text-[#2B1B0E] mb-6 border-b-4 border-[#FFD700] inline-block pb-1">Lịch sử giao dịch</h3>
        {payments.length > 0 ? (
          <Table 
            columns={paymentColumns} 
            dataSource={payments} 
            rowKey="id"
            loading={isLoadingPayments}
            pagination={false}
            className="brutal-table"
          />
        ) : (
          <div className="text-gray-500 font-bold italic p-4 text-center bg-gray-50 border-2 border-dashed border-gray-300">
            Chưa có giao dịch nào
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#F4F3EE] p-4 sm:p-8 relative pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 lg:mb-12 gap-4">
          <h1 className="text-4xl md:text-5xl font-black  tracking-tighter text-[#2B1B0E]">
            Hồ Sơ Cá Nhân
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <div className="lg:col-span-4 rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-[#2A8B9D] border border-[var(--border)] p-8 text-center flex flex-col items-center">
            <div 
              className="w-40 h-40 border border-[var(--border)] border-[var(--border)] bg-[#F4F3EE] rounded-full shrink-0 overflow-hidden relative shadow-[var(--shadow-md)] mb-6 transition-transform hover:-translate-y-1 group cursor-pointer"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              {(avatarPreview || profile?.avatarUrl) ? (
                <img 
                  src={avatarPreview || profile?.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/F4F3EE/1D2A3A?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400 bg-white">
                  <UserOutlined />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <span className="text-white font-black text-xl ">🎲 Chọn</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-black  text-white tracking-tight mb-1">{profile?.fullName || 'Học Viên'}</h2>
            <p className="text-[#F4F3EE] font-bold mb-6 truncate w-full px-4">@{profile?.username} &bull; {profile?.email}</p>
            
            <div className="flex flex-col gap-3 w-full">
              <div className="border border-[var(--border)] px-4 py-3 bg-[#F4F3EE] flex justify-between items-center font-black text-lg text-[#2B1B0E] shadow-[var(--shadow-md)]">
                <span className="text-brand-coral">🔥 Chuỗi</span>
                <span>{profile?.streakCurrent || 0} ngày</span>
              </div>
              <div className="border border-[var(--border)] px-4 py-3 bg-[#FFD700] flex justify-between items-center font-black text-lg text-[#2B1B0E] shadow-[var(--shadow-md)]">
                <span>⭐ Tổng XP</span>
                <span>{profile?.xpTotal || 0}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
            <Tabs 
              defaultActiveKey="1" 
              className="[&_.ant-tabs-nav::before]:!border-b-[3px] [&_.ant-tabs-nav::before]:!border-[var(--border)] [&_.ant-tabs-tab]:!text-lg [&_.ant-tabs-tab]:!font-black [&_.ant-tabs-tab]:! [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[#F05A4A]"
              items={[
                { key: '1', label: 'Cài Đặt Chung', children: generalSettingsContent },
                { key: '2', label: 'Gói Cước & Giao Dịch', children: billingContent }
              ]} 
            />
          </div>

        </div>
      </div>

      <Modal
        title={<div className="font-black text-2xl  tracking-tight text-[#2B1B0E] mb-4">Chọn Avatar</div>}
        open={isAvatarModalOpen}
        onCancel={() => setIsAvatarModalOpen(false)}
        footer={null}
        width={700}
        className="[&_.ant-modal-content]:!rounded-[var(--radius-card)] [&_.ant-modal-content]:!border-[3px] [&_.ant-modal-content]:!border-[var(--border)] [&_.ant-modal-content]:!p-8 [&_.ant-modal-content]:!rounded-3xl"
        centered
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {AVATAR_SEEDS.map((seed) => {
            const url = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&backgroundColor=transparent`;
            const isSelected = avatarPreview === url || form.getFieldValue('avatarUrl') === url;
            
            return (
              <div 
                key={seed}
                onClick={() => {
                  setAvatarPreview(url);
                  form.setFieldsValue({ avatarUrl: url });
                  setIsAvatarModalOpen(false);
                }}
                className={`
                  aspect-square rounded-full border border-[var(--border)] border-[var(--border)] overflow-hidden cursor-pointer transition-all duration-200
                  ${isSelected ? 'bg-[#FFD700] ring-4 ring-[#2B1B0E] shadow-[var(--shadow-md)] -translate-y-1' : 'bg-[#F4F3EE] hover:bg-gray-200 shadow-[var(--shadow-md)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)]'}
                `}
              >
                <img src={url} alt={`Avatar ${seed}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Button 
            type="default" 
            onClick={() => setIsAvatarModalOpen(false)}
            className="rounded-xl !bg-[var(--surface-2)] !text-[var(--text)] h-11 px-6 font-semibold border border-[var(--border)] hover:!bg-[var(--border)] cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </Modal>
    </div>
  );
}
