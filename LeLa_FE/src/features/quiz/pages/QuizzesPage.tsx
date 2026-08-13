import { useQuery } from '@tanstack/react-query';
import { Button, Card, Skeleton } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes.api';

export function QuizzesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category');
  const examTypeId = searchParams.get('examType');
  const levelIdParam = searchParams.get('levelId');

  // Validate query params: avoid Number(undefined|null|bad) -> NaN
  const parsedLevelId = levelIdParam && !Number.isNaN(Number(levelIdParam)) ? Number(levelIdParam) : undefined;
  // For FINAL flow prefer to let backend infer examType from authenticated user
  const parsedExamTypeId = category === 'FINAL'
    ? undefined
    : (examTypeId && !Number.isNaN(Number(examTypeId)) ? Number(examTypeId) : undefined);

  const { data: quizzesResp, isLoading } = useQuery({
    queryKey: ['quizzes', category, parsedExamTypeId, parsedLevelId],
    queryFn: async () => {
      if (category) {
        return quizzesApi.search(
          category,
          parsedExamTypeId,
          parsedLevelId
        );
      }
      return quizzesApi.getAll({ size: 100 });
    },
  });

  const quizzes = category
    ? ((quizzesResp?.data as any[]) || [])
    : (((quizzesResp as any)?.data?.content as any[]) || []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F4F3EE]">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#1D2A3A] mb-2">
          {category === 'PLACEMENT'
            ? 'Bai kiem tra dau vao'
            : category === 'FINAL'
              ? 'Bai kiem tra ket thuc'
              : category === 'LEVEL_UP'
                ? 'Bai kiem tra nang cap'
                : 'Danh sach Bai kiem tra'}
        </h1>
        <p className="text-gray-600 font-bold text-lg">Hoan thanh bai kiem tra de xac dinh nang luc cua ban.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="brutal-card w-full h-[200px]">
              <Skeleton active />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.length > 0 ? (
            quizzes.map((quiz: any) => (
              <div key={quiz.id} className="brutal-card brutal-shadow bg-white p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase text-[#1D2A3A] leading-tight mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4">{quiz.description || 'Khong co mo ta'}</p>
                  {quiz.isLocked && (
                    <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded font-bold text-red-700 text-sm">
                      🔒 {quiz.lockReason || 'Bài kiểm tra đang tạm khóa. Bạn chưa đạt 80% ở lần thi trước. Có thể làm lại sau 24 giờ.'}
                    </div>
                  )}
                </div>
                <Button
                  disabled={quiz.isLocked}
                  className={`w-full brutal-pill font-black uppercase h-10 border-[2px] border-black ${
                    quiz.isLocked
                      ? '!bg-gray-300 !text-gray-600 cursor-not-allowed border-gray-400'
                      : '!bg-[#F05A4A] !text-white hover:!bg-[#d94f41] hover:!translate-y-[-2px]'
                  }`}
                  onClick={() => !quiz.isLocked && navigate(`/quiz/${quiz.id}/start`)}
                >
                  {quiz.isLocked ? 'ĐANG KHÓA' : 'Bat dau lam bai'}
                </Button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center brutal-card bg-white">
              <h2 className="text-2xl font-black text-gray-500">Chua co bai kiem tra nao phu hop.</h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
