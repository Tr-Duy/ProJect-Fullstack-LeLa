import { useQuery } from '@tanstack/react-query';
import { Button, Card, Skeleton, Tag } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockOutlined, CheckCircleOutlined, BookOutlined, RocketOutlined } from '@ant-design/icons';
import { quizzesApi } from '../api/quizzes.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
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

  // Query user's enrolled decks to check level-up prerequisite
  const { data: enrollmentsResp } = useQuery({
    queryKey: ['my-deck-enrollments-all'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 100 }),
    enabled: !!user,
  });

  const enrollments = enrollmentsResp?.data?.content || [];
  const completedDecksCount = enrollments.filter(
    (e: any) =>
      e.status === 'COMPLETED' ||
      !!e.completedAt ||
      (e.deckTotalCards && e.deckTotalCards > 0 && e.masteredCards >= e.deckTotalCards)
  ).length;
  const userXP = user?.xpTotal || 0;

  // Prerequisite logic: Completed >= 3 decks AND >= 500 XP
  const isLevelUpUnlocked = completedDecksCount >= 3 && userXP >= 500;

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

  // Active quiz ID to start test
  const activeQuiz = levelUpQuizzes.find((q: any) => !q.isLocked && q.attemptStatus === 'AVAILABLE') || levelUpQuizzes[0];
  const targetQuizId = activeQuiz?.id || 40031;

  // Check if all 10 tests were attempted and all failed
  const allAttemptedAndFailed = isLevelUpCategory && levelUpQuizzes.length > 0 && levelUpQuizzes.every((q: any) => q.isLocked || q.attemptStatus === 'LOCKED');

  const currentLevelName = user?.currentLevel?.name || 'Khá - Giỏi (700 - 850)';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F4F3EE]">
      {/* Header section */}
      <div className="mb-8 rounded-[var(--radius-card)] bg-white p-6 border-4 border-[var(--border)] shadow-[var(--shadow-md)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#2B1B0E] mb-2 flex items-center gap-3">
              {isLevelUpCategory && <RocketOutlined className="text-[#F05A4A]" />}
              {category === 'PLACEMENT'
                ? 'Bài kiểm tra đầu vào TOEIC'
                : category === 'FINAL'
                  ? 'BÀI THI KẾT THÚC LEVEL'
                  : category === 'LEVEL_UP'
                    ? 'BÀI THI LÊN CẤP TRÌNH ĐỘ'
                    : 'Danh sách Bài kiểm tra'}
            </h1>
            <p className="text-gray-600 font-bold text-base md:text-lg">
              {isLevelUpCategory 
                ? 'Bài kiểm tra nâng cấp trình độ năng lực TOEIC. Đạt từ 80% (24/30 câu) để thăng cấp ngay lập tức!' 
                : 'Hoàn thành bài kiểm tra để xác định năng lực và theo dõi tiến độ học tập.'}
            </p>
          </div>

          {user && (
            <div className="bg-[#E6F4F1] border-2 border-[#2A8B9D] p-3 rounded-lg flex flex-col min-w-[200px]">
              <span className="text-xs font-bold text-gray-500">Trình độ hiện tại</span>
              <span className="text-lg font-black text-[#2A8B9D]">{currentLevelName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning banner if all 10 tests failed */}
      {allAttemptedAndFailed && (
        <div className="mb-8 rounded-[var(--radius-card)] bg-[#FFF1F0] border-4 border-[#F05A4A] p-6 shadow-[6px_6px_0px_0px_rgba(240,90,74,1)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-[#F05A4A] mb-1">
              ⚠️ BẠN CẦN ÔN TẬP LẠI KIẾN THỨC
            </h3>
            <p className="text-gray-700 font-medium">
              Bạn đã thử sức ở các bài kiểm tra và chưa đạt yêu cầu 80%. Vui lòng dành thời gian học và ôn tập lại các bộ từ vựng trước khi tiếp tục.
            </p>
          </div>
          <Button
            size="large"
            icon={<BookOutlined />}
            className="brutal-pill font-bold bg-[#2A8B9D] text-white hover:!bg-[#1F6B79] border-2 border-[var(--border)] h-12 px-6"
            onClick={() => navigate('/decks')}
          >
            Ôn Tập Từ Vựng Ngay ➔
          </Button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="rounded-[var(--radius-card)] w-full h-[200px]">
              <Skeleton active />
            </Card>
          ))}
        </div>
      ) : isLevelUpCategory ? (
        // SPECIAL HANDLING FOR LEVEL_UP QUIZ (PREREQUISITE UNLOCK CARD)
        <div className="space-y-8">
          {!isLevelUpUnlocked ? (
            /* TRẠNG THÁI KHÓA (LOCKED): Chưa đủ 3 bộ thẻ hoặc chưa đủ 500 XP */
            <div className="max-w-2xl mx-auto rounded-2xl bg-white p-6 md:p-8 border-2 border-black shadow-[5px_5px_0px_#000]">
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-black flex items-center justify-center text-xl shrink-0 shadow-[2px_2px_0px_#000]">
                  🔒
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  BÀI THI LÊN CẤP XUẤT SẮC (850 - 990) ĐANG KHÓA
                </h2>
              </div>

              <p className="text-slate-600 font-medium text-sm md:text-base mb-6 leading-relaxed">
                Bạn cần hoàn thành mục tiêu học tập tối thiểu ở cấp Khá - Giỏi để mở khóa bài kiểm tra nâng cấp:
              </p>

              {/* Progress List */}
              <div className="space-y-4 mb-6">
                {/* Điều kiện 1: Số bộ thẻ hoàn thành */}
                <div className="p-4 rounded-xl bg-slate-50 border-2 border-black">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs md:text-sm text-slate-800 flex items-center gap-2">
                      {completedDecksCount >= 3 ? '✅' : '📚'} Hoàn thành bộ thẻ cấp hiện tại:
                    </span>
                    <span className="font-black text-xs md:text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                      {completedDecksCount} / 3 bộ
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-200 rounded-full border border-black overflow-hidden p-0.5">
                    <div
                      className="h-full bg-[#2A8B9D] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((completedDecksCount / 3) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Điều kiện 2: Điểm kinh nghiệm XP */}
                <div className="p-4 rounded-xl bg-slate-50 border-2 border-black">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs md:text-sm text-slate-800 flex items-center gap-2">
                      {userXP >= 500 ? '✅' : '⚡'} Tích lũy điểm kinh nghiệm:
                    </span>
                    <span className="font-black text-xs md:text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                      {userXP} / 500 XP
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-200 rounded-full border border-black overflow-hidden p-0.5">
                    <div
                      className="h-full bg-[#F05A4A] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((userXP / 500) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Nút màu cam điều hướng */}
              <button
                type="button"
                onClick={() => navigate('/my-decks')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F05A4A] hover:bg-[#D94F41] text-white font-black text-sm md:text-base border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Khám Phá Bộ Thẻ Để Học Tiếp</span>
                <span className="font-bold">➔</span>
              </button>
            </div>
          ) : (
            /* TRẠNG THÁI MỞ KHÓA (UNLOCKED): Đã đủ điều kiện làm bài thi */
            <div className="max-w-2xl mx-auto rounded-2xl bg-white p-6 md:p-8 border-2 border-black shadow-[6px_6px_0px_#000]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000] shrink-0">
                  🎯
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 rounded-md border border-emerald-400">
                    ĐÃ ĐỦ ĐIỀU KIỆN MỞ KHÓA
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                    TOEIC Mastery Level-Up Test - 30 Câu / 25 Phút
                  </h2>
                </div>
              </div>

              <p className="text-slate-600 font-medium text-sm md:text-base mb-6 leading-relaxed">
                Chúc mừng bạn đã hoàn thành xuất sắc các mục tiêu tiên quyết ({completedDecksCount}/3 bộ thẻ, {userXP}/500 XP)! Hãy bắt đầu bài thi nâng cấp lên trình độ <strong>Xuất sắc (850 - 990)</strong>. Điểm yêu cầu: ≥ 80% (24/30 câu).
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6 text-xs md:text-sm font-bold text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-black flex items-center gap-2">
                  <span>⏱️ Thời gian: 25 phút</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-black flex items-center gap-2">
                  <span>📝 Số câu: 30 câu trắc nghiệm</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/quiz/${targetQuizId}/start`)}
                className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base md:text-lg border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                <span>BẮT ĐẦU LÀM BÀI THI NGAY</span>
                <span className="font-bold">➔</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD CATEGORIES GRID (PLACEMENT / FINAL / NORMAL) */
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
                  className={`rounded-[var(--radius-card)] bg-white p-6 border-4 border-[var(--border)] flex flex-col justify-between transition-all ${
                    isPassed 
                      ? 'bg-[#F0FDF4] border-[#22C55E] shadow-[6px_6px_0px_0px_rgba(34,197,94,1)]' 
                      : isAvailable 
                        ? 'shadow-[var(--shadow-md)] hover:translate-y-[-2px] border-[var(--border)] bg-white' 
                        : isWaiting24h 
                          ? 'bg-[#FFFBEB] border-[#F59E0B] shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]' 
                          : isFailed 
                            ? 'bg-[#FEF2F2] border-[#EF4444] opacity-90 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.4)]'
                            : 'bg-[#FAF9F6] opacity-80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-xl font-bold text-[#2B1B0E] leading-tight">
                        {quiz.title || `Test #${idx + 1}`}
                      </h3>
                      {isPassed ? (
                        <Tag color="success" className="font-bold text-xs border-[var(--border)] px-2 py-0.5">
                          <CheckCircleOutlined /> ĐÃ ĐẠT
                        </Tag>
                      ) : isFailed ? (
                        <Tag color="error" className="font-bold text-xs border-[var(--border)] px-2 py-0.5">
                          ❌ KHÔNG ĐẠT
                        </Tag>
                      ) : isWaiting24h ? (
                        <Tag color="warning" className="font-bold text-xs border-[var(--border)] px-2 py-0.5">
                          <LockOutlined /> CHỜ 24H
                        </Tag>
                      ) : isAvailable ? (
                        <Tag color="processing" className="font-bold text-xs border-[var(--border)] px-2 py-0.5">
                          🟢 SẴN SÀNG
                        </Tag>
                      ) : (
                        <Tag color="default" className="font-bold text-xs border-[var(--border)] px-2 py-0.5">
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
                    disabled={isLocked && !isPassed}
                    className={`w-full brutal-pill font-black h-11 border-2 border-[var(--border)] text-sm transition-all ${
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
                            : '🔒 KHÓA'}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center rounded-[var(--radius-card)] bg-white border-4 border-[var(--border)] p-8 shadow-[var(--shadow-md)]">
              <h2 className="text-2xl font-black text-gray-700 mb-2">Chưa có bài kiểm tra nào phù hợp</h2>
              <p className="text-gray-500 font-medium">Vui lòng kiểm tra lại thiết lập trình độ của bạn hoặc chọn các danh mục kiểm tra khác.</p>
              <Button onClick={() => navigate('/decks')} className="mt-4 brutal-pill font-bold bg-[#2B1B0E] text-white">
                Về Trang Danh Sách Bộ Thẻ
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

