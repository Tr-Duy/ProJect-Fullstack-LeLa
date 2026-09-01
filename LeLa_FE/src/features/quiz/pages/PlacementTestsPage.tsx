import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, Empty, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { quizzesApi } from '../api/quizzes.api';
import { quizAttemptsApi } from '../api/quiz-attempts.api';
import { useAuth } from '../../../shared/providers/AuthProvider';

export const PlacementTestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: quizzesResp, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['placement-tests'],
    queryFn: () => quizzesApi.getAll({ category: 'PLACEMENT', size: 50 }),
  });

  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['my-quiz-attempts'],
    queryFn: () => quizAttemptsApi.getMyAttempts({ size: 100 }),
    enabled: !!user,
  });

  if (loadingQuizzes || loadingAttempts) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#F4F3EE]">
        <Spin size="large" />
      </div>
    );
  }

  const rawQuizzes: any[] = Array.isArray(quizzesResp?.data) 
    ? quizzesResp.data 
    : ((quizzesResp as any)?.data?.content || []);
  const placementQuizzes = rawQuizzes.filter((q: any) => q.quizCategory === 'PLACEMENT');

  // Sort placement quizzes by code order: U500, 500-650, 650-800, 800-PLUS
  const orderMap: Record<string, number> = {
    'PLACEMENT-TOEIC-U500': 1,
    'PLACEMENT-TOEIC-500-650': 2,
    'PLACEMENT-TOEIC-650-800': 3,
    'PLACEMENT-TOEIC-800-PLUS': 4,
  };
  const sortedQuizzes = [...placementQuizzes].sort((a: any, b: any) => {
    return (orderMap[a.quizCode] || 99) - (orderMap[b.quizCode] || 99);
  });

  const myAttempts = attemptsData?.data?.content || [];

  // Helper to get latest attempt for a quiz
  const getQuizAttempt = (quizId: number) => {
    return myAttempts.find(
      (a: any) => a.quizId === quizId && (a.status === 'SUBMITTED' || a.status === 'COMPLETED')
    );
  };

  const currentLevelId = user?.currentLevel?.id;
  const currentLevelName = user?.currentLevel?.name || 'Chưa xác định';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F3EE] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 brutal-card bg-white p-6 md:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="inline-block bg-black text-yellow-300 font-black text-xs px-3 py-1 mb-3 uppercase tracking-wider border-2 border-black">
            ⚡ ĐỔI TRÌNH ĐỘ HỌC / KIỂM TRA TRÌNH ĐỘ TOEIC
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#1D2A3A] mb-3 flex items-center gap-3">
            <RocketOutlined className="text-[#F05A4A]" />
            Đổi Trình Độ Học TOEIC
          </h1>
          <p className="text-gray-600 font-bold text-base md:text-lg">
            Bạn có thể thử sức bài kiểm tra ở bất kỳ trình độ nào để xác định hoặc thay đổi trình độ học TOEIC phù hợp. Đạt từ 80% (24/30 câu) sẽ xác nhận trình độ tương ứng!
          </p>
        </div>

        {/* User Current Level Banner */}
        <div className="mb-8 brutal-card p-6 bg-white border-4 border-black flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-300 rounded-full border-3 border-black flex items-center justify-center text-2xl font-black shrink-0">
              🏆
            </div>
            <div>
              <span className="text-xs font-black uppercase text-gray-500 tracking-wider">TRÌNH ĐỘ ĐANG HỌC</span>
              <h3 className="text-2xl font-black text-[#1D2A3A]">
                {currentLevelName !== 'Chưa xác định' ? `TOEIC ${currentLevelName}` : 'Chưa xác định'}
              </h3>
            </div>
          </div>
          {user?.currentLevel && (
            <Button
              className="brutal-pill font-black bg-[#2A8B9D] text-white hover:!bg-[#1D2A3A] border-2 border-black h-11 px-6 text-sm"
              onClick={() => navigate('/decks')}
            >
              HỌC TỪ VỰNG THEO TRÌNH ĐỘ ➔
            </Button>
          )}
        </div>

        {/* Tests List */}
        {sortedQuizzes.length === 0 ? (
          <Empty description="Hiện tại chưa có bài kiểm tra đầu vào nào" className="bg-white p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
        ) : (
          <div className="flex flex-col gap-6">
            {sortedQuizzes.map((quiz: any, idx: number) => {
              const attempt = getQuizAttempt(quiz.id);
              const isDone = !!attempt;
              const isPassed = attempt?.passed;
              const isCurrentLearnerLevel = quiz.level?.id && currentLevelId && quiz.level.id === currentLevelId;
              const isLowest = idx === 0 || quiz.quizCode === 'PLACEMENT-TOEIC-U500' || (quiz.level?.displayOrder === 1);

              return (
                <div 
                  key={quiz.id}
                  className={`brutal-card bg-white p-6 md:p-8 border-4 border-black transition-transform duration-200 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 ${
                    isCurrentLearnerLevel ? 'bg-[#F0FDF4] border-[#22C55E]' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Tag className="font-black text-xs px-3 py-1 border-2 border-black" color={idx === 0 ? '#2A8B9D' : idx === 1 ? '#F05A4A' : idx === 2 ? '#1D2A3A' : '#7C3AED'}>
                          MỨC {idx + 1}
                        </Tag>
                        
                        {isCurrentLearnerLevel ? (
                          <Tag color="success" className="font-black text-xs border-2 border-black px-3 py-1">
                            🟢 ĐANG HỌC
                          </Tag>
                        ) : (
                          <Tag color="warning" className="font-black text-xs border-2 border-black px-3 py-1">
                            🔑 YÊU CẦU THI
                          </Tag>
                        )}

                        <span className="font-bold text-xs bg-yellow-200 px-3 py-1 border-2 border-black">
                          ⏱ {quiz.timeLimitSeconds ? `${Math.floor(quiz.timeLimitSeconds / 60)} phút` : '30 phút'}
                        </span>
                        <span className="font-bold text-xs bg-green-100 text-green-800 px-3 py-1 border-2 border-black">
                          ĐẠT: ≥ 80% (24/30)
                        </span>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-black uppercase text-[#1D2A3A] mb-2">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-600 font-medium text-base mb-3 max-w-2xl">
                        {quiz.description || "Bài kiểm tra xác định trình độ TOEIC đầu vào."}
                      </p>

                      {/* Attempt Status Info */}
                      {isDone && (
                        <div className={`inline-flex items-center gap-3 p-3 border-2 border-black rounded-lg mt-2 ${isPassed || isLowest ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                          {isPassed || isLowest ? (
                            <CheckCircleOutlined className="text-xl text-green-700" />
                          ) : (
                            <CloseCircleOutlined className="text-xl text-red-700" />
                          )}
                          <div>
                            <span className="font-black text-sm">
                              LẦN THI TRƯỚC: {attempt.correctAnswers || Math.round((attempt.scorePercent || 0) * 0.3)} / 30 CÂU ({Math.round(attempt.scorePercent || 0)}%)
                            </span>
                            <span className={`ml-3 font-black text-xs px-2 py-0.5 border border-black ${isPassed ? 'bg-green-400 text-black' : isLowest ? 'bg-blue-300 text-blue-900' : 'bg-red-500 text-white'}`}>
                              {isPassed ? '✅ ĐÃ ĐẠT' : isLowest ? '🎯 ĐÃ XẾP TRÌNH ĐỘ' : '❌ CHƯA ĐẠT'}
                            </span>
                            {!isPassed && (
                              <p className="text-xs font-bold text-gray-700 mt-1">
                                {isLowest
                                  ? 'Bạn đã được xếp vào Cơ bản (Dưới 500) để bắt đầu học ngay.'
                                  : `Trình độ của bạn vẫn giữ nguyên ở TOEIC ${currentLevelName}. Bạn có thể ôn tập hoặc chọn bài kiểm tra ở trình độ thấp hơn.`}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                      <Button
                        className="w-full md:w-auto h-12 px-8 brutal-pill font-black uppercase bg-[#F05A4A] text-white hover:!bg-[#d94f41] text-base border-2 border-black shadow-[3px_3px_0px_0px_#000]"
                        onClick={() => navigate(`/quiz/${quiz.id}/start`)}
                      >
                        {isDone ? 'THỬ LẠI BÀI KIỂM TRA ➔' : 'BẮT ĐẦU KIỂM TRA ➔'}
                      </Button>

                      {isDone && (
                        <Button
                          className="w-full md:w-auto h-10 px-6 brutal-pill font-bold uppercase bg-gray-100 text-gray-800 hover:!bg-gray-200 border-2 border-black text-xs"
                          onClick={() => navigate(`/quiz-attempt/${attempt.publicId}`)}
                        >
                          XEM KẾT QUẢ CHI TIẾT
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
