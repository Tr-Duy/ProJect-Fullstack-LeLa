import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Skeleton, Modal as AntdModal, message } from 'antd';
import { subscriptionPlansApi } from '../api/subscription-plans.api';
import { userSubscriptionsApi } from '../api/user-subscriptions.api';
import { paymentsApi } from '../api/payments.api';
import type { CheckoutResponse } from '../api/payments.api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { useState, useEffect, useRef } from 'react';

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const pollIntervalRef = useRef<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: () => subscriptionPlansApi.getAll(),
  });

  const { data: mySubsData } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => userSubscriptionsApi.getAll({ size: 100 }),
    enabled: !!user
  });

  const activeSubscriptions = mySubsData?.data?.content?.filter((s: any) => s.status === 'ACTIVE') || [];
  
  // Find the highest tier plan among active subscriptions (prioritize from high to low)
  let activeSubscription = null;
  if (activeSubscriptions.length > 0 && data?.data) {
    activeSubscription = activeSubscriptions.reduce((highest: any, current: any) => {
      const highestPlan = data.data.find((p: any) => p.id === highest.planId);
      const currentPlan = data.data.find((p: any) => p.id === current.planId);
      
      const highestPrice = highestPlan ? highestPlan.price : 0;
      const currentPrice = currentPlan ? currentPlan.price : 0;
      
      return currentPrice > highestPrice ? current : highest;
    }, activeSubscriptions[0]);
  } else if (activeSubscriptions.length > 0) {
    activeSubscription = activeSubscriptions[0];
  }


  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isCheckoutModalOpen || !checkoutData?.paymentId) {
      clearPolling();
      return;
    }

    if (paymentStatus === 'SUCCEEDED' || paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
      clearPolling();
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await paymentsApi.getStatus(checkoutData.paymentId);
        if (res.data) {
          setPaymentStatus(res.data);
          
          if (res.data === 'SUCCEEDED') {
            message.success('Thanh toán thành công! Gói cước của bạn đã được kích hoạt.');
            clearPolling();
            setIsCheckoutModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          } else if (res.data === 'EXPIRED') {
            message.error('Phiên thanh toán đã hết hạn.');
            clearPolling();
          } else if (res.data === 'FAILED') {
            message.error('Thanh toán chưa được xác nhận hoặc có lỗi.');
            clearPolling();
          }
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra trạng thái:', err);
      }
    }, 3000);

    return () => clearPolling();
  }, [isCheckoutModalOpen, checkoutData?.paymentId, paymentStatus, queryClient]);

  const handleModalClose = () => {
    setIsCheckoutModalOpen(false);
    clearPolling();
    setCheckoutData(null);
    setPaymentStatus('');
  };

  const checkoutMutation = useMutation({
    mutationFn: (planId: number) => paymentsApi.checkout({ planId }),
    onSuccess: (res) => {
      if (res.data) {
        setCheckoutData(res.data);
        setPaymentStatus(res.data.status);
        setIsCheckoutModalOpen(true);
      }
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi khi tạo thanh toán');
    }
  });

  const handleSubscribe = (plan: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    checkoutMutation.mutate(plan.id);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-8 relative">
      <Button 
        onClick={() => navigate('/profile')}
        className="absolute top-8 left-8 flex items-center gap-2 brutal-btn !bg-white hover:!-translate-y-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Quay lại Profile</span>
      </Button>

      <div className="max-w-7xl mx-auto text-center mb-16 mt-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-[#1D2A3A] mb-4">
          Nâng cấp trải nghiệm học tập
        </h1>
        <p className="text-xl text-gray-700">Chọn gói phù hợp nhất với nhu cầu của bạn</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {[1, 2, 3].map(i => (
              <div key={i} className="brutal-card bg-white p-8 w-full md:w-1/3 min-h-[500px]">
                <Skeleton active />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 justify-center items-stretch">
            {data?.data?.map((plan) => (
              <div 
                key={plan.id}
                className="brutal-card bg-white p-8 w-full md:w-[350px] flex flex-col hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-black uppercase mb-2">{plan.name}</h2>
                  <p className="text-gray-600 line-clamp-2 min-h-[40px]">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-black text-[#F05A4A]">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: plan.currencyCode || 'VND' }).format(plan.price)}
                  </span>
                  <span className="text-gray-500 font-bold ml-2">/ {plan.billingCycle}</span>
                </div>

                <div className="flex-1 mb-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#2A8B9D]">✓</span>
                    <span className="font-bold">Tối đa {plan.maxOwnedDecks || '∞'} bộ thẻ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#2A8B9D]">✓</span>
                    <span className="font-bold">Tối đa {plan.maxCardsPerDeck || '∞'} thẻ / bộ</span>
                  </div>
                  {plan.quizEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#2A8B9D]">✓</span>
                      <span className="font-bold">Mở khóa tính năng Thi & Quiz</span>
                    </div>
                  )}
                  {plan.leaderboardEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#2A8B9D]">✓</span>
                      <span className="font-bold">Tham gia Bảng xếp hạng</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const isFreePlan = plan.price === 0;
                  const hasThisPlanActive = activeSubscription?.planId === plan.id;
                  const isCurrentlyUsing = hasThisPlanActive || (!activeSubscription && isFreePlan);
                  
                  const activePlanPrice = activeSubscription && data?.data ? 
                    (data.data.find((p: any) => p.id === activeSubscription.planId)?.price || 0) : 0;
                  const isLowerTier = plan.price < activePlanPrice && !isCurrentlyUsing;

                  if (isCurrentlyUsing) {
                    return (
                      <Button 
                        disabled
                        className="w-full brutal-border brutal-shadow h-12 font-black uppercase text-lg !bg-gray-300 !text-gray-600"
                      >
                        Đang sử dụng
                      </Button>
                    );
                  }

                  if (isLowerTier) {
                    return (
                      <Button 
                        disabled
                        className="w-full brutal-border brutal-shadow h-12 font-black uppercase text-lg !bg-gray-200 !text-gray-400 cursor-not-allowed"
                      >
                        Đăng ký ngay
                      </Button>
                    );
                  }

                  return (
                    <Button 
                      className="w-full brutal-border brutal-shadow h-12 font-black uppercase text-lg !bg-[#1D2A3A] !text-white"
                      loading={checkoutMutation.isPending && selectedPlan?.id === plan.id}
                      onClick={() => handleSubscribe(plan)}
                    >
                      Đăng ký ngay
                    </Button>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      <AntdModal
        title={<span className="text-2xl font-black uppercase tracking-tight">Thanh toán {selectedPlan?.name}</span>}
        open={isCheckoutModalOpen}
        onCancel={handleModalClose}
        footer={null}
        centered
        className="brutal-modal"
      >
        {checkoutData && (
          <div className="mt-4 border-2 border-[#1D2A3A] p-4 bg-[#F4F3EE]">
            <p className="text-lg font-bold mb-2">Thông tin thanh toán:</p>
            <div className="flex justify-between items-center border-b-2 border-[#1D2A3A] pb-4 mb-4">
              <span className="text-lg font-bold">Số tiền:</span>
              <span className="text-3xl font-black text-[#F05A4A]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: checkoutData.currency || 'VND' }).format(checkoutData.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b-2 border-[#1D2A3A] pb-4 mb-4">
              <span className="text-lg font-bold">Nội dung chuyển khoản:</span>
              <span className="text-xl font-black text-[#2A8B9D]">{checkoutData.paymentCode}</span>
            </div>
            
            <div className="bg-yellow-100 p-3 border-2 border-yellow-400 mb-6 font-medium text-yellow-800 text-center">
              * Mở ứng dụng ngân hàng và quét mã QR để thanh toán. Giao dịch sẽ được xác nhận tự động.
            </div>

            <div className="flex justify-center mb-6">
              <img 
                src={checkoutData.qrUrl}
                alt="Mã QR Thanh Toán"
                className="w-64 h-64 object-contain border-4 border-[#1D2A3A] p-2 bg-white"
              />
            </div>

            <div className="w-full flex items-center justify-center gap-2 h-12 border-2 border-[#1D2A3A] bg-white font-black uppercase text-lg text-[#1D2A3A]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang chờ thanh toán...</span>
            </div>
          </div>
        )}
      </AntdModal>
    </div>
  );
}
