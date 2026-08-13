import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2 } from 'lucide-react';
import { message } from 'antd'; // Keep for simple toasts
import { apiClient } from '../../../shared/lib/api';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';

type AchievementFormValues = {
  code: string;
  title: string;
  description: string;
  xpReward: number;
  conditionType: string;
  conditionValue: number;
};

export function AchievementsAdminPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AchievementFormValues>();

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/achievements');
      return res.data?.data || res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/admin/achievements', values),
    onSuccess: () => {
      message.success('Tạo thành tựu thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      setIsModalOpen(false);
    },
    onError: () => message.error('Có lỗi xảy ra')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number, values: any }) => apiClient.put(`/admin/achievements/${id}`, values),
    onSuccess: () => {
      message.success('Cập nhật thành tựu thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      setIsModalOpen(false);
    },
    onError: () => message.error('Có lỗi xảy ra')
  });

  const onSubmit = (values: AchievementFormValues) => {
    // Convert numeric fields properly since HTML inputs are strings
    const payload = {
      ...values,
      xpReward: Number(values.xpReward),
      conditionValue: Number(values.conditionValue)
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, values: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      reset({
        code: item.code,
        title: item.title,
        description: item.description,
        xpReward: item.xpReward,
        conditionType: item.conditionType,
        conditionValue: item.conditionValue
      });
    } else {
      setEditingItem(null);
      reset({ 
        code: '', title: '', description: '', 
        xpReward: 0, conditionType: 'TOTAL_DECKS_MASTERY', conditionValue: 0 
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Quản lý Thành tựu</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Hệ thống danh hiệu và phần thưởng gamification</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Thành tựu
        </Button>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên thành tựu</th>
                <th className="px-4 py-3 text-right">Thưởng XP</th>
                <th className="px-4 py-3">Điều kiện</th>
                <th className="px-4 py-3 text-right">Giá trị</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : achievements.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Chưa có thành tựu nào</td></tr>
              ) : (
                achievements.map((item: any) => (
                  <tr key={item.id} className="hover:bg-geist-gray-100/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-geist-gray-900">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-geist-gray-1000">{item.code}</td>
                    <td className="px-4 py-3 text-geist-gray-1000">{item.title}</td>
                    <td className="px-4 py-3 text-right text-geist-blue-700 font-semibold">+{item.xpReward} XP</td>
                    <td className="px-4 py-3 text-geist-gray-700 font-mono text-xs">{item.conditionType}</td>
                    <td className="px-4 py-3 text-right text-geist-gray-900">{item.conditionValue}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openModal(item)} title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editingItem ? 'Sửa Thành tựu' : 'Thêm Thành tựu'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-xl"
        showCloseButton={false}
        headerActions={
          <>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 px-3 text-sm">Hủy</Button>
            <Button type="submit" form="achievement-form" disabled={createMutation.isPending || updateMutation.isPending} className="h-8 px-3 text-sm">
              {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form id="achievement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Mã (Code)</label>
              <Input {...register('code', { required: true })} disabled={!!editingItem} />
              {errors.code && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Tên thành tựu</label>
              <Input {...register('title', { required: true })} />
              {errors.title && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Mô tả</label>
            <textarea
              {...register('description')}
              className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Thưởng XP</label>
            <Input type="number" min="0" {...register('xpReward', { required: true })} />
            {errors.xpReward && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-geist-gray-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Loại điều kiện</label>
              <select
                {...register('conditionType', { required: true })}
                className="flex w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="TOTAL_DECKS_MASTERY">Hoàn thành nhiều bộ thẻ</option>
                <option value="TOTAL_STREAK_DAYS">Chuỗi ngày học liên tiếp</option>
                <option value="FIRST_QUIZ_PERFECT">Bài kiểm tra điểm tuyệt đối</option>
                <option value="TOTAL_XP_REACHED">Đạt mốc XP</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Giá trị mốc</label>
              <Input type="number" min="0" {...register('conditionValue', { required: true })} />
              {errors.conditionValue && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
