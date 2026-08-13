import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit2, Trash2, Settings2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message, Modal as AntdModal, Switch, Pagination } from 'antd'; // Keeping message for toast notifications
import { decksApi } from '../api/decks.api';
import { languagesApi } from '../../master-data/api/languages.api';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import type { DeckResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import { useAuth } from '../../../shared/providers/AuthProvider';

type FormValues = {
  title: string;
  description: string;
  languageId: number;
  topicId: number;
  examTypeId?: number;
  levelId?: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  coverImageUrl: string;
  displayMode: 'FRONT' | 'BACK' | 'RANDOM';
  isFeatured?: boolean;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  rejectionReason?: string;
  isActive?: boolean;
};

const DIFFICULTY_MAP: Record<string, string> = {
  BEGINNER: 'Sơ cấp',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Cao cấp',
};

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Từ chối',
  ARCHIVED: 'Đã lưu trữ',
};

export function DecksAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckResponse | null>(null);
  const [isPixabayModalOpen, setIsPixabayModalOpen] = useState(false);
  const [pixabayQuery, setPixabayQuery] = useState('');
  const [pixabayResults, setPixabayResults] = useState<any[]>([]);
  const [isPixabayLoading, setIsPixabayLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { difficulty: 'BEGINNER', visibility: 'PUBLIC', displayMode: 'RANDOM', isFeatured: false, isActive: true, status: 'DRAFT' }
  });

  const watchStatus = watch('status');

  const { data: decksData, isLoading } = useQuery({
    queryKey: ['decks-admin', currentPage, pageSize],
    queryFn: () => decksApi.getAll({ page: currentPage - 1, size: pageSize }),
  });

  const { data: languagesData } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.getAll(),
  });

  const { data: topicsData } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: async () => {
      const { apiClient } = await import('../../../shared/lib/api');
      const res = await apiClient.get('/topics');
      return res.data;
    },
  });

  const { data: examTypesData } = useQuery({
    queryKey: ['admin-exam-types'],
    queryFn: () => examTypesApi.getAll(),
  });

  const watchExamTypeId = watch('examTypeId');
  const { data: levelsData } = useQuery({
    queryKey: ['admin-levels', watchExamTypeId],
    queryFn: () => examTypesApi.getLevels(Number(watchExamTypeId)),
    enabled: !!watchExamTypeId,
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editingDeck ? decksApi.update(editingDeck.id, values) : decksApi.create(values),
    onSuccess: () => {
      message.success(editingDeck ? 'Cập nhật bộ thẻ thành công' : 'Tạo bộ thẻ thành công');
      setIsModalOpen(false);
      reset();
      setEditingDeck(null);
      queryClient.invalidateQueries({ queryKey: ['decks-admin'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });
  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormValues> }) => decksApi.update(id, data),
    onSuccess: () => {
      message.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['decks-admin'] });
    },
    onError: () => message.error('Có lỗi xảy ra khi cập nhật'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => decksApi.delete(id),
    onSuccess: () => {
      message.success('Xóa bộ thẻ thành công');
      queryClient.invalidateQueries({ queryKey: ['decks-admin'] });
    },
  });

  const searchPixabayApi = async (query: string) => {
    if (!query) return;
    const apiKey = import.meta.env.VITE_PIXABAY_KEY;
    if (!apiKey) {
      message.error('Chưa cấu hình API Key cho Pixabay trong file .env');
      return;
    }

    setIsPixabayLoading(true);
    try {
      const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=48`);
      const data = await res.json();
      setPixabayResults(data.hits || []);
    } catch (err) {
      message.error('Lỗi khi tìm ảnh');
    } finally {
      setIsPixabayLoading(false);
    }
  };

  const handleSearchPixabay = async (e: React.FormEvent) => {
    e.preventDefault();
    searchPixabayApi(pixabayQuery);
  };

  const openPixabayModal = () => {
    const titleValue = watch('title');
    setIsPixabayModalOpen(true);
    if (titleValue) {
      setPixabayQuery(titleValue);
      searchPixabayApi(titleValue);
    } else {
      setPixabayQuery('');
      setPixabayResults([]);
    }
  };

  const selectPixabayImage = (url: string) => {
    setValue('coverImageUrl', url);
    setIsPixabayModalOpen(false);
    setPixabayQuery('');
    setPixabayResults([]);
  };

  const openModal = (deck?: DeckResponse) => {
    if (deck) {
      setEditingDeck(deck);
      reset({
        title: deck.title,
        description: deck.description || '',
        languageId: deck.languageId,
        topicId: deck.topic?.id || undefined,
        examTypeId: deck.examTypeId,
        levelId: deck.levelId,
        difficulty: deck.difficulty as any,
        visibility: deck.visibility as any,
        coverImageUrl: deck.coverImageUrl || '',
        displayMode: deck.displayMode || 'RANDOM',
        isFeatured: deck.isFeatured,
        status: deck.status as any,
        rejectionReason: deck.rejectionReason || '',
        isActive: deck.isActive
      });
    } else {
      setEditingDeck(null);
      reset({ difficulty: 'BEGINNER', visibility: 'PUBLIC', languageId: undefined, displayMode: 'RANDOM', isFeatured: false, isActive: true, status: 'DRAFT', rejectionReason: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    // ensure languageId and topicId are numbers
    values.languageId = Number(values.languageId);
    values.topicId = Number(values.topicId);
    saveMutation.mutate(values);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Bộ thẻ</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý bộ thẻ và bộ sưu tập học tập</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm bộ thẻ
        </Button>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Chủ đề</th>
                <th className="px-4 py-3">Độ khó</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-center">Số thẻ</th>
                <th className="px-4 py-3">Hiển thị thẻ</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {useMemo(() => {
                if (isLoading) {
                  return <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>;
                }
                if (!decksData?.content || decksData.content.length === 0) {
                  return <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Không tìm thấy bộ thẻ nào</td></tr>;
                }
                return decksData.content.map((deck) => (
                  <tr key={deck.id} className="hover:bg-geist-gray-100/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-geist-gray-900">{deck.id}</td>
                    <td className="px-4 py-3 text-geist-gray-1000 font-medium">{deck.title}</td>
                    <td className="px-4 py-3 text-geist-gray-1000">{deck.topic?.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-geist-gray-200 text-geist-gray-800">
                        {DIFFICULTY_MAP[deck.difficulty] || deck.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${deck.status === 'PUBLISHED' ? 'bg-geist-success-100 text-geist-success-800' : 'bg-geist-gray-200 text-geist-gray-800'
                        }`}>
                        {STATUS_MAP[deck.status] || deck.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium">{deck.totalCards || 0}</td>
                    <td className="px-4 py-3">
                      <select
                        value={deck.displayMode || 'RANDOM'}
                        onChange={(e) => quickUpdateMutation.mutate({ id: deck.id, data: { displayMode: e.target.value as any } })}
                        disabled={quickUpdateMutation.isPending}
                        className="h-7 text-xs rounded border border-geist-gray-300 bg-geist-bg-100 px-2 py-0 focus:outline-none focus:ring-1 focus:ring-geist-blue-700"
                      >
                        <option value="FRONT">Từ vựng</option>
                        <option value="BACK">Ý nghĩa</option>
                        <option value="RANDOM">Ngẫu nhiên</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/decks/${deck.id}/flashcards`)}>
                          <Settings2 className="w-3.5 h-3.5 mr-1" />
                          Thẻ
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openModal(deck)} title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-geist-red-800 hover:text-geist-red-900 hover:bg-geist-red-100"
                          title="Xóa"
                          disabled={!hasRole(['ADMIN', 'CONTENT_CREATOR'])}
                          onClick={() => {
                            AntdModal.confirm({
                              title: 'Xác nhận xóa',
                              content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?',
                              okText: 'Xóa',
                              cancelText: 'Hủy',
                              okButtonProps: { danger: true },
                              onOk: () => deleteMutation.mutate(deck.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ));
              }, [isLoading, decksData?.content, hasRole, quickUpdateMutation.isPending])}
            </tbody>
          </table>
        </div>
      </div>

      {decksData && decksData.totalElements > 0 && (
        <div className="flex justify-end mt-4">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={decksData.totalElements}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            showTotal={(total) => `Tổng ${total} bộ thẻ`}
          />
        </div>
      )}

      <Modal
        title={editingDeck ? 'Chỉnh sửa bộ thẻ' : 'Thêm bộ thẻ'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-4xl"
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
            <label className="text-sm font-medium text-geist-gray-1000">Tiêu đề</label>
            <Input {...register('title', { required: true })} />
            {errors.title && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Mô tả</label>
            <textarea
              {...register('description')}
              className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 placeholder:text-geist-gray-600 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Ngôn ngữ</label>
              <select
                {...register('languageId', { required: true })}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="">Chọn ngôn ngữ...</option>
                {languagesData?.data?.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {errors.languageId && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Chủ đề</label>
              <select
                {...register('topicId', { required: true })}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="">Chọn chủ đề...</option>
                {topicsData?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.topicId && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Hệ thi (Tùy chọn)</label>
              <select
                {...register('examTypeId')}
                onChange={(e) => {
                  setValue('examTypeId', e.target.value ? Number(e.target.value) : undefined);
                  setValue('levelId', undefined); // Reset level when exam changes
                }}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="">Không bắt buộc</option>
                {examTypesData?.map((et: any) => (
                  <option key={et.id} value={et.id}>{et.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Cấp độ (Tùy chọn)</label>
              <select
                {...register('levelId')}
                disabled={!watchExamTypeId}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="">Không bắt buộc</option>
                {levelsData?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Độ khó</label>
              <select
                {...register('difficulty', { required: true })}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="BEGINNER">Sơ cấp</option>
                <option value="INTERMEDIATE">Trung cấp</option>
                <option value="ADVANCED">Cao cấp</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Hiển thị</label>
              <select
                {...register('visibility', { required: true })}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="PUBLIC">Công khai</option>
                <option value="PRIVATE">Riêng tư</option>
                <option value="UNLISTED">Không công khai</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Đường dẫn ảnh bìa</label>
            <div className="flex gap-2">
              <Input {...register('coverImageUrl')} placeholder="https://..." className="flex-1" />
              <Button type="button" variant="outline" onClick={openPixabayModal} className="px-3 flex items-center gap-2" title="Tìm ảnh trên Pixabay">
                <ImageIcon className="w-4 h-4 text-geist-gray-700" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Chế độ hiển thị thẻ</label>
            <div className="flex gap-4 p-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="FRONT" {...register('displayMode')} className="w-4 h-4 text-geist-blue-700 border-geist-gray-400 focus:ring-geist-blue-700 bg-transparent" />
                <span className="text-sm text-geist-gray-1000">Từ vựng trước</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="BACK" {...register('displayMode')} className="w-4 h-4 text-geist-blue-700 border-geist-gray-400 focus:ring-geist-blue-700 bg-transparent" />
                <span className="text-sm text-geist-gray-1000">Ý nghĩa trước</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="RANDOM" {...register('displayMode')} className="w-4 h-4 text-geist-blue-700 border-geist-gray-400 focus:ring-geist-blue-700 bg-transparent" />
                <span className="text-sm text-geist-gray-1000">Ngẫu nhiên</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-geist-gray-300">
            <h3 className="text-sm font-semibold text-geist-gray-1000 mb-4">Cấu hình Quản trị (Admin)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">Trạng thái kiểm duyệt</label>
                <select
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-geist-bg-100 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
                >
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PENDING_REVIEW">Chờ duyệt</option>
                  <option value="PUBLISHED">Đã xuất bản</option>
                  <option value="REJECTED">Từ chối</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </div>

              <div className="flex flex-row items-center gap-6 mt-2 lg:mt-9">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-geist-gray-1000">
                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <Switch size="small" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  Nổi bật
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-geist-gray-1000">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch size="small" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  Hoạt động
                </label>
              </div>
            </div>

            {watchStatus === 'REJECTED' && (
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-geist-red-800">Lý do từ chối (Gửi cho người tạo)</label>
                <textarea
                  {...register('rejectionReason')}
                  className="flex w-full resize-none rounded-md border border-geist-red-400 bg-geist-red-100/10 px-3 py-2 text-sm text-geist-gray-1000 placeholder:text-geist-gray-600 focus:outline-none focus:ring-2 focus:ring-geist-red-700 transition-colors"
                  rows={2}
                  placeholder="Vui lòng cho biết tại sao bộ thẻ này bị từ chối..."
                />
              </div>
            )}
          </div>


        </form>
      </Modal>

      <Modal
        title="Tìm ảnh trên Pixabay"
        isOpen={isPixabayModalOpen}
        onClose={() => setIsPixabayModalOpen(false)}
        className="max-w-4xl"
      >
        <div className="mt-4">
          <form onSubmit={handleSearchPixabay} className="flex gap-2 mb-6">
            <Input
              value={pixabayQuery}
              onChange={(e) => setPixabayQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={isPixabayLoading}>
              Tìm kiếm
            </Button>
          </form>

          {isPixabayLoading ? (
            <div className="text-center py-10 text-geist-gray-600">Đang tìm ảnh...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {pixabayResults.map((img: any) => (
                <div
                  key={img.id}
                  className="cursor-pointer rounded-md overflow-hidden border border-geist-gray-200 hover:-translate-y-1 transition-transform group relative"
                  onClick={() => selectPixabayImage(img.webformatURL)}
                >
                  <img
                    src={img.webformatURL}
                    alt={img.tags}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-medium text-sm">Chọn ảnh</span>
                  </div>
                </div>
              ))}
              {pixabayResults.length === 0 && pixabayQuery && (
                <div className="col-span-full text-center py-10 text-geist-gray-600">
                  Không tìm thấy ảnh nào cho "{pixabayQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
