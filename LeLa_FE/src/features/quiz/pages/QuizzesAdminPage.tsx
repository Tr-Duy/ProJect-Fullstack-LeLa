import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Upload, Search, Filter } from 'lucide-react';
import { quizzesApi } from '../api/quizzes.api';
import { decksApi } from '../../study-content/api/decks.api';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import { useNavigate } from 'react-router-dom';
import { message, Modal as AntdModal } from 'antd';
import { Button } from '../../../shared/components/ui/Button';

const QUIZ_CATEGORY_MAP: Record<string, string> = {
  NORMAL: 'Thông thường',
  PLACEMENT: 'Kiểm tra đầu vào',
  FINAL: 'Kiểm tra kết thúc',
  LEVEL_UP: 'Kiểm tra thăng cấp',
};

export function QuizzesAdminPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: examTypesData } = useQuery({
    queryKey: ['admin-exam-types'],
    queryFn: () => examTypesApi.getAll(),
  });

  const toeicId = examTypesData?.[0]?.id;

  const { data: levelsData } = useQuery({
    queryKey: ['admin-levels', toeicId],
    queryFn: () => examTypesApi.getLevels(Number(toeicId)),
    enabled: !!toeicId,
  });

  const { data: decksData } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: () => decksApi.getAll({ size: 300 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-quizzes', page, pageSize, selectedLevelId, selectedDifficulty, searchQuery],
    queryFn: () => quizzesApi.getAll({
      page,
      size: pageSize,
      levelId: selectedLevelId !== 'ALL' ? Number(selectedLevelId) : undefined,
      difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty as any : undefined,
      search: searchQuery.trim() || undefined,
    }),
    placeholderData: (prev) => prev,
  });

  const pageData = data?.data;
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => quizzesApi.delete(id),
    onSuccess: () => {
      message.success('Xóa bài kiểm tra thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => quizzesApi.create(values),
    onSuccess: () => {
      message.success('Import JSON bài kiểm tra thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra khi import'),
  });

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        saveMutation.mutate(json);
      } catch (err) {
        message.error('File JSON không hợp lệ');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản Lý Bài Kiểm Tra (Quizzes)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-bold text-gray-800">{totalElements}</span> bài kiểm tra trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <div>
            <input 
              type="file" 
              accept=".json" 
              id="import-quiz-json" 
              className="hidden" 
              onChange={handleImportJson} 
            />
            <Button variant="outline" onClick={() => document.getElementById('import-quiz-json')?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
          </div>
          <Button onClick={() => navigate('/admin/quizzes/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm bài kiểm tra
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        {/* SEARCH */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã quiz, tiêu đề..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* LEVEL FILTER */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Trình độ:</span>
          <select
            value={selectedLevelId}
            onChange={(e) => {
              setSelectedLevelId(e.target.value);
              setPage(0);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Tất cả Trình độ (Levels)</option>
            {levelsData?.map((lvl: any) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name}
              </option>
            ))}
          </select>
        </div>

        {/* DIFFICULTY FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Độ khó:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(0);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Tất cả Mức độ</option>
            <option value="EASY">🟢 DỄ (5 câu)</option>
            <option value="MEDIUM">🟡 VỪA (10 câu)</option>
            <option value="HARD">🔴 KHÓ (15 câu)</option>
          </select>
        </div>

        {/* PAGE SIZE */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">Mã Quiz</th>
                <th className="px-4 py-3.5">Tiêu đề</th>
                <th className="px-4 py-3.5">Phân loại</th>
                <th className="px-4 py-3.5">Mức độ</th>
                <th className="px-4 py-3.5">Số câu</th>
                <th className="px-4 py-3.5">Đạt</th>
                <th className="px-4 py-3.5">Trình độ (Level)</th>
                <th className="px-4 py-3.5">Bộ thẻ (Deck)</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-500 font-medium">Đang tải dữ liệu bài kiểm tra...</td></tr>
              ) : pageData?.content?.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-500 font-medium">Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc.</td></tr>
              ) : pageData?.content?.map((quiz) => {
                const levelObj = levelsData?.find((l: any) => l.id === quiz.levelId);
                const isEasy = quiz.difficulty === 'EASY' || quiz.quizCode?.includes('EASY') || quiz.quizCode?.includes('QUICK');
                const isMedium = quiz.difficulty === 'MEDIUM' || quiz.quizCode?.includes('MEDIUM') || quiz.quizCode?.includes('STD');
                const isHard = quiz.difficulty === 'HARD' || quiz.quizCode?.includes('HARD') || quiz.quizCode?.includes('CHALLENGE');

                return (
                  <tr key={quiz.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 font-semibold">{quiz.quizCode}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{quiz.title}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {QUIZ_CATEGORY_MAP[quiz.quizCategory ?? ''] || quiz.quizCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEasy && <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 DỄ</span>}
                      {isMedium && <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300">🟡 VỪA</span>}
                      {isHard && <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300">🔴 KHÓ</span>}
                      {!isEasy && !isMedium && !isHard && <span className="text-gray-400 text-xs">--</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-xs text-gray-700">{quiz.totalQuestions || 0} câu</td>
                    <td className="px-4 py-3 font-bold text-xs text-emerald-700">
                      {quiz.passScore != null ? `${Math.round(Number(quiz.passScore))}%` : '70%'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {levelObj ? (
                        <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {levelObj.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-xs font-medium">
                      {decksData?.content?.find((d: any) => d.id === quiz.deckId)?.title || (quiz.deckId ? `Deck #${quiz.deckId}` : '--')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        quiz.isActive ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-200 text-gray-800 border border-gray-300'
                      }`}>
                        {quiz.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)} title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Xóa"
                          onClick={() => {
                            AntdModal.confirm({
                              title: 'Xác nhận xóa',
                              content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài kiểm tra và tất cả câu hỏi bên trong?',
                              okText: 'Xóa',
                              okType: 'danger',
                              cancelText: 'Hủy',
                              onOk: () => deleteMutation.mutate(quiz.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 font-medium">
            Hiển thị <span className="font-bold text-gray-900">{totalElements > 0 ? page * pageSize + 1 : 0}</span> đến <span className="font-bold text-gray-900">{Math.min((page + 1) * pageSize, totalElements)}</span> trong tổng số <span className="font-bold text-gray-900">{totalElements}</span> Bài kiểm tra
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            >
              Trang trước
            </Button>
            <span className="text-sm font-semibold text-gray-700 px-3">
              Trang {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
