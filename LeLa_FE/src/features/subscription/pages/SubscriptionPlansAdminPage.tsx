import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { message, Modal as AntdModal } from 'antd';
import { subscriptionPlansApi } from '../api/subscription-plans.api';
import type { SubscriptionPlanResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';

type FormValues = {
  planCode: string;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  billingCycle: string;
  billingIntervalCount: number;
  maxOwnedDecks: number;
  maxCardsPerDeck: number;
  maxDailyReviews: number;
  quizEnabled: boolean;
  leaderboardEnabled: boolean;
  offlineEnabled: boolean;
  isActive: boolean;
  displayOrder: number;
};

export function SubscriptionPlansAdminPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanResponse | null>(null);
  
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      currencyCode: 'VND',
      billingCycle: 'MONTHLY',
      billingIntervalCount: 1,
      isActive: true,
      quizEnabled: true,
      leaderboardEnabled: true,
      offlineEnabled: false,
      displayOrder: 0
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionPlansApi.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => 
      editingPlan ? subscriptionPlansApi.update(editingPlan.id, values) : subscriptionPlansApi.create(values),
    onSuccess: () => {
      message.success(editingPlan ? 'Cập nhật gói thành công' : 'Tạo gói thành công');
      setIsModalOpen(false);
      reset();
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => subscriptionPlansApi.delete(id),
    onSuccess: () => {
      message.success('Xóa gói thành công');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const openModal = (plan?: SubscriptionPlanResponse) => {
    if (plan) {
      setEditingPlan(plan);
      reset({
        planCode: plan.planCode,
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        currencyCode: plan.currencyCode,
        billingCycle: plan.billingCycle,
        billingIntervalCount: plan.billingIntervalCount,
        maxOwnedDecks: plan.maxOwnedDecks,
        maxCardsPerDeck: plan.maxCardsPerDeck,
        maxDailyReviews: plan.maxDailyReviews,
        quizEnabled: plan.quizEnabled !== false,
        leaderboardEnabled: plan.leaderboardEnabled !== false,
        offlineEnabled: plan.offlineEnabled === true,
        isActive: plan.isActive !== false,
        displayOrder: plan.displayOrder || 0
      });
    } else {
      setEditingPlan(null);
      reset({
        planCode: '', name: '', description: '', price: 0, currencyCode: 'VND',
        billingCycle: 'MONTHLY', billingIntervalCount: 1, maxOwnedDecks: 10,
        maxCardsPerDeck: 100, maxDailyReviews: 100, quizEnabled: true,
        leaderboardEnabled: true, offlineEnabled: false, isActive: true, displayOrder: 0
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Gói Đăng ký (Subscriptions)</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý các gói Pro/Premium và quyền lợi</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm gói
        </Button>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">Mã gói</th>
                <th className="px-4 py-3">Tên gói</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Chu kỳ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : data?.data?.map((plan) => (
                <tr key={plan.id} className="hover:bg-geist-gray-100/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-geist-gray-900">{plan.planCode}</td>
                  <td className="px-4 py-3 text-geist-gray-1000 font-medium">{plan.name}</td>
                  <td className="px-4 py-3 text-geist-gray-1000">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: plan.currencyCode }).format(plan.price)}</td>
                  <td className="px-4 py-3 text-geist-gray-700">{plan.billingIntervalCount} {plan.billingCycle}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      plan.isActive ? 'bg-geist-success-100 text-geist-success-800' : 'bg-geist-gray-200 text-geist-gray-800'
                    }`}>
                      {plan.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(plan)} title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-geist-red-800 hover:text-geist-red-900 hover:bg-geist-red-100"
                        title="Xóa"
                        onClick={() => {
                          AntdModal.confirm({
                            title: 'Xác nhận xóa',
                            content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?',
                            okText: 'Xóa',
                            cancelText: 'Hủy',
                            okButtonProps: { danger: true },
                            onOk: () => deleteMutation.mutate(plan.id),
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Không có gói nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editingPlan ? 'Chỉnh sửa gói' : 'Thêm gói đăng ký'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showCloseButton={false}
        headerActions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu gói'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Mã gói</label>
              <Input {...register('planCode', { required: true })} placeholder="VD: PRO_1M" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Tên gói</label>
              <Input {...register('name', { required: true })} placeholder="VD: Pro 1 Tháng" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Mô tả ngắn</label>
            <Input {...register('description')} placeholder="VD: Không giới hạn tính năng" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Giá tiền</label>
              <Input type="number" {...register('price', { valueAsNumber: true, required: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Chu kỳ thanh toán</label>
              <select {...register('billingCycle')} className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm">
                <option value="MONTHLY">Hàng tháng</option>
                <option value="YEARLY">Hàng năm</option>
                <option value="LIFETIME">Trọn đời</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Max Bộ thẻ</label>
              <Input type="number" {...register('maxOwnedDecks', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Max Thẻ/Bộ</label>
              <Input type="number" {...register('maxCardsPerDeck', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Max Ôn tập/Ngày</label>
              <Input type="number" {...register('maxDailyReviews', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-geist-gray-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('quizEnabled')} className="rounded border-geist-gray-400 text-geist-blue-700 focus:ring-geist-blue-700 bg-transparent" />
              <span className="text-sm font-medium text-geist-gray-1000">Kích hoạt Quiz</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('leaderboardEnabled')} className="rounded border-geist-gray-400 text-geist-blue-700 focus:ring-geist-blue-700 bg-transparent" />
              <span className="text-sm font-medium text-geist-gray-1000">Tham gia Bảng xếp hạng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="rounded border-geist-gray-400 text-geist-blue-700 focus:ring-geist-blue-700 bg-transparent" />
              <span className="text-sm font-medium text-geist-gray-1000">Đang hoạt động</span>
            </label>
          </div>
          
        </form>
      </Modal>
    </div>
  );
}
