import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2 } from 'lucide-react';
import { message } from 'antd'; // Keep for simple toasts
import { apiClient } from '../../../shared/lib/api';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';

type TopicFormValues = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

export function TopicsAdminPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TopicFormValues>();

  const nameValue = watch('name');

  // Auto-generate slug from name if slug is empty or user is typing a new topic
  useEffect(() => {
    if (nameValue && !editingTopic) {
      const generatedSlug = nameValue
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, editingTopic, setValue]);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: async () => {
      const res = await apiClient.get('/topics');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/topics', values),
    onSuccess: () => {
      message.success('Tạo chủ đề thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      message.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number, values: any }) => apiClient.patch(`/topics/${id}`, values),
    onSuccess: () => {
      message.success('Cập nhật chủ đề thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      message.error(msg);
    }
  });

  const onSubmit = (values: TopicFormValues) => {
    if (editingTopic) {
      updateMutation.mutate({ id: editingTopic.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const openModal = (topic?: any) => {
    if (topic) {
      setEditingTopic(topic);
      reset({
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        isActive: topic.isActive
      });
    } else {
      setEditingTopic(null);
      reset({ name: '', slug: '', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Quản lý Chủ đề</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Danh sách và thông tin các chủ đề học tập</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Chủ đề
        </Button>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : topics.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Chưa có chủ đề nào</td></tr>
              ) : (
                topics.map((topic: any) => (
                  <tr key={topic.id} className="hover:bg-geist-gray-100/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-geist-gray-900">{topic.id}</td>
                    <td className="px-4 py-3 font-medium text-geist-gray-1000">{topic.name}</td>
                    <td className="px-4 py-3 text-geist-gray-700">{topic.slug}</td>
                    <td className="px-4 py-3 text-geist-gray-700 max-w-xs truncate">{topic.description}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateMutation.mutate({ id: topic.id, values: { isActive: !topic.isActive } })}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center px-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-geist-blue-700 focus:ring-offset-2 transition-colors ${topic.isActive ? 'bg-geist-blue-700' : 'bg-geist-gray-400'}`}
                        role="switch"
                        aria-checked={topic.isActive}
                      >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${topic.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openModal(topic)} title="Chỉnh sửa">
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
        title={editingTopic ? 'Sửa Chủ đề' : 'Thêm Chủ đề'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-xl"
        showCloseButton={false}
        headerActions={
          <>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 px-3 text-sm">Hủy</Button>
            <Button type="submit" form="topic-form" disabled={createMutation.isPending || updateMutation.isPending} className="h-8 px-3 text-sm">
              {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form id="topic-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Tên chủ đề</label>
            <Input {...register('name', { required: true })} />
            {errors.name && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Slug</label>
            <Input {...register('slug', { required: true })} />
            {errors.slug && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Mô tả</label>
            <textarea
              {...register('description')}
              className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              rows={3}
            />
          </div>

          <div className="pt-2 border-t border-geist-gray-300">
            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-geist-gray-400 text-geist-blue-700 focus:ring-geist-blue-700 bg-transparent"
                {...register('isActive')}
              />
              <span className="text-sm font-medium text-geist-gray-1000">Hoạt động</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
