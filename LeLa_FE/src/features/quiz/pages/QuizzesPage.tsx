import { useQuery } from '@tanstack/react-query';
import { Button, Card, Skeleton, Tag } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockOutlined, CheckCircleOutlined, BookOutlined, RocketOutlined } from '@ant-design/icons';
import { quizzesApi } from '../api/quizzes.api';
import { useAuth } from '../../../shared/providers/AuthProvider';

export function QuizzesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const category = searchParams.get('category');
  const examTypeId = searchParams.get('examType');
  const levelIdParam = searchParams.get('levelId');

  const parsedLevelId = levelIdParam && !Number.isNaN(Number(levelIdParam)) ? Number(levelIdParam) : undefined;
  const parsedExamTypeId = category === 'FINAL'
    ? undefined
    : (examTypeId && !Number.isNaN(Number(examTypeId)) ? Number(examTypeId) : undefined);

  const { data: quizzesResp, isLoading } = useQuery({
    queryKey: ['quizzes', category, parsedExamTypeId, parsedLevelId, user?.currentLevel?.id],
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
    placeholderData: (prev) => prev,
  });

  const rawQuizzes = category
    ? ((quizzesResp?.data as any[]) || [])
    : (((quizzesResp as any)?.data?.content as any[]) || []);

  // Filter or sort LEVEL_UP quizzes and enforce single AVAILABLE invariant
  const isLevelUpCategory = category === 'LEVEL_UP';
  let levelUpQuizzes = isLevelUpCategory 
    ? [...rawQuizzes].sort((a: any, b: any) => (a.quizCode || '').localeCompare(b.quizCode || ''))
    : rawQuizzes;

  if (isLevelUpCategory) {
    let foundAvailable = false;
    levelUpQuizzes = levelUpQuizzes.map((quiz: any) => {
      if (quiz.attemptStatus === 'AVAILABLE') {
        if (!foundAvailable) {
          foundAvailable = true;
          return { ...quiz, isLocked: false };
        } else {
          return {
            ...quiz,
            attemptStatus: 'LOCKED',
            isLocked: true,
            lockReason: 'Vui lòng hoàn thành bài thi trước đó theo đúng thứ tự chuỗi 10 bài.'
          };
        }
      }
      return quiz;
    });
  }

  // Check if all 10 tests were attempted and all failed
  const allAttemptedAndFailed = isLevelUpCategory && levelUpQuizzes.length > 0 && levelUpQuizzes.every((q: any) => q.isLocked || q.attemptStatus === 'LOCKED');

  const currentLevelName = user?.currentLevel?.name || 'Chưa xác định';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F4F3EE]">
      {/* Header section */}
      <div className="mb-8 brutal-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#1D2A3A] mb-2 flex items-center gap-3">
              {isLevelUpCategory && <RocketOutlined className="text-[#F05A4A]" />}
              {category === 'PLACEMENT'
                ? 'Bài kiểm tra đầu vào TOEIC'
                : category === 'FINAL'
                  ? 'BÀI THI KẾT THÚC LEVEL'
                  : category === 'LEVEL_UP'
                    ? 'THAY ĐỔI TRÌNH ĐỘ'
                    : 'Danh sách Bài kiểm tra'}
            </h1>
            <p className="text-gray-600 font-bold text-base md:text-lg">
              {isLevelUpCategory 
                ? 'Bài kiểm tra xác định bạn có phù hợp với trình độ đã chọn hay không. Đạt từ 80% (24/30 câu) ở 1 trong các bài dưới đây để thay đổi trình độ!' 
                : 'Hoàn thành bài kiểm tra để xác định năng lực và theo dõi tiến độ học tập.'}
            </p>
          </div>

          {user && (
            <div className="bg-[#E6F4F1] border-2 border-[#2A8B9D] p-3 rounded-lg flex flex-col min-w-[200px]">
              <span className="text-xs font-black uppercase text-gray-500">Trình độ hiện tại</span>
              <span className="text-lg font-black text-[#2A8B9D]">{currentLevelName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning banner if all 10 tests failed */}
      {allAttemptedAndFailed && (
        <div className="mb-8 brutal-card bg-[#FFF1F0] border-4 border-[#F05A4A] p-6 shadow-[6px_6px_0px_0px_rgba(240,90,74,1)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-[#F05A4A] uppercase mb-1">
              ⚠️ BẠN CẦN ÔN TẬP LẠI KIẾN THỨC
            </h3>
            <p className="text-gray-700 font-medium">
              Bạn đã thử sức ở các bài kiểm tra và chưa đạt yêu cầu 80%. Vui lòng dành thời gian học và ôn tập lại các bộ từ vựng trước khi tiếp tục.
            </p>
          </div>
          <Button
            size="large"
            icon={<BookOutlined />}
            className="brutal-pill font-black uppercase bg-[#2A8B9D] text-white hover:!bg-[#1F6B79] border-2 border-black h-12 px-6"
            onClick={() => navigate('/decks')}
          >
            Ôn Tập Từ Vựng Ngay ➔
          </Button>
        </div>
      )}

      {/* Main Quizzes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="brutal-card w-full h-[200px]">
              <Skeleton active />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levelUpQuizzes.length > 0 ? (
            levelUpQuizzes.map((quiz: any, idx: number) => {
              const status = quiz.attemptStatus || (quiz.isLocked ? 'LOCKED' : 'AVAILABLE');
              const isLocked = quiz.isLocked || status === 'LOCKED' || status === 'COMPLETED_FAILED' || status === 'WAITING_24H' || status === 'NOT_REQUIRED';
              const isAvailable = status === 'AVAILABLE';
              const isPassed = status === 'COMPLETED_PASSED' || status === 'PASSED';
              const isFailed = status === 'COMPLETED_FAILED';
              const isWaiting24h = status === 'WAITING_24H';

              return (
                <div 
                  key={quiz.id} 
                  className={`brutal-card bg-white p-6 border-4 border-black flex flex-col justify-between transition-all ${
                    isPassed 
                      ? 'bg-[#F0FDF4] border-[#22C55E] shadow-[6px_6px_0px_0px_rgba(34,197,94,1)]' 
                      : isAvailable 
                        ? 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] border-black bg-white' 
                        : isWaiting24h 
                          ? 'bg-[#FFFBEB] border-[#F59E0B] shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]' 
                          : isFailed 
                            ? 'bg-[#FEF2F2] border-[#EF4444] opacity-90 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.4)]'
                            : 'bg-[#FAF9F6] opacity-80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-xl font-black uppercase text-[#1D2A3A] leading-tight">
                        {quiz.title || `Upgrade Test #${idx + 1}`}
                      </h3>
                      {isPassed ? (
                        <Tag color="success" className="font-bold text-xs border-black px-2 py-0.5">
                          <CheckCircleOutlined /> ĐÃ ĐẠT
                        </Tag>
                      ) : isFailed ? (
                        <Tag color="error" className="font-bold text-xs border-black px-2 py-0.5">
                          ❌ KHÔNG ĐẠT
                        </Tag>
                      ) : isWaiting24h ? (
                        <Tag color="warning" className="font-bold text-xs border-black px-2 py-0.5">
                          <LockOutlined /> CHỜ 24H
                        </Tag>
                      ) : isAvailable ? (
                        <Tag color="processing" className="font-bold text-xs border-black px-2 py-0.5">
                          🟢 SẴN SÀNG
                        </Tag>
                      ) : (
                        <Tag color="default" className="font-bold text-xs border-black px-2 py-0.5">
                          <LockOutlined /> KHÓA
                        </Tag>
                      )}
                    </div>

                    <p className="text-gray-600 font-medium text-sm mb-4">
                      {quiz.description || '30 câu hỏi / 30 phút - Thời gian đạt: ≥ 80% (24/30 câu)'}
                    </p>

                    {quiz.lockReason && (
                      <div className={`mb-4 p-3 border-2 rounded text-xs font-bold flex items-center gap-2 ${
                        isWaiting24h 
                          ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]' 
                          : isFailed 
                            ? 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]'
                            : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}>
                        <LockOutlined />
                        <span>{quiz.lockReason}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    disabled={isLevelUpCategory ? !isAvailable : (isLocked && !isPassed)}
                    className={`w-full brutal-pill font-black uppercase h-11 border-2 border-black text-sm transition-all ${
                      isPassed
                        ? '!bg-[#22C55E] !text-white cursor-not-allowed opacity-90'
                        : isAvailable
                          ? '!bg-[#F05A4A] !text-white hover:!bg-[#D94F41] hover:!shadow-md cursor-pointer'
                          : '!bg-gray-200 !text-gray-500 cursor-not-allowed border-gray-400'
                    }`}
                    onClick={() => navigate(`/quiz/${quiz.id}/start`)}
                  >
                    {isPassed 
                      ? '✅ ĐÃ HOÀN THÀNH - ĐẠT' 
                      : isFailed 
                        ? '❌ ĐÃ HOÀN THÀNH - KHÔNG ĐẠT' 
                        : isWaiting24h 
                          ? '🔒 ĐANG CHỜ 24H' 
                          : isAvailable 
                            ? 'BẮT ĐẦU BÀI THI ➔' 
                            : '🔒 KHÓA (CHƯA ĐẾN LƯỢT)'}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center brutal-card bg-white border-4 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black text-gray-700 uppercase mb-2">Chưa có bài kiểm tra nào phù hợp</h2>
              <p className="text-gray-500 font-medium">Vui lòng kiểm tra lại thiết lập trình độ của bạn hoặc chọn các danh mục kiểm tra khác.</p>
              <Button onClick={() => navigate('/decks')} className="mt-4 brutal-pill font-bold bg-[#1D2A3A] text-white">
                Về Trang Danh Sách Bộ Thẻ
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
