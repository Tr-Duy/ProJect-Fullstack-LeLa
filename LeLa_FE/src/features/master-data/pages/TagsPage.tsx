import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { message, Modal as AntdModal } from 'antd'; // Keeping message for toast notifications
import { tagsApi } from '../api/tags.api';
import type { TagResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';

type FormValues = {
  name: string;
};

export function TagsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagResponse | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => 
      editingTag ? tagsApi.update(editingTag.id, values) : tagsApi.create(values),
    onSuccess: () => {
      message.success(editingTag ? 'Cập nhật thẻ thành công' : 'Tạo thẻ thành công');
      setIsModalOpen(false);
      reset();
      setEditingTag(null);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      message.success('Xóa thẻ thành công');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const openModal = (tag?: TagResponse) => {
    if (tag) {
      setEditingTag(tag);
      reset({ name: tag.name });
    } else {
      setEditingTag(null);
      reset({ name: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Thẻ (Tags)</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý thẻ và danh mục nội dung</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm thẻ
        </Button>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên thẻ</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : data?.data?.content?.map((tag) => (
                <tr key={tag.id} className="hover:bg-geist-gray-100/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-geist-gray-900">{tag.id}</td>
                  <td className="px-4 py-3 text-geist-gray-1000 font-medium">{tag.name}</td>
                  <td className="px-4 py-3 font-mono text-geist-gray-800">{tag.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(tag)} title="Chỉnh sửa">
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
                            onOk: () => deleteMutation.mutate(tag.id),
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.data?.content || data.data.content.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-geist-gray-600">Không tìm thấy thẻ nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editingTag ? 'Chỉnh sửa thẻ' : 'Thêm thẻ'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showCloseButton={false}
        headerActions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Tên thẻ</label>
            <Input 
              {...register('name', { required: true })} 
              placeholder="VD: Ngữ pháp, N5, Giao tiếp..." 
            />
            {errors.name && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>
          
          
        </form>
      </Modal>
    </div>
  );
}
