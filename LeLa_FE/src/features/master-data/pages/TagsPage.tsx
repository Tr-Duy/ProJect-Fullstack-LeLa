import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Search, Tag as TagIcon } from 'lucide-react';
import { message, Modal as AntdModal } from 'antd';
import { tagsApi } from '../api/tags.api';
import type { TagResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';

type FormValues = {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

export function TagsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll({ size: 100 }),
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
      reset({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
        isActive: tag.isActive ?? true
      });
    } else {
      setEditingTag(null);
      reset({
        name: '',
        slug: '',
        description: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  const tagsList = data?.data?.content || [];
  const filteredTags = tagsList.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-blue-600" />
            Quản Lý Thẻ Từ Vựng (Tags)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Phân loại và quản lý các chủ đề từ vựng TOEIC</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm thẻ mới
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm thẻ theo tên, slug hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-sm font-medium text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{filteredTags.length}</span> / {tagsList.length} thẻ
        </span>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Tên Thẻ (Topic)</th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-4 py-3.5">Mô tả</th>
                <th className="px-4 py-3.5 text-center">Số Deck</th>
                <th className="px-4 py-3.5 text-center">Số Cards</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 font-medium">Đang tải danh sách thẻ...</td></tr>
              ) : filteredTags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 font-semibold">{tag.id}</td>
                  <td className="px-4 py-3 text-gray-900 font-bold">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200">
                      🏷️ {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{tag.slug}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{tag.description || '--'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {tag.deckCount ?? 0} decks
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                      {tag.cardCount ?? 0} cards
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      tag.isActive ?? true ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-200 text-gray-800 border border-gray-300'
                    }`}>
                      {tag.isActive ?? true ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openModal(tag)} title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Xóa"
                        onClick={() => {
                          AntdModal.confirm({
                            title: 'Xác nhận xóa thẻ',
                            content: `Bạn có chắc chắn muốn xóa thẻ "${tag.name}"?`,
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
              {filteredTags.length === 0 && !isLoading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 font-medium">Không tìm thấy thẻ nào phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT/CREATE MODAL */}
      <Modal
        title={editingTag ? 'Chỉnh sửa Thẻ Từ Vựng' : 'Thêm Thẻ Từ Vựng Mới'}
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
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Tên Thẻ (Topic)</label>
            <Input 
              {...register('name', { required: 'Tên thẻ không được để trống' })} 
              placeholder="VD: Business, Travel, Hotel..." 
            />
            {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Slug (URL)</label>
            <Input 
              {...register('slug')} 
              placeholder="VD: business, travel, hotel (để trống tự tạo)" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Mô tả chủ đề</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Mô tả nội dung chủ đề từ vựng..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
