import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Empty } from 'antd';
import { quizzesApi } from '../api/quizzes.api';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import { quizAttemptsApi } from '../api/quiz-attempts.api';
import { useAuth } from '../../../shared/providers/AuthProvider';


export const PlacementTestsPage = () => {
  const navigate = useNavigate();

  const { data: examTypes, isLoading: loadingExamTypes } = useQuery({
    queryKey: ['exam-types'],
    queryFn: examTypesApi.getAll,
  });

  const toeicId = examTypes?.[0]?.id;

  const { data: quizzesData, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['placement-tests', toeicId],
    queryFn: () => quizzesApi.search('PLACEMENT', toeicId!),
    enabled: !!toeicId,
  });

  const { user } = useAuth();

  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['my-quiz-attempts'],
    queryFn: () => quizAttemptsApi.getMyAttempts({ size: 100 }),
  });

  if (loadingExamTypes || loadingQuizzes || loadingAttempts) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#F4F3EE]">
        <Spin size="large" />
      </div>
    );
  }

  const quizzes = quizzesData?.data || [];
  const completedPlacementAttempt = attemptsData?.data?.content?.find(
    (attempt: any) =>
      attempt.quizCategory === 'PLACEMENT' &&
      (attempt.status === 'SUBMITTED' || attempt.status === 'COMPLETED')
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F3EE] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase text-[#1D2A3A] mb-2">KIỂM TRA TRÌNH ĐỘ TOEIC</h1>
          <p className="text-gray-600 font-bold text-lg">
            Chọn một bài kiểm tra để xác định trình độ của bạn
          </p>
        </div>

        {quizzes.length === 0 ? (
          <Empty description="Hiện tại chưa có bài kiểm tra đầu vào nào" className="bg-white p-8 border-[3px] border-black shadow-[4px_4px_0px_0px_#000]" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <Card 
                key={quiz.id} 
                className="brutal-card brutal-shadow border-[3px] border-black hover:-translate-y-1 transition-transform"
                title={<div className="font-black text-xl uppercase truncate">{quiz.title}</div>}
                styles={{ header: { borderBottom: '3px solid black' } }}
              >
                <div className="space-y-4">
                  <p className="text-gray-600 line-clamp-2 min-h-[48px]">
                    {quiz.description || "Bài kiểm tra đầu vào TOEIC"}
                  </p>
                  
                  <div className="flex gap-4 text-sm font-bold text-[#1D2A3A]">
                    <div className="bg-gray-200 px-3 py-1 rounded-full border border-black">
                      ⏱ {quiz.timeLimitSeconds ? `${Math.floor(quiz.timeLimitSeconds / 60)} phút` : 'Không giới hạn'}
                    </div>
                  </div>

                  {completedPlacementAttempt || user?.currentLevel ? (
                    <div className="w-full mt-4 p-4 border-[2px] border-black bg-[#f4f3ee] text-center flex flex-col items-center gap-3">
                      <div>
                        <p className="font-bold text-[#1D2A3A]">
                          {completedPlacementAttempt
                            ? 'Bạn đã hoàn thành bài kiểm tra đầu vào.'
                            : 'Bạn đã có trình độ học.'}
                        </p>
                        <p className="text-sm text-gray-600 font-semibold mt-1">
                          Trình độ hiện tại: {user?.currentLevel?.name || 'Đã xác định'}
                        </p>
                      </div>
                      <Button
                        className="brutal-pill border-black font-black uppercase text-white bg-[#1D2A3A] hover:!bg-[#2A8B9D]"
                        onClick={() => navigate('/dashboard')}
                      >
                        VỀ TRANG CHỦ
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 mt-4 brutal-pill bg-[#F05A4A] hover:!bg-[#d94f41] text-white font-black text-lg border-[2px] border-black shadow-[2px_2px_0px_0px_#000]"
                      onClick={() => navigate(`/quiz/${quiz.id}/start`)}
                    >
                      BẮT ĐẦU
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
