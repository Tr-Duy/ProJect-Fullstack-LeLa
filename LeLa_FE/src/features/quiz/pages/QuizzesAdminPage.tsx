import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: () => quizzesApi.getAll({ size: 50 }),
  });

  const { data: decksData } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: () => decksApi.getAll({ size: 100 }),
  });

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Bài kiểm tra</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý bài kiểm tra và bài tập</p>
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

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Phân loại</th>
                <th className="px-4 py-3">Mức độ</th>
                <th className="px-4 py-3">Số câu</th>
                <th className="px-4 py-3">Đạt</th>
                <th className="px-4 py-3">Trình độ</th>
                <th className="px-4 py-3">Bộ thẻ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : data?.data?.content?.map((quiz) => {
                const levelObj = levelsData?.find((l: any) => l.id === quiz.levelId);
                const isEasy = quiz.difficulty === 'EASY' || quiz.quizCode?.includes('EASY') || quiz.quizCode?.includes('QUICK');
                const isMedium = quiz.difficulty === 'MEDIUM' || quiz.quizCode?.includes('MEDIUM') || quiz.quizCode?.includes('STD');
                const isHard = quiz.difficulty === 'HARD' || quiz.quizCode?.includes('HARD') || quiz.quizCode?.includes('CHALLENGE');

                return (
                  <tr key={quiz.id} className="hover:bg-geist-gray-100/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-geist-gray-900">{quiz.quizCode}</td>
                    <td className="px-4 py-3 text-geist-gray-1000 font-medium">{quiz.title}</td>
                    <td className="px-4 py-3 text-geist-gray-1000">
                      <span className="font-semibold text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {QUIZ_CATEGORY_MAP[quiz.quizCategory ?? ''] || quiz.quizCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEasy && <span className="font-bold text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 DỄ</span>}
                      {isMedium && <span className="font-bold text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">🟡 VỪA</span>}
                      {isHard && <span className="font-bold text-xs px-2 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300">🔴 KHÓ</span>}
                      {!isEasy && !isMedium && !isHard && <span className="text-gray-400 text-xs">--</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-xs text-gray-700">{quiz.totalQuestions || 0} câu</td>
                    <td className="px-4 py-3 font-bold text-xs text-emerald-700">
                      {quiz.passScore != null ? `${Math.round(Number(quiz.passScore))}%` : '70%'}
                    </td>
                    <td className="px-4 py-3 text-geist-gray-1000 font-medium">
                      {levelObj ? (
                        <span className="font-bold text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {levelObj.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-geist-gray-1000 text-xs">
                      {decksData?.content?.find((d: any) => d.id === quiz.deckId)?.title || (quiz.deckId ? `Deck #${quiz.deckId}` : '--')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        quiz.isActive ? 'bg-geist-success-100 text-geist-success-800 border border-geist-success-300' : 'bg-geist-gray-200 text-geist-gray-800 border border-geist-gray-300'
                      }`}>
                        {quiz.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)} title="Chỉnh sửa">
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
      </div>
    </div>
  );
}
