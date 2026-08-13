import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { languagesApi } from '../api/languages.api';
import type { LanguageResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import { message, Modal as AntdModal } from 'antd'; // Keeping message for toast notifications, or could replace with sonner/toast

type FormValues = {
  languageCode: string;
  name: string;
  nativeName: string;
  flagUrl: string;
  isActive: boolean;
};

export function LanguagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLang, setEditingLang] = useState<LanguageResponse | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { isActive: true }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => 
      editingLang ? languagesApi.update(editingLang.id, values) : languagesApi.create(values),
    onSuccess: () => {
      message.success(editingLang ? 'Cập nhật ngôn ngữ thành công' : 'Tạo ngôn ngữ thành công');
      setIsModalOpen(false);
      reset();
      setEditingLang(null);
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => languagesApi.delete(id),
    onSuccess: () => {
      message.success('Xóa ngôn ngữ thành công');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const openModal = (lang?: LanguageResponse) => {
    if (lang) {
      setEditingLang(lang);
      reset({
        languageCode: lang.languageCode,
        name: lang.name,
        nativeName: lang.nativeName,
        flagUrl: lang.flagUrl,
        isActive: lang.isActive
      });
    } else {
      setEditingLang(null);
      reset({ isActive: true });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Ngôn ngữ</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý ngôn ngữ hệ thống</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm ngôn ngữ
        </Button>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên Tiếng Anh</th>
                <th className="px-4 py-3">Tên Bản Địa</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : data?.data?.map((lang) => (
                <tr key={lang.id} className="hover:bg-geist-gray-100/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-geist-gray-900">{lang.id}</td>
                  <td className="px-4 py-3 font-mono text-geist-gray-900">{lang.languageCode}</td>
                  <td className="px-4 py-3 text-geist-gray-1000 font-medium">{lang.name}</td>
                  <td className="px-4 py-3 text-geist-gray-1000">{lang.nativeName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      lang.isActive ? 'bg-geist-success-100 text-geist-success-800' : 'bg-geist-gray-200 text-geist-gray-800'
                    }`}>
                      {lang.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(lang)} title="Chỉnh sửa">
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
                            onOk: () => deleteMutation.mutate(lang.id),
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-geist-gray-600">Không tìm thấy ngôn ngữ nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editingLang ? 'Chỉnh sửa ngôn ngữ' : 'Thêm ngôn ngữ'}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Mã ngôn ngữ (VD: en, vi)</label>
              <Input {...register('languageCode', { required: true })} />
              {errors.languageCode && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Tên Tiếng Anh</label>
              <Input {...register('name', { required: true })} />
              {errors.name && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Tên Bản Địa</label>
            <Input {...register('nativeName', { required: true })} />
            {errors.nativeName && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Đường dẫn cờ</label>
            <Input {...register('flagUrl', { required: true })} placeholder="https://..." />
            {errors.flagUrl && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isActive"
              className="w-4 h-4 rounded border-geist-gray-400 text-geist-blue-700 focus:ring-geist-blue-700 bg-transparent"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-geist-gray-1000 cursor-pointer">
              Hoạt động
            </label>
          </div>
          
          
        </form>
      </Modal>
    </div>
  );
}
