import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit2, Trash2, Settings2, Image as ImageIcon, Search, RotateCcw, Tag as TagIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message, Modal as AntdModal, Switch, Pagination } from 'antd';
import { decksApi } from '../api/decks.api';
import { languagesApi } from '../../master-data/api/languages.api';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import { tagsApi } from '../../master-data/api/tags.api';
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
  ADVANCED: 'Nâng cao',
};

const STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Từ chối',
  ARCHIVED: 'Đã lưu trữ',
};

const VISIBILITY_MAP: Record<string, string> = {
  PUBLIC: 'Công khai',
  UNLISTED: 'Không niêm yết',
  PRIVATE: 'Riêng tư',
};

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'createdAt,asc', label: 'Cũ nhất' },
  { value: 'title,asc', label: 'Tên A → Z' },
  { value: 'title,desc', label: 'Tên Z → A' },
  { value: 'totalCards,desc', label: 'Nhiều thẻ nhất' },
  { value: 'totalCards,asc', label: 'Ít thẻ nhất' },
  { value: 'enrollmentCount,desc', label: 'Nhiều lượt học nhất' },
  { value: 'enrollmentCount,asc', label: 'Ít lượt học nhất' },
  { value: 'viewCount,desc', label: 'Nhiều lượt xem nhất' },
  { value: 'viewCount,asc', label: 'Ít lượt xem nhất' },
];

