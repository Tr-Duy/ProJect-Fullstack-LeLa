import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trophy, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { message } from 'antd';
import { achievementsApi } from '../api/achievements.api';
import type { AchievementResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';

type FormValues = {
  code: string;
  title: string;
  description?: string;
  iconUrl?: string;
  category: string;
  conditionType: string;
  conditionValue: number;
  xpReward: number;
  isActive?: boolean;
};

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả Danh mục' },
  { key: 'START', label: 'Bắt đầu học' },
  { key: 'STREAK', label: 'Chuỗi ngày học (Streak)' },
  { key: 'FLASHCARDS', label: 'Từ vựng (Flashcards)' },
  { key: 'DECK', label: 'Bộ thẻ (Decks)' },
  { key: 'QUIZ', label: 'Bài kiểm tra (Quiz)' },
  { key: 'TOEIC', label: 'Trình độ TOEIC' },
  { key: 'TOPIC', label: 'Chủ đề (Topic Explorer)' },
  { key: 'MASTERY', label: 'Bậc thầy (Mastery)' },
];

export function AchievementsAdminPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<AchievementResponse | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: () => achievementsApi.getAllAdmin(),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editingAch ? achievementsApi.updateAdmin(editingAch.id, values) : achievementsApi.createAdmin(values),
    onSuccess: () => {
      message.success(editingAch ? 'Cập nhật thành tựu thành công' : 'Tạo thành tựu mới thành công');
      setIsModalOpen(false);
      reset();
      setEditingAch(null);
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thành tựu'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => achievementsApi.toggleActiveAdmin(id),
    onSuccess: () => {
      message.success('Thay đổi trạng thái thành tựu thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const openModal = (ach?: AchievementResponse) => {
    if (ach) {
      setEditingAch(ach);
      reset({
        code: ach.code,
        title: ach.title,
        description: ach.description || '',
        iconUrl: ach.iconUrl || '🏆',
        category: ach.category || 'START',
        conditionType: ach.conditionType || 'XP',
        conditionValue: ach.conditionValue || 1,
        xpReward: ach.xpReward || 50,
        isActive: ach.isActive ?? true,
      });
    } else {
      setEditingAch(null);
      reset({
        code: '',
        title: '',
        description: '',
        iconUrl: '🏆',
        category: 'START',
        conditionType: 'XP',
        conditionValue: 1,
        xpReward: 50,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  const achList = data?.data || [];
  const filteredList = achList.filter(a => {
    const matchesCat = selectedCat === 'ALL' || a.category?.toUpperCase() === selectedCat;
    const matchesSearch = searchQuery === '' || 
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Quản Lý Thành Tựu & Gamification (Achievements)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình danh hiệu, điều kiện mở khóa và phần thưởng XP</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm thành tựu
        </Button>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên thành tựu, mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Danh mục:</span>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          >
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <span className="text-sm font-medium text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{filteredList.length}</span> / {achList.length} thành tựu
        </span>
      </div>

      {/* TABLE */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">Mã (Code)</th>
                <th className="px-4 py-3.5">Icon & Tên Thành Tựu</th>
                <th className="px-4 py-3.5">Danh mục</th>
                <th className="px-4 py-3.5">Điều kiện Unlock</th>
                <th className="px-4 py-3.5 text-center">Thưởng XP</th>
                <th className="px-4 py-3.5 text-center">Số người đạt</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 font-medium">Đang tải danh sách thành tựu...</td></tr>
              ) : filteredList.map((ach) => (
                <tr key={ach.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 font-bold">{ach.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1 bg-amber-50 rounded-lg border border-amber-200">{ach.iconUrl || '🏆'}</span>
                      <div>
                        <div className="font-bold text-gray-900">{ach.title}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">{ach.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      {ach.category || 'GENERAL'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">
                    <span className="font-mono font-bold text-blue-700">{ach.conditionType}</span> ≥ <span className="font-bold text-amber-700">{ach.conditionValue}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-extrabold text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      +{ach.xpReward} XP
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-xs text-gray-700">
                    {ach.unlockedCount ?? 0} người
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleMutation.mutate(ach.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        ach.isActive ?? true ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {ach.isActive ?? true ? <CheckCircle className="w-3 h-3 text-green-600" /> : <XCircle className="w-3 h-3 text-gray-500" />}
                      {ach.isActive ?? true ? 'Bật' : 'Tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(ach)} title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && !isLoading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 font-medium">Không tìm thấy thành tựu nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / CREATE MODAL */}
      <Modal
        title={editingAch ? 'Chỉnh sửa Thành Tựu' : 'Thêm Thành Tựu Mới'}
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Mã (Code)</label>
              <Input
                {...register('code', { required: 'Mã không được để trống' })}
                placeholder="VD: STREAK_7_DAYS"
              />
              {errors.code && <span className="text-xs text-red-600">{errors.code.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Icon / Emoji</label>
              <Input
                {...register('iconUrl')}
                placeholder="VD: 🔥, 🏆, 🎯, 📖"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Tên Thành Tựu</label>
            <Input
              {...register('title', { required: 'Tiêu đề không được để trống' })}
              placeholder="VD: Một tuần nỗ lực"
            />
            {errors.title && <span className="text-xs text-red-600">{errors.title.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Mô tả chi tiết</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="VD: Duy trì chuỗi học tập 7 ngày liên tiếp."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Danh mục (Category)</label>
              <select
                {...register('category', { required: true })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="START">Bắt đầu (START)</option>
                <option value="STREAK">Chuỗi học (STREAK)</option>
                <option value="FLASHCARDS">Từ vựng (FLASHCARDS)</option>
                <option value="DECK">Bộ thẻ (DECK)</option>
                <option value="QUIZ">Bài kiểm tra (QUIZ)</option>
                <option value="TOEIC">Trình độ TOEIC (TOEIC)</option>
                <option value="TOPIC">Chủ đề (TOPIC)</option>
                <option value="MASTERY">Bậc thầy (MASTERY)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Loại điều kiện (Condition Type)</label>
              <select
                {...register('conditionType', { required: true })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              >
                <option value="STREAK">STREAK</option>
                <option value="CARDS_REVIEWED">CARDS_REVIEWED</option>
                <option value="DECKS_LEARNED">DECKS_LEARNED</option>
                <option value="QUIZ_PASS">QUIZ_PASS</option>
                <option value="QUIZ_PERFECT">QUIZ_PERFECT</option>
                <option value="TOEIC_LEVEL">TOEIC_LEVEL</option>
                <option value="TOPIC_DECKS">TOPIC_DECKS</option>
                <option value="XP">XP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Giá trị điều kiện (Condition Value &gt; 0)</label>
              <Input
                type="number"
                {...register('conditionValue', { required: true, min: 1 })}
                placeholder="VD: 7"
              />
              {errors.conditionValue && <span className="text-xs text-red-600">Phải lớn hơn 0</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Phần thưởng XP (&gt; 0)</label>
              <Input
                type="number"
                {...register('xpReward', { required: true, min: 1 })}
                placeholder="VD: 100"
              />
              {errors.xpReward && <span className="text-xs text-red-600">Phải lớn hơn 0</span>}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
