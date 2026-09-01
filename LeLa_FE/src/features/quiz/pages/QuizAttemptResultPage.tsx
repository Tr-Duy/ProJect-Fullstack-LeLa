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
import { ExamReviewCard } from '../components/ExamReviewCard';

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
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewCurrentIndex, setReviewCurrentIndex] = useState(0);
  const [reviewSelectedOption, setReviewSelectedOption] = useState<number | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

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

  const incorrectQuestions = questions.filter((q: any) => {
    const ans = getAnswerForQuestion(q.id);
    return !ans?.isCorrect;
  });

  const formatTime = (seconds: number) => {
    if (!seconds) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  if (isReviewMode && incorrectQuestions.length > 0) {
    const currentReviewQuestion = incorrectQuestions[reviewCurrentIndex];
    const correctOption = currentReviewQuestion?.options?.find((o: any) => o.isCorrect);

    const handleCheckOption = (optId: number) => {
      setReviewSelectedOption(optId);
      if (optId === correctOption?.id) {
        setReviewFeedback('CORRECT');
      } else {
        setReviewFeedback('INCORRECT');
      }
    };

    const handleNextReview = () => {
      setReviewSelectedOption(null);
      setReviewFeedback(null);
      if (reviewCurrentIndex + 1 < incorrectQuestions.length) {
        setReviewCurrentIndex(reviewCurrentIndex + 1);
      } else {
        setIsReviewMode(false);
        setReviewCurrentIndex(0);
        message.success('🎉 Hoàn thành ôn luyện lại các câu chưa chắc!');
      }
    };

    return (
      <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-white p-6 md:p-10 border-[3px] border-black brutal-shadow">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-[2px] border-black">
            <h2 className="text-2xl font-black text-[#1D2A3A] uppercase">
              🔁 Ôn lại câu sai ({reviewCurrentIndex + 1} / {incorrectQuestions.length})
            </h2>
            <Button
              className="brutal-border font-bold bg-gray-100 hover:bg-gray-200"
              onClick={() => {
                setIsReviewMode(false);
                setReviewCurrentIndex(0);
                setReviewSelectedOption(null);
                setReviewFeedback(null);
              }}
            >
              Đóng ôn luyện
            </Button>
          </div>

          <div className="mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-[#1D2A3A] mb-4">
              {currentReviewQuestion.questionText}
            </h3>

            <div className="flex flex-col gap-3.5">
              {currentReviewQuestion.options?.map((option: any, index: number) => {
                const letter = String.fromCharCode(65 + index);
                let btnStyle = 'bg-white hover:bg-[#F4F3EE] text-[#1D2A3A] border-black';
                let badgeStyle = 'bg-[#F4F3EE] text-[#1D2A3A]';

                if (reviewSelectedOption === option.id) {
                  if (option.isCorrect) {
                    btnStyle = 'bg-[#2A8B9D] text-white border-black shadow-[3px_3px_0px_0px_#000]';
                    badgeStyle = 'bg-white text-[#2A8B9D]';
                  } else {
                    btnStyle = 'bg-[#F05A4A] text-white border-black shadow-[3px_3px_0px_0px_#000]';
                    badgeStyle = 'bg-white text-[#F05A4A]';
                  }
                } else if (reviewFeedback && option.isCorrect) {
                  btnStyle = 'bg-[#2A8B9D] text-white border-black shadow-[3px_3px_0px_0px_#000]';
                  badgeStyle = 'bg-white text-[#2A8B9D]';
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => !reviewFeedback && handleCheckOption(option.id)}
                    disabled={!!reviewFeedback}
                    className={`w-full flex items-center gap-4 p-4 md:p-4.5 border-[3px] rounded-xl font-bold text-lg text-left transition-all ${btnStyle}`}
                  >
                    <div className={`w-9 h-9 border-[2px] border-black rounded-lg flex items-center justify-center font-black text-base shrink-0 ${badgeStyle}`}>
                      {letter}
                    </div>
                    <span className="flex-1 leading-snug">{option.optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {reviewFeedback && (
            <div className="mb-6 p-4 border-[3px] border-black bg-white brutal-shadow">
              <p className={`font-black text-xl mb-2 ${reviewFeedback === 'CORRECT' ? 'text-[#2A8B9D]' : 'text-[#F05A4A]'}`}>
                {reviewFeedback === 'CORRECT' ? '🎉 Chính xác!' : '❌ Chưa chính xác!'}
              </p>
              {currentReviewQuestion.explanation && (
                <p className="text-gray-700 font-medium">{currentReviewQuestion.explanation}</p>
              )}
            </div>
          )}

          {reviewFeedback && (
            <div className="flex justify-end">
              <Button
                className="brutal-pill font-black h-12 px-8 uppercase !bg-[#1D2A3A] !text-white text-lg hover:-translate-y-1 transition-transform"
                onClick={handleNextReview}
              >
                {reviewCurrentIndex + 1 < incorrectQuestions.length ? 'Câu tiếp theo ➔' : 'Hoàn thành ôn luyện ✓'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <div className="flex gap-4 flex-wrap">
            {incorrectQuestions.length > 0 && (
              <Button
                className="brutal-border font-bold h-12 px-6 !bg-[#F05A4A] !text-white shadow-[2px_2px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform"
                onClick={() => setIsReviewMode(true)}
              >
                🔁 ÔN LẠI {incorrectQuestions.length} CÂU SAI
              </Button>
            )}
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
                    <div className="text-base font-normal mt-1">Bạn đã vượt qua Bài thi kết thúc Level và được nâng lên Level tiếp theo.</div>
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

          {isPlacement && (() => {
            const isLowest = Boolean(
              placementResult?.isLowestLevel ||
              attemptDetail?.levelAtAttempt?.displayOrder === 1 ||
              (attemptDetail?.levelAtAttempt?.name && attemptDetail.levelAtAttempt.name.includes('Dưới 500')) ||
              (quizRes?.data?.quizCode === 'PLACEMENT-TOEIC-U500')
            );
            const isPassed = Boolean(attemptDetail?.passed);
            const targetLevelName = placementResult?.assignedLevel?.name ||
              placementResult?.suggestedLevel?.name ||
              attemptDetail?.levelAtAttempt?.name ||
              'Cơ bản (Dưới 500)';

            return (
              <div className="w-full mt-6 flex flex-col items-center border-[3px] border-black p-6 bg-[#f4f3ee]">
                <h3 className="text-2xl font-black mb-6 uppercase text-[#1D2A3A]">TỔNG KẾT XÁC ĐỊNH TRÌNH ĐỘ TOEIC</h3>
                
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

                {/* Case 1: PASSED AT ANY LEVEL */}
                {isPassed && (
                  <>
                    <div className="w-full mb-6 p-4 border-2 rounded font-bold text-center text-lg bg-green-100 border-green-600 text-green-800">
                      🎉 Chúc mừng! Bạn đã đạt {attemptDetail.scorePercent != null ? Number(attemptDetail.scorePercent).toFixed(0) : 0}% ở bài kiểm tra xác định trình độ!
                      <div className="text-base font-normal mt-1">Trình độ của bạn đã được cập nhật thành công!</div>
                    </div>

                    <div className="w-full flex flex-col items-center bg-[#2A8B9D] text-white p-6 border-[3px] border-black brutal-shadow mb-6">
                      <span className="font-bold text-base mb-1 tracking-wider uppercase">TRÌNH ĐỘ ĐẠT ĐƯỢC</span>
                      <span className="text-3xl font-black uppercase text-center">
                        {targetLevelName}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      <Button
                        className="brutal-border font-black text-lg h-14 px-8 !bg-[#1D2A3A] !text-white shadow-[4px_4px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform"
                        onClick={handlePlacementConfirm}
                      >
                        BẮT ĐẦU HỌC TẠI TRÌNH ĐỘ MỚI ➔
                      </Button>
                    </div>
                  </>
                )}

                {/* Case 2: FAILED AT LOWEST LEVEL (DƯỚI 500) -> AUTOMATICALLY ASSIGN LOWEST LEVEL */}
                {!isPassed && isLowest && (
                  <>
                    <div className="w-full mb-6 p-4 border-2 rounded font-bold text-center text-lg bg-blue-50 border-blue-500 text-[#1D2A3A]">
                      <div className="text-xl font-black text-[#1D2A3A] mb-1">
                        🎯 KẾT QUẢ XÁC ĐỊNH TRÌNH ĐỘ
                      </div>
                      <div className="text-base font-normal mt-1 text-gray-700">
                        Số câu đúng: <span className="font-black">{attemptDetail.correctAnswers} / {attemptDetail.totalQuestions}</span> ({attemptDetail.scorePercent != null ? Number(attemptDetail.scorePercent).toFixed(0) : 0}%)
                      </div>
                      <div className="mt-3 p-3 bg-white border-2 border-black rounded text-sm text-gray-800 font-semibold">
                        Vì <span className="font-black text-[#2A8B9D]">Cơ bản (Dưới 500)</span> là trình độ thấp nhất trong hệ thống, hệ thống đã xếp bạn vào trình độ Cơ bản để có thể bắt đầu học ngay!
                      </div>
                    </div>

                    <div className="w-full flex flex-col items-center bg-[#2A8B9D] text-white p-6 border-[3px] border-black brutal-shadow mb-6">
                      <span className="font-bold text-base mb-1 tracking-wider uppercase">TRÌNH ĐỘ ĐƯỢC XẾP</span>
                      <span className="text-3xl font-black uppercase text-center">
                        Cơ bản (Dưới 500)
                      </span>
                      <span className="text-xs text-white/90 mt-2 font-medium">Bạn có thể bắt đầu lộ trình học từ vựng và bài tập ngay bây giờ!</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      <Button
                        className="brutal-border font-black text-lg h-14 px-8 !bg-[#1D2A3A] !text-white shadow-[4px_4px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform"
                        onClick={handlePlacementConfirm}
                      >
                        BẮT ĐẦU HỌC ➔
                      </Button>
                      <Button
                        className="brutal-border font-bold text-lg h-14 px-8 !bg-white !text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:!translate-y-[-2px] transition-transform"
                        onClick={() => {
                          window.scrollTo({ top: 700, behavior: 'smooth' });
                        }}
                      >
                        XEM KẾT QUẢ CHI TIẾT ➔
                      </Button>
                    </div>
                  </>
                )}

                {/* Case 3: FAILED AT HIGHER LEVEL (500-700, 700-850, 850-990) -> SHOW LOWER LEVEL OPTIONS */}
                {!isPassed && !isLowest && (
                  <>
                    <div className="w-full mb-6 p-4 border-2 rounded font-bold text-center text-lg bg-amber-50 border-amber-500 text-amber-900">
                      ❌ Bạn chưa đạt 80% ở bài kiểm tra trình độ {targetLevelName} ({attemptDetail.scorePercent != null ? Number(attemptDetail.scorePercent).toFixed(0) : 0}%).
                      <div className="text-base font-normal mt-2 text-gray-700">
                        Trình độ {targetLevelName} chưa được gán. Bạn có thể chọn làm bài kiểm tra ở trình độ thấp hơn hoặc thử lại.
                      </div>
                    </div>

                    <div className="w-full p-4 bg-white border-2 border-black mb-6">
                      <div className="text-center font-black text-sm uppercase text-gray-600 mb-3">
                        GỢI Ý LỰA CHỌN TRÌNH ĐỘ PHÙ HỢP
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button
                          className="brutal-pill font-black bg-[#2A8B9D] text-white border-2 border-black h-11 px-5 text-sm shadow-[2px_2px_0px_0px_#000]"
                          onClick={() => navigate('/placement-tests')}
                        >
                          📋 XEM DANH SÁCH BÀI KIỂM TRA TRÌNH ĐỘ ➔
                        </Button>
                        <Button
                          className="brutal-pill font-bold bg-gray-100 text-gray-800 border-2 border-black h-11 px-5 text-sm"
                          onClick={() => navigate('/dashboard')}
                        >
                          VỀ BẢNG ĐIỀU KHIỂN HỌC ➔
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        <h3 className="text-2xl font-black mb-6 uppercase text-[#1D2A3A]">Chi tiết đáp án</h3>

        {questions.map((question: any, index: number) => {
          const answer = getAnswerForQuestion(question.id);

          return (
            <ExamReviewCard
              key={question.id}
              questionNumber={index + 1}
              question={question}
              answer={answer}
            />
          );
        })}
      </div>
    </div>
  );
}