export function DecksAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State from URL Query Parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [selectedLevelId, setSelectedLevelId] = useState<string>(searchParams.get('levelId') || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(searchParams.get('topicId') || '');
  const [selectedTagId, setSelectedTagId] = useState<string>(searchParams.get('tagId') || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(searchParams.get('difficulty') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '');
  const [selectedVisibility, setSelectedVisibility] = useState<string>(searchParams.get('visibility') || '');
  const [selectedSort, setSelectedSort] = useState<string>(searchParams.get('sort') || 'createdAt,desc');
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get('size')) || 20);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckResponse | null>(null);
  const [isPixabayModalOpen, setIsPixabayModalOpen] = useState(false);
  const [pixabayQuery, setPixabayQuery] = useState('');
  const [pixabayResults, setPixabayResults] = useState<any[]>([]);
  const [isPixabayLoading, setIsPixabayLoading] = useState(false);

  // Debounce search term (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== (searchParams.get('search') || '')) {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync state to URL Query Parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedLevelId) params.levelId = selectedLevelId;
    if (selectedTopicId) params.topicId = selectedTopicId;
    if (selectedTagId) params.tagId = selectedTagId;
    if (selectedDifficulty) params.difficulty = selectedDifficulty;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedVisibility) params.visibility = selectedVisibility;
    if (selectedSort && selectedSort !== 'createdAt,desc') params.sort = selectedSort;
    if (currentPage > 1) params.page = String(currentPage);
    if (pageSize !== 20) params.size = String(pageSize);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedLevelId, selectedTopicId, selectedTagId, selectedDifficulty, selectedStatus, selectedVisibility, selectedSort, currentPage, pageSize]);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { difficulty: 'BEGINNER', visibility: 'PUBLIC', displayMode: 'RANDOM', isFeatured: false, isActive: true, status: 'DRAFT' }
  });

  const watchStatus = watch('status');

  // Compute sort parameters
  const [sortBy, direction] = useMemo(() => {
    const parts = selectedSort.split(',');
    return [parts[0] || 'createdAt', parts[1] || 'desc'];
  }, [selectedSort]);

  // Fetch paginated Decks with Backend Filters
  const { data: decksData, isLoading, isError, refetch } = useQuery({
    queryKey: ['decks-admin', debouncedSearch, selectedLevelId, selectedTopicId, selectedTagId, selectedDifficulty, selectedStatus, selectedVisibility, sortBy, direction, currentPage, pageSize],
    queryFn: () => decksApi.getAll({
      search: debouncedSearch || undefined,
      levelId: selectedLevelId ? Number(selectedLevelId) : undefined,
      topicId: selectedTopicId ? Number(selectedTopicId) : undefined,
      tagId: selectedTagId ? Number(selectedTagId) : undefined,
      difficulty: selectedDifficulty || undefined,
      status: selectedStatus || undefined,
      visibility: selectedVisibility || undefined,
      sortBy,
      direction,
      page: currentPage - 1,
      size: pageSize,
    }),
  });

  // Fetch Master Data for Filters
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

  const { data: tagsData } = useQuery({
    queryKey: ['admin-tags-filter'],
    queryFn: () => tagsApi.getAll({ size: 100 }),
  });

  const { data: levelsData } = useQuery({
    queryKey: ['admin-levels-all'],
    queryFn: () => examTypesApi.getLevels(1), // Level 1-4 for TOEIC
  });

  const { data: examTypesData } = useQuery({
    queryKey: ['admin-exam-types'],
    queryFn: () => examTypesApi.getAll(),
  });

  const watchExamTypeId = watch('examTypeId');
  const { data: formLevelsData } = useQuery({
    queryKey: ['admin-levels-form', watchExamTypeId],
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

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedLevelId('');
    setSelectedTopicId('');
    setSelectedTagId('');
    setSelectedDifficulty('');
    setSelectedStatus('');
    setSelectedVisibility('');
    setSelectedSort('createdAt,desc');
    setCurrentPage(1);
  };

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
    values.languageId = Number(values.languageId);
    values.topicId = Number(values.topicId);
    saveMutation.mutate(values);
  };

  const hasActiveFilters = debouncedSearch || selectedLevelId || selectedTopicId || selectedTagId || selectedDifficulty || selectedStatus || selectedVisibility || selectedSort !== 'createdAt,desc';
  const totalElements = decksData?.totalElements || 0;
  const startItem = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalElements);

  return (
    <div className="max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            📚 Quản Lý Bộ Thẻ (Decks)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tìm kiếm, lọc và sắp xếp các bộ thẻ từ vựng trong hệ thống LeLa</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm bộ thẻ
        </Button>
      </div>

      {/* SEARCH & FILTER BAR (Matching /admin/quizzes UI) */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
        {/* SEARCH INPUT */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tên bộ thẻ, mã bộ thẻ, slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold bg-gray-100 px-2 py-0.5 rounded"
            >
              Xóa
            </button>
          )}
        </div>

        {/* FILTERS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* LEVEL FILTER */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Trình độ</label>
            <select
              value={selectedLevelId}
              onChange={(e) => { setSelectedLevelId(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">Tất cả trình độ</option>
              {levelsData?.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* TOPIC FILTER */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Chủ đề</label>
            <select
              value={selectedTopicId}
              onChange={(e) => { setSelectedTopicId(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">Tất cả chủ đề</option>
              {topicsData?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* TAG FILTER */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-blue-600" /> Thẻ (Tag)
            </label>
            <select
              value={selectedTagId}
              onChange={(e) => { setSelectedTagId(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">Tất cả thẻ</option>
              {tagsData?.data?.content?.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          {/* DIFFICULTY FILTER */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Độ khó</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => { setSelectedDifficulty(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">Tất cả độ khó</option>
              <option value="BEGINNER">Sơ cấp (BEGINNER)</option>
              <option value="INTERMEDIATE">Trung cấp (INTERMEDIATE)</option>
              <option value="ADVANCED">Nâng cao (ADVANCED)</option>
            </select>
          </div>

          {/* STATUS FILTER */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PENDING_REVIEW">Chờ duyệt</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="REJECTED">Từ chối</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>

          {/* VISIBILITY FILTER */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hiển thị</label>
            <select
              value={selectedVisibility}
              onChange={(e) => { setSelectedVisibility(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">Tất cả hiển thị</option>
              <option value="PUBLIC">Công khai (PUBLIC)</option>
              <option value="UNLISTED">Không niêm yết (UNLISTED)</option>
              <option value="PRIVATE">Riêng tư (PRIVATE)</option>
            </select>
          </div>
        </div>

        {/* BOTTOM TOOLBAR: SORT, PAGE SIZE, RESET */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* SORT BY */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Sắp xếp:</span>
              <select
                value={selectedSort}
                onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* PAGE SIZE SELECT */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>
          </div>

          {/* RESET BUTTON */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* TABLE DATA DISPLAY */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Tiêu đề & Mã Deck</th>
                <th className="px-4 py-3.5">Trình độ</th>
                <th className="px-4 py-3.5">Chủ đề</th>
                <th className="px-4 py-3.5">Thẻ (Tags)</th>
                <th className="px-4 py-3.5 text-center">Độ khó</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Hiển thị</th>
                <th className="px-4 py-3.5 text-center">Số thẻ</th>
                <th className="px-4 py-3.5 text-center">Chế độ xem</th>
                <th className="px-4 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Đang tải danh sách bộ thẻ...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-red-600 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <span>Không thể tải danh sách bộ thẻ.</span>
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                        Thử lại
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : decksData?.content?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <span className="font-bold text-gray-800 text-base">KHÔNG TÌM THẤY BỘ THẺ PHÙ HỢP</span>
                      <p className="text-xs text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.</p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2 text-xs">
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                decksData?.content?.map((deck) => (
                  <tr key={deck.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 font-bold">{deck.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-bold text-gray-900">{deck.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                            {deck.deckCode}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">/{deck.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {deck.levelName ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          🎯 {deck.levelName}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-mono">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">
                      {deck.topic?.name || '--'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {deck.tags && deck.tags.length > 0 ? (
                          <>
                            {deck.tags.slice(0, 3).map((t) => (
                              <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                #{t.name}
                              </span>
                            ))}
                            {deck.tags.length > 3 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                +{deck.tags.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        {DIFFICULTY_MAP[deck.difficulty] || deck.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        deck.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-300' :
                        deck.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                        deck.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {STATUS_MAP[deck.status] || deck.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                      {VISIBILITY_MAP[deck.visibility] || deck.visibility}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-xs text-gray-800">
                      {deck.totalCards || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={deck.displayMode || 'RANDOM'}
                        onChange={(e) => quickUpdateMutation.mutate({ id: deck.id, data: { displayMode: e.target.value as any } })}
                        disabled={quickUpdateMutation.isPending}
                        className="h-7 text-xs rounded border border-gray-300 bg-white px-2 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      >
                        <option value="FRONT">Từ vựng</option>
                        <option value="BACK">Ý nghĩa</option>
                        <option value="RANDOM">Ngẫu nhiên</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Xóa"
                          disabled={!hasRole(['ADMIN', 'CONTENT_CREATOR'])}
                          onClick={() => {
                            AntdModal.confirm({
                              title: 'Xác nhận xóa bộ thẻ',
                              content: `Bạn có chắc chắn muốn xóa bộ thẻ "${deck.title}"?`,
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION BAR */}
      {totalElements > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-600">
            Hiển thị <span className="font-bold text-gray-900">{startItem}-{endItem}</span> trong{' '}
            <span className="font-bold text-gray-900">{totalElements}</span> bộ thẻ
            {hasActiveFilters && <span className="text-blue-600 font-bold ml-1">(đã lọc)</span>}
          </div>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalElements}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger={false}
          />
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      <Modal
        title={editingDeck ? 'Chỉnh sửa Bộ Thẻ' : 'Thêm Bộ Thẻ Mới'}
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
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Tiêu đề</label>
            <Input {...register('title', { required: 'Tiêu đề không được để trống' })} placeholder="VD: TOEIC 500-700 - Hotel..." />
            {errors.title && <span className="text-xs text-red-600">{errors.title.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Mô tả</label>
            <textarea
              {...register('description')}
              className="flex w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              rows={3}
              placeholder="Mô tả nội dung bộ thẻ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Ngôn ngữ</label>
              <select
                {...register('languageId', { required: 'Chọn ngôn ngữ' })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn ngôn ngữ...</option>
                {languagesData?.data?.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Chủ đề</label>
              <select
                {...register('topicId', { required: 'Chọn chủ đề' })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn chủ đề...</option>
                {topicsData?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Hệ thi (Tùy chọn)</label>
              <select
                {...register('examTypeId')}
                onChange={(e) => {
                  setValue('examTypeId', e.target.value ? Number(e.target.value) : undefined);
                  setValue('levelId', undefined);
                }}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Không bắt buộc</option>
                {examTypesData?.map((et: any) => (
                  <option key={et.id} value={et.id}>{et.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Cấp độ (Tùy chọn)</label>
              <select
                {...register('levelId')}
                disabled={!watchExamTypeId}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Không bắt buộc</option>
                {formLevelsData?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Độ khó</label>
              <select
                {...register('difficulty', { required: true })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BEGINNER">Sơ cấp (BEGINNER)</option>
                <option value="INTERMEDIATE">Trung cấp (INTERMEDIATE)</option>
                <option value="ADVANCED">Cao cấp (ADVANCED)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Hiển thị</label>
              <select
                {...register('visibility', { required: true })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Công khai (PUBLIC)</option>
                <option value="PRIVATE">Riêng tư (PRIVATE)</option>
                <option value="UNLISTED">Không niêm yết (UNLISTED)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Đường dẫn ảnh bìa</label>
            <div className="flex gap-2">
              <Input {...register('coverImageUrl')} placeholder="https://..." className="flex-1" />
              <Button type="button" variant="outline" onClick={openPixabayModal} className="px-3 flex items-center gap-2" title="Tìm ảnh trên Pixabay">
                <ImageIcon className="w-4 h-4 text-gray-700" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900">Chế độ hiển thị thẻ</label>
            <div className="flex gap-4 p-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="FRONT" {...register('displayMode')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-900">Từ vựng trước</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="BACK" {...register('displayMode')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-900">Ý nghĩa trước</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="RANDOM" {...register('displayMode')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-900">Ngẫu nhiên</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cấu hình Quản trị (Admin)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Trạng thái kiểm duyệt</label>
                <select
                  {...register('status')}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PENDING_REVIEW">Chờ duyệt</option>
                  <option value="PUBLISHED">Đã xuất bản</option>
                  <option value="REJECTED">Từ chối</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </div>

              <div className="flex flex-row items-center gap-6 mt-2 lg:mt-7">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900">
                  <Controller
                    name="isFeatured"
                    control={control}
                    render={({ field }) => (
                      <Switch size="small" checked={field.value} onChange={field.onChange} />
                    )}
                  />
                  Nổi bật
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900">
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
              <div className="space-y-1 mt-4">
                <label className="text-sm font-medium text-red-600">Lý do từ chối (Gửi cho người tạo)</label>
                <textarea
                  {...register('rejectionReason')}
                  className="flex w-full resize-none rounded-md border border-red-300 bg-red-50/20 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                  placeholder="Vui lòng cho biết tại sao bộ thẻ này bị từ chối..."
                />
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* PIXABAY MODAL */}
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
            <div className="text-center py-10 text-gray-500">Đang tìm ảnh...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {pixabayResults.map((img: any) => (
                <div
                  key={img.id}
                  className="cursor-pointer rounded-md overflow-hidden border border-gray-200 hover:-translate-y-1 transition-transform group relative"
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
                <div className="col-span-full text-center py-10 text-gray-500">
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
