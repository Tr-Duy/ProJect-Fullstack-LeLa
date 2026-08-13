import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Bell, Send } from 'lucide-react';
import { message } from 'antd';
import { notificationsApi } from '../api/notifications.api';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';

type FormValues = {
  title: string;
  message: string;
  type: string;
};

export function NotificationsAdminPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { type: 'SYSTEM' }
  });

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => notificationsApi.getAllAdmin({ size: 50, sort: 'createdAt,desc' }),
  });

  const broadcastMutation = useMutation({
    mutationFn: (values: FormValues) => notificationsApi.broadcast(values),
    onSuccess: () => {
      message.success('Gửi thông báo thành công');
      reset();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo');
    },
  });

  const onSubmit = (values: FormValues) => {
    broadcastMutation.mutate(values);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Gửi thông báo toàn hệ thống
        </h1>
        <p className="text-sm text-geist-gray-700 mt-1">
          Gửi thông báo đẩy đến tất cả người dùng trong hệ thống (System Alert).
        </p>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Tiêu đề thông báo</label>
            <Input 
              {...register('title', { required: 'Vui lòng nhập tiêu đề' })} 
              placeholder="VD: Bảo trì hệ thống đêm nay"
              className="w-full"
            />
            {errors.title && <span className="text-xs text-geist-red-800">{errors.title.message}</span>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Nội dung</label>
            <textarea 
              {...register('message', { required: 'Vui lòng nhập nội dung' })} 
              placeholder="Nhập nội dung chi tiết của thông báo..."
              className="flex w-full min-h-[120px] resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 placeholder:text-geist-gray-600 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              rows={5}
            />
            {errors.message && <span className="text-xs text-geist-red-800">{errors.message.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Loại thông báo</label>
            <select 
              {...register('type')}
              className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
            >
              <option value="SYSTEM">Cảnh báo hệ thống</option>
              <option value="NEW_CONTENT">Cập nhật tính năng / Nội dung mới</option>
              <option value="ACHIEVEMENT">Sự kiện / Khuyến mãi</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={broadcastMutation.isPending} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-2" />
              {broadcastMutation.isPending ? 'Đang gửi...' : 'Phát sóng ngay'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-12">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-geist-gray-1000">Lịch sử thông báo</h2>
          <p className="text-sm text-geist-gray-700 mt-1">Danh sách tất cả thông báo trong hệ thống.</p>
        </div>

        <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
                <tr>
                  <th className="px-4 py-3">Ngày gửi</th>
                  <th className="px-4 py-3">Người nhận</th>
                  <th className="px-4 py-3">Tiêu đề</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Đã đọc</th>
                  <th className="px-4 py-3">Lỗi (Nếu có)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geist-gray-300">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
                ) : notificationsData?.data?.content?.map((notif: any) => (
                  <tr key={notif.id} className="hover:bg-geist-gray-100/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-geist-gray-700 text-xs">
                      {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-geist-gray-1000 font-medium">User {notif.userId}</td>
                    <td className="px-4 py-3 text-geist-gray-1000 max-w-[200px] truncate" title={notif.title}>{notif.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        notif.status === 'FAILED' ? 'bg-geist-red-100 text-geist-red-800' 
                        : notif.status === 'DELIVERED' ? 'bg-geist-success-100 text-geist-success-800'
                        : 'bg-geist-gray-200 text-geist-gray-800'
                      }`}>
                        {notif.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-geist-gray-700">
                      {notif.isRead ? (
                        <span className="text-geist-success-700">Đã đọc</span>
                      ) : (
                        <span>Chưa đọc</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-geist-red-800" title={notif.failureReason || ''}>
                      {notif.failedAt && <div className="text-xs font-mono">{new Date(notif.failedAt).toLocaleString('vi-VN')}</div>}
                      {notif.failureReason}
                    </td>
                  </tr>
                ))}
                {(!notificationsData?.data?.content || notificationsData.data.content.length === 0) && !isLoading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Chưa có thông báo nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
