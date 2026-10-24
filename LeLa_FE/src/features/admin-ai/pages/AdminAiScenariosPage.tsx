import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAiApi } from '../api/adminAiApi';
import { ScenarioModal } from '../components/scenarios/ScenarioModal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import {
  Mic,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  Layers,
  Bot,
  User,
  BookOpen
} from 'lucide-react';
import { message, Pagination, Popconfirm, Tooltip } from 'antd';
import type { AdminScenario, AdminScenarioRequest } from '../types/adminAi';

export const AdminAiScenariosPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<AdminScenario | null>(null);

  // Fetch topics for dropdown filter
  const { data: topics = [] } = useQuery({
    queryKey: ['admin-topics-dropdown'],
    queryFn: () => adminAiApi.getTopics(),
  });

  // Fetch scenarios list
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-scenarios', search, selectedTopic, selectedStatus, currentPage, pageSize],
    queryFn: () =>
      adminAiApi.getScenarios({
        search: search.trim() || undefined,
        topicId: selectedTopic,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        page: currentPage - 1,
        size: pageSize,
      }),
  });

  const scenarios: AdminScenario[] = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: AdminScenarioRequest) => adminAiApi.createScenario(data),
    onSuccess: () => {
      message.success('Tạo kịch bản AI mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-scenarios'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo kịch bản');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminScenarioRequest }) =>
      adminAiApi.updateScenario(id, data),
    onSuccess: () => {
      message.success('Cập nhật kịch bản thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-scenarios'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật kịch bản');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminAiApi.deleteScenario(id),
    onSuccess: () => {
      message.success('Đã xóa hoặc chuyển trạng thái kịch bản thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-scenarios'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể xóa kịch bản này');
    },
  });

  // Clone mutation
  const cloneMutation = useMutation({
    mutationFn: (id: number) => adminAiApi.cloneScenario(id),
    onSuccess: (cloned) => {
      message.success(`Đã nhân bản kịch bản "${cloned.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ['admin-scenarios'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể nhân bản kịch bản');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => adminAiApi.toggleScenarioStatus(id),
    onSuccess: (updated) => {
      message.success(
        `Kịch bản đã chuyển sang trạng thái ${updated.isActive ? 'XUẤT BẢN' : 'BẢN NHÁP'}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-scenarios'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể chuyển trạng thái');
    },
  });

  const handleOpenCreate = () => {
    setEditingScenario(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (scenario: AdminScenario) => {
    setEditingScenario(scenario);
    setIsModalOpen(true);
  };

  const handleSaveScenario = async (data: AdminScenarioRequest) => {
    if (editingScenario) {
      await updateMutation.mutateAsync({ id: editingScenario.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-geist-gray-300">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[var(--brand-500)] flex items-center justify-center shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-geist-gray-1000">
                Quản lý Kịch bản AI Voice
              </h1>
              <p className="text-xs text-geist-gray-600 mt-0.5">
                Thiết lập tình huống đàm thoại thông minh, vai trò và system prompt theo khung năng lực LeLa
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo kịch bản mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-geist-bg-100 p-4 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-geist-gray-500 absolute left-3 top-3" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kịch bản, vai trò..."
              className="pl-9 text-sm"
            />
          </div>

          {/* Topic Dropdown */}
          <div className="w-full sm:w-52">
            <select
              value={selectedTopic || ''}
              onChange={(e) => {
                setSelectedTopic(e.target.value ? Number(e.target.value) : undefined);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            >
              <option value="">Tất cả chủ đề</option>
              {topics.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs/Select */}
          <div className="flex rounded-lg border border-geist-gray-300 p-1 bg-geist-gray-100 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedStatus === 'ALL'
                  ? 'bg-white shadow-sm text-geist-gray-1000'
                  : 'text-geist-gray-600 hover:text-geist-gray-1000'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('PUBLISHED');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedStatus === 'PUBLISHED'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-geist-gray-600 hover:text-geist-gray-1000'
              }`}
            >
              Đã xuất bản
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('DRAFT');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedStatus === 'DRAFT'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-geist-gray-600 hover:text-geist-gray-1000'
              }`}
            >
              Bản nháp
            </button>
          </div>
        </div>

        <div className="text-xs text-geist-gray-600 flex items-center justify-end">
          Tìm thấy <span className="font-bold text-geist-gray-1000 mx-1">{totalElements}</span> kịch bản
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-sm text-geist-gray-600">Đang tải danh sách kịch bản AI...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-geist-gray-1000">Không tìm thấy kịch bản nào</h3>
            <p className="text-xs text-geist-gray-600 max-w-sm mx-auto">
              Hãy thử thay đổi điều kiện tìm kiếm hoặc tạo một kịch bản AI Voice mới cho học viên trải nghiệm.
            </p>
            <Button onClick={handleOpenCreate} className="bg-[var(--brand-500)] text-white mt-2">
              <Plus className="w-4 h-4 mr-1" /> Tạo kịch bản ngay
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-geist-gray-300 bg-geist-gray-50 text-xs font-semibold text-geist-gray-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tình huống / Tiêu đề</th>
                  <th className="py-3.5 px-4">Chủ đề</th>
                  <th className="py-3.5 px-4">Khung Level</th>
                  <th className="py-3.5 px-4">Vai trò (AI & Learner)</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Lượt học</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geist-gray-200">
                {scenarios.map((sc) => (
                  <tr key={sc.id} className="hover:bg-geist-gray-50/70 transition-colors">
                    {/* Title & Description */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-geist-gray-1000 hover:text-[var(--brand-500)] transition-colors">
                        {sc.title}
                      </div>
                      <div className="text-xs text-geist-gray-500 font-mono mt-0.5 truncate">
                        slug: /{sc.slug}
                      </div>
                      {sc.description && (
                        <div className="text-xs text-geist-gray-600 mt-1 line-clamp-1 italic">
                          {sc.description}
                        </div>
                      )}
                    </td>

                    {/* Topic */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-geist-gray-200 text-geist-gray-800">
                        <BookOpen className="w-3 h-3 text-[var(--brand-500)]" />
                        {sc.topicName || 'Chưa phân loại'}
                      </span>
                    </td>

                    {/* Level Range */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">
                        <Layers className="w-3 h-3 text-[var(--brand-500)]" />
                        {sc.levelMin} - {sc.levelMax}
                      </span>
                    </td>

                    {/* Roles */}
                    <td className="py-4 px-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-geist-gray-900">
                          <Bot className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-geist-gray-600">AI:</span> {sc.aiRole}
                        </div>
                        <div className="flex items-center gap-1.5 text-geist-gray-900">
                          <User className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-medium text-geist-gray-600">User:</span> {sc.userRole}
                        </div>
                      </div>
                    </td>

                    {/* Status badge with quick toggle */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate(sc.id)}
                        title="Bấm để đổi trạng thái Xuất bản / Bản nháp"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                          sc.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sc.isActive ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {sc.isActive ? 'PUBLISHED' : 'DRAFT'}
                      </button>
                    </td>

                    {/* Session Count */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-geist-gray-800">
                        {sc.sessionCount || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Clone Button */}
                        <Tooltip title="Nhân bản (Clone) kịch bản">
                          <button
                            type="button"
                            onClick={() => cloneMutation.mutate(sc.id)}
                            disabled={cloneMutation.isPending}
                            className="p-1.5 rounded-md hover:bg-geist-gray-200 text-geist-gray-700 hover:text-[var(--brand-500)] transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        {/* Edit Button */}
                        <Tooltip title="Chỉnh sửa kịch bản">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sc)}
                            className="p-1.5 rounded-md hover:bg-geist-gray-200 text-geist-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        {/* Delete Button */}
                        <Popconfirm
                          title="Xóa kịch bản AI"
                          description={
                            sc.sessionCount && sc.sessionCount > 0
                              ? 'Kịch bản này đã có phiên học của học viên. Hệ thống sẽ tự động chuyển sang Bản Nháp (Deactivate) để bảo toàn lịch sử học.'
                              : 'Bạn có chắc chắn muốn xóa vĩnh viễn kịch bản này không?'
                          }
                          onConfirm={() => deleteMutation.mutate(sc.id)}
                          okText="Xác nhận"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            type="button"
                            className="p-1.5 rounded-md hover:bg-red-50 text-geist-gray-700 hover:text-red-600 transition-colors cursor-pointer"
                            title="Xóa kịch bản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalElements > 0 && (
          <div className="p-4 border-t border-geist-gray-300 bg-geist-bg-100 flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs text-geist-gray-600">
              Trang {currentPage} / {Math.ceil(totalElements / pageSize)}
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalElements}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <ScenarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveScenario}
        initialData={editingScenario}
        topics={topics}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AdminAiScenariosPage;
