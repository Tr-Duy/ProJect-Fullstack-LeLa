import { useEffect, useState } from 'react';
import { App, Button, Skeleton, Tag } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes.api';
import { quizAttemptsApi } from '../api/quiz-attempts.api';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { onboardingApi } from '../../users/api/onboarding.api';
import type { PlacementTestResult } from '../../users/api/onboarding.api';
import { normalizeQuizId } from '../utils/quiz-attempts';

interface QuizAttemptResultLocationState {
  quizId?: number | string | null;
  attemptDetail?: any;
  placementResult?: any;
}

export function QuizAttemptResultPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { refreshUser } = useAuth();
  const locationState = location.state as QuizAttemptResultLocationState | null;
  const [placementResult, setPlacementResult] = useState<PlacementTestResult | null>(locationState?.placementResult || null);

  const { data: attemptRes, isLoading, isError } = useQuery({
    queryKey: ['attemptDetail', publicId],
    queryFn: () => quizAttemptsApi.getAttemptDetail(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      message.error('Không thể tải dữ liệu kết quả bài thi.');
    }
  }, [isError, message]);

  const attemptDetail = attemptRes?.data ?? locationState?.attemptDetail;

  const { data: quizRes } = useQuery({
    queryKey: ['quiz-detail', attemptDetail?.quizId],
    queryFn: () => quizzesApi.getById(attemptDetail!.quizId),
    enabled: !!attemptDetail?.quizId,
  });

  const isPlacement = attemptDetail?.quizCategory === 'PLACEMENT' || quizRes?.data?.quizCategory === 'PLACEMENT';
  const isFinal = attemptDetail?.quizCategory === 'FINAL' || quizRes?.data?.quizCategory === 'FINAL';
  const isLevelUp = attemptDetail?.quizCategory === 'LEVEL_UP' || quizRes?.data?.quizCategory === 'LEVEL_UP';
  const isNormal = !isPlacement && !isFinal && !isLevelUp;

  const placementMutation = useMutation({
    mutationFn: () => onboardingApi.submitPlacement(publicId!),
    onSuccess: (data) => {
      setPlacementResult(data);
      message.success(`Đã đánh giá trình độ: ${data.suggestedLevel?.name || 'Chưa xác định'}`);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tính toán trình độ');
    }
  });

  useEffect(() => {
    if (isPlacement && !placementResult && !placementMutation.isPending && !placementMutation.isSuccess && !placementMutation.isError) {
      placementMutation.mutate();
    }
  }, [isPlacement, placementResult]);

  useEffect(() => {
    if (isFinal || isLevelUp) {
      refreshUser();
    }
  }, [isFinal, isLevelUp, refreshUser]);

  const handlePlacementConfirm = async () => {
    await refreshUser();
    navigate('/dashboard');
  };

  const retryMutation = useMutation({
    mutationFn: async () => {
      const latestAttemptDetail = attemptDetail ?? (publicId ? (await quizAttemptsApi.getAttemptDetail(publicId)).data : null);
      const quizId = latestAttemptDetail?.quizId ?? latestAttemptDetail?.quiz?.id ?? locationState?.quizId;

      console.log('retry quizId:', quizId);
      console.log('attempt detail:', latestAttemptDetail);

      const numericQuizId = normalizeQuizId(quizId);

      if (!numericQuizId) {
        console.error('Invalid quizId when retry quiz:', quizId);

        if (latestAttemptDetail?.quizId === undefined && latestAttemptDetail?.quiz?.id === undefined && locationState?.quizId === undefined) {
          console.error('QuizAttemptDetailResponse is missing quizId:', latestAttemptDetail);
          throw new Error('QuizAttemptDetailResponse is missing quizId.');
        }

        throw new Error('Invalid quizId when retry quiz.');
      }

      const response = await quizAttemptsApi.startAttempt(numericQuizId);
      return {
        newAttempt: response.data,
        quizId: numericQuizId,
      };
    },
    onSuccess: ({ newAttempt, quizId }) => {
      console.log('retry start response:', newAttempt);

      if (!newAttempt?.publicId) {
        console.error('Retry start response is missing publicId:', newAttempt);
        message.error('Không thể mở bài kiểm tra mới.');
        return;
      }

      navigate(`/quiz-attempts/${newAttempt.publicId}`, {
        state: {
          attemptData: newAttempt,
          quizId,
        },
      });
    },
    onError: (error) => {
      console.error('Retry quiz start failed:', error);

      if (error instanceof Error && error.message === 'QuizAttemptDetailResponse is missing quizId.') {
        message.error('Không thể bắt đầu bài kiểm tra. Dữ liệu bài làm đang thiếu quizId.');
        return;
      }

      message.error('Không thể bắt đầu bài kiểm tra.');
    }
  });

  if (isError) {
    return <div className="min-h-screen bg-[#F4F3EE] p-8 max-w-3xl mx-auto"><h2 className="text-2xl font-bold text-red-500">Đã xảy ra lỗi</h2></div>;
  }

  if (isLoading || !attemptDetail) {
    return <div className="min-h-screen bg-[#F4F3EE] p-8 max-w-3xl mx-auto"><Skeleton active paragraph={{ rows: 10 }} /></div>;
  }

  const questions = attemptDetail.questions || [];
  const answers = attemptDetail.answers || [];

  const getAnswerForQuestion = (questionId: number) => {
    return answers.find((answer: any) => answer.attemptQuestionId === questionId);
  };

  const formatTime = (seconds: number) => {
    if (!seconds) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <Button onClick={() => navigate('/my-quiz-attempts')} className="brutal-border font-bold h-12 px-6 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 transition-transform">
            &larr; LỊCH SỬ THI
          </Button>
          <div className="text-xl font-bold brutal-border bg-white px-6 py-2 shadow-[2px_2px_0px_0px_#000] border-[3px]">
            Kết quả: {attemptDetail.quizTitle}
          </div>
          <div className="flex gap-4">
            {!isPlacement && (
              <Button
                className="brutal-border font-bold h-12 px-6 !bg-[#1D2A3A] !text-white shadow-[2px_2px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform"
                onClick={() => retryMutation.mutate()}
                loading={retryMutation.isPending}
              >
                LÀM LẠI BÀI NÀY
              </Button>
            )}
          </div>
        </div>

        {isNormal && (
          <div className="brutal-card bg-white p-6 md:p-10 mb-8 border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col items-center">
            <h2 className="text-3xl font-black mb-4 text-[#1D2A3A] uppercase">Tổng kết bài làm</h2>

            <div className="flex flex-wrap gap-8 justify-center items-center w-full my-6">
              <div className="flex flex-col items-center">
                <span className="text-gray-500 font-bold mb-1">Điểm số</span>
                <span className="text-5xl font-black" style={{ color: attemptDetail.passed ? '#2A8B9D' : '#F05A4A' }}>
                  {`${Number(attemptDetail.scorePercent || 0).toFixed(0)}%`}
                </span>
              </div>
              <div className="w-[3px] h-16 bg-black hidden md:block"></div>

              <div className="flex flex-col items-center">
                <span className="text-gray-500 font-bold mb-1">Số câu đúng</span>
                <span className="text-4xl font-black text-[#1D2A3A]">
                  {attemptDetail.correctAnswers} / {attemptDetail.totalQuestions}
                </span>
              </div>
              <div className="w-[3px] h-16 bg-black hidden md:block"></div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500 font-bold mb-1">Thời gian làm</span>
                <span className="text-4xl font-black text-[#1D2A3A]">
                  {formatTime(attemptDetail.timeSpentSeconds)}
                </span>
              </div>
            </div>

            <Tag color={attemptDetail.passed ? '#2A8B9D' : '#F05A4A'} className="brutal-border font-black text-xl px-8 py-2 mt-2">
              {attemptDetail.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
            </Tag>
          </div>
        )}

        {isLevelUp && (
          <div className="w-full mt-6 flex flex-col items-center border-[3px] border-black p-6 bg-[#f4f3ee]">
            <h3 className="text-2xl font-black mb-6 uppercase text-[#1D2A3A]">TỔNG KẾT KIỂM TRA THĂNG CẤP</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">ĐIỂM BÀI TEST</span>
                <span className="text-4xl font-black text-[#1D2A3A]">
                  {(() => {
                    const toInt = (v: any) => {
                      if (v === undefined || v === null) return 0;
                      const n = typeof v === 'string' ? Number(v) : v;
                      if (Number.isNaN(n)) return 0;
                      return Math.round(Number(n));
                    };
                    const est = toInt(attemptDetail.estimatedToeicScore);
                    return `${est}`;
                  })()}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">TRẠNG THÁI</span>
                <span className="text-4xl font-black" style={{ color: attemptDetail.levelUpPassed ? '#2A8B9D' : '#F05A4A' }}>
                  {attemptDetail.levelUpPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">TRÌNH ĐỘ MỤC TIÊU</span>
                <span className="text-xl font-black text-[#1D2A3A] text-center">
                  {attemptDetail.levelUpTargetLevel?.name || 'Không xác định'}
                </span>
              </div>
            <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow md:col-span-2">
                <span className="text-xl font-black text-center mt-2" style={{ color: attemptDetail.levelUpPassed ? '#2A8B9D' : '#F05A4A' }}>
                  {(() => {
                    const toInt = (v: any) => {
                      if (v === undefined || v === null) return 0;
                      const n = typeof v === 'string' ? Number(v) : v;
                      if (Number.isNaN(n)) return 0;
                      return Math.round(Number(n));
                    };
                    const est = toInt(attemptDetail.estimatedToeicScore);
                    const max = toInt(attemptDetail.maxScore);
                    if (attemptDetail.levelUpPassed) {
                      return `Chúc mừng! Bạn đã đạt ${est}/${max} và được nâng lên trình độ ${attemptDetail.levelUpTargetLevel?.name || ''}.`;
                    }
                    return `Bạn đạt ${est}/${max}. Chưa đạt mức 80% yêu cầu để mở khóa trình độ ${attemptDetail.levelUpTargetLevel?.name || ''}.`;
                  })()}
                </span>
            </div>
            </div>
            
            {attemptDetail.levelUpPassed ? (
              <Button
                className="w-full max-w-sm mt-4 brutal-pill h-14 font-black uppercase text-xl bg-[#2A8B9D] text-white border-[2px] border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform"
                onClick={async () => {
                   await refreshUser();
                   navigate('/dashboard');
                }}
              >
                Tiếp tục học
              </Button>
            ) : (
              <Button
                className="w-full max-w-sm mt-4 brutal-pill h-14 font-black uppercase text-xl bg-[#F05A4A] text-white border-[2px] border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform"
                onClick={async () => {
                   await refreshUser();
                   navigate('/dashboard');
                }}
              >
                VỀ LỘ TRÌNH HIỆN TẠI
              </Button>
            )}
          </div>
        )}

        {isFinal && (
          <div className="w-full mt-6 flex flex-col items-center border-[3px] border-black p-6 bg-[#f4f3ee]">
            <h3 className="text-2xl font-black mb-6 uppercase text-[#1D2A3A]">TỔNG KẾT KIỂM TRA KẾT THÚC TOEIC</h3>
            
            {attemptDetail && (
              <div className={`w-full mb-6 p-4 border-2 rounded font-bold text-center text-lg ${
                attemptDetail.passed
                  ? 'bg-green-100 border-green-600 text-green-800'
                  : 'bg-red-100 border-red-500 text-red-700'
              }`}>
                {attemptDetail.passed ? (
                  <div>
                    🎉 Chúc mừng! Bạn đã đạt {attemptDetail.totalQuestions > 0 ? Math.round((attemptDetail.correctAnswers / attemptDetail.totalQuestions) * 100) : 0}%!
                    <div className="text-base font-normal mt-1">Bạn đã vượt qua bài kiểm tra kết thúc và được nâng lên trình độ kế tiếp.</div>
                  </div>
                ) : (
                  <div>
                    ❌ Bạn đạt {attemptDetail.totalQuestions > 0 ? Math.round((attemptDetail.correctAnswers / attemptDetail.totalQuestions) * 100) : 0}%.
                    <div className="text-base font-normal mt-1">Chưa đạt 80% để nâng cấp trình độ. Bài kiểm tra này tạm thời bị khóa 24h.</div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">Số câu đúng</span>
                <span className="text-4xl font-black text-[#1D2A3A]">
                  {attemptDetail.correctAnswers} / {attemptDetail.totalQuestions}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">Tỷ lệ đúng</span>
                <span className="text-4xl font-black text-[#2A8B9D]">
                  {attemptDetail.totalQuestions > 0 ? Number(((attemptDetail.correctAnswers / attemptDetail.totalQuestions) * 100).toFixed(0)) : 0}%
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">ĐIỂM TOEIC LẦN NÀY</span>
                <span className="text-4xl font-black text-[#2A8B9D]">
                  {attemptDetail.maxScore != null ? `${attemptDetail.estimatedToeicScore ?? 0} / ${attemptDetail.maxScore}` : `${attemptDetail.estimatedToeicScore ?? 0}`}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                <span className="text-gray-500 font-bold mb-2">KẾT QUẢ TỐT NHẤT</span>
                <span className="text-4xl font-black text-[#1D2A3A]">
                  {attemptDetail.maxScore != null ? `${attemptDetail.bestEstimatedToeicScore ?? attemptDetail.estimatedToeicScore ?? 0} / ${attemptDetail.maxScore}` : `${attemptDetail.bestEstimatedToeicScore ?? attemptDetail.estimatedToeicScore ?? 0}`}
                </span>
              </div>
            </div>
            {attemptDetail.levelAtAttempt && (
                <div className="mt-4 p-4 text-center">
                   <span className="text-gray-500 font-bold">Trình độ lúc làm bài: </span>
                   <span className="font-black text-[#1D2A3A]">{attemptDetail.levelAtAttempt.name}</span>
                </div>
            )}
          </div>
        )}

          {isPlacement && (
            <div className="w-full mt-6 flex flex-col items-center border-[3px] border-black p-6 bg-[#f4f3ee]">
              <h3 className="text-2xl font-black mb-6 uppercase text-[#1D2A3A]">TỔNG KẾT KIỂM TRA TRÌNH ĐỘ TOEIC</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
                <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                  <span className="text-gray-500 font-bold mb-2">Số câu đúng</span>
                  <span className="text-4xl font-black text-[#1D2A3A]">
                    {attemptDetail.correctAnswers} / {attemptDetail.totalQuestions}
                  </span>
                </div>
                <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                  <span className="text-gray-500 font-bold mb-2">Tỷ lệ đúng</span>
                  <span className="text-4xl font-black text-[#2A8B9D]">
                    {attemptDetail.totalQuestions > 0 ? Number(((attemptDetail.correctAnswers / attemptDetail.totalQuestions) * 100).toFixed(0)) : 0}%
                  </span>
                </div>
                <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                  <span className="text-gray-500 font-bold mb-2">Quy đổi chuẩn hóa</span>
                  <span className="text-4xl font-black text-[#1D2A3A]">
                    {attemptDetail.totalQuestions > 0 ? Number(((attemptDetail.correctAnswers / attemptDetail.totalQuestions) * 30).toFixed(2)) : 0} / 30
                  </span>
                </div>
                <div className="flex flex-col items-center p-4 bg-white border-[2px] border-black brutal-shadow">
                  <span className="text-gray-500 font-bold mb-2">ĐIỂM TOEIC ƯỚC LƯỢNG</span>
                  <span className="text-4xl font-black text-[#2A8B9D]">
                    {attemptDetail.maxScore != null ? (attemptDetail.estimatedToeicScore != null ? `${attemptDetail.estimatedToeicScore} / ${attemptDetail.maxScore}` : `${placementResult?.estimatedToeicScore || 0} / ${attemptDetail.maxScore}`) : (attemptDetail.estimatedToeicScore != null ? `${attemptDetail.estimatedToeicScore}` : `${placementResult?.estimatedToeicScore || 0}`)}
                  </span>
                </div>
              </div>

              {attemptDetail.levelAtAttempt && (
                <div className="mt-4 p-4 text-center">
                   <span className="text-gray-500 font-bold">Trình độ lúc làm bài: </span>
                   <span className="font-black text-[#1D2A3A]">{attemptDetail.levelAtAttempt.name}</span>
                </div>
              )}

              {placementResult && (
                <div className="w-full flex flex-col items-center bg-[#2A8B9D] text-white p-6 border-[3px] border-black brutal-shadow mb-6">
                  <span className="font-bold text-lg mb-2">TRÌNH ĐỘ ĐỀ XUẤT</span>
                  <span className="text-3xl font-black uppercase text-center">
                    {placementResult.suggestedLevel?.name}
                  </span>
                </div>
              )}
              
              <Button
                className="brutal-border font-black text-xl h-14 px-10 !bg-[#1D2A3A] !text-white shadow-[4px_4px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform w-full md:w-auto"
                onClick={handlePlacementConfirm}
                disabled={!placementResult}
              >
                BẮT ĐẦU HỌC Ở TRÌNH ĐỘ NÀY
              </Button>
            </div>
          )}

        <h3 className="text-2xl font-black mb-6 uppercase text-[#1D2A3A]">Chi tiết đáp án</h3>

        {questions.map((question: any, index: number) => {
          const answer = getAnswerForQuestion(question.id);
          const isCorrect = answer?.isCorrect;

          return (
            <div key={question.id} className="brutal-card bg-white p-6 md:p-8 mb-6 border-[3px] border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h4 className="text-xl md:text-2xl font-bold leading-relaxed text-[#1D2A3A]">
                  <span className="mr-2">Câu {index + 1}:</span>
                  {question.questionText}
                </h4>
                <div>
                  <Tag color={isCorrect ? '#2A8B9D' : '#F05A4A'} className="brutal-border font-bold px-3 py-1 text-base m-0">
                    {isCorrect ? 'Đúng' : 'Sai'}
                  </Tag>
                </div>
              </div>

              {question.questionImageUrl && (
                <img src={question.questionImageUrl} alt="Question" className="max-w-full h-auto mb-6 brutal-border border-[3px] border-black" />
              )}

              <div className="flex flex-col gap-4 w-full">
                {question.questionType === 'FILL_BLANK' ? (
                  <div className="flex flex-col gap-2">
                    <div className={`p-4 border-[3px] border-black font-bold text-lg ${isCorrect ? 'bg-[#e6f4f1]' : 'bg-[#fdebea]'}`}>
                      Bạn trả lời: <span className={isCorrect ? 'text-[#2A8B9D]' : 'text-[#F05A4A]'}>{answer?.answerText || '(Trống)'}</span>
                    </div>
                    {!isCorrect && (
                      <div className="p-4 border-[3px] border-black font-bold text-lg bg-[#e6f4f1]">
                        Đáp án đúng:{' '}
                        <span className="text-[#2A8B9D]">
                          {question.options?.filter((option: any) => option.isCorrect).map((option: any) => option.optionText).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  question.options?.map((option: any) => {
                    const isSelected = answer?.selectedAttemptOptionId === option.id;
                    const isCorrectOption = option.isCorrect === true;

                    let optionClasses = 'bg-[#F4F3EE]';
                    let textClasses = 'text-[#1D2A3A]';

                    if (isCorrectOption) {
                      optionClasses = 'bg-[#2A8B9D] text-white shadow-[2px_2px_0px_0px_#000]';
                      textClasses = 'text-white';
                    } else if (isSelected && !isCorrectOption) {
                      optionClasses = 'bg-[#F05A4A] text-white shadow-[2px_2px_0px_0px_#000]';
                      textClasses = 'text-white';
                    }

                    return (
                      <div
                        key={option.id}
                        className={`
                          flex items-center gap-4 p-4 md:p-5 border-[3px] border-black transition-all duration-200
                          ${optionClasses}
                        `}
                      >
                        <div className="w-8 h-8 border-[3px] border-black rounded-full flex items-center justify-center shrink-0 bg-white">
                          {isSelected && <div className="w-4 h-4 bg-black rounded-full" />}
                        </div>
                        <span className={`text-xl font-bold flex-1 ${textClasses}`}>
                          {option.optionText}
                        </span>
                        {isSelected && <span className={`font-bold ml-2 ${textClasses}`}>(Đã chọn)</span>}
                        {isCorrectOption && !isSelected && <span className={`font-bold ml-2 ${textClasses}`}>(Đáp án đúng)</span>}
                      </div>
                    );
                  })
                )}
              </div>

              {question.explanation && (
                <div className="mt-6 p-4 bg-gray-100 border-[3px] border-black border-dashed">
                  <h5 className="font-bold text-lg mb-2">Giải thích:</h5>
                  <p className="text-gray-700">{question.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
