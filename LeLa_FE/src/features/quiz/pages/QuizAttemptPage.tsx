import { useEffect, useState } from 'react';
import { App, Button, Skeleton } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { quizAttemptsApi } from '../api/quiz-attempts.api';
import { normalizeQuizId } from '../utils/quiz-attempts';
import { ExamQuestionCard } from '../components/ExamQuestionCard';

interface QuizAnswerSubmitRequest {
  attemptQuestionId: number;
  selectedAttemptOptionId?: number;
  answerText?: string;
}

import { onboardingApi } from '../../users/api/onboarding.api';

interface QuizAttemptNavigationState {
  attemptData?: any;
  quizId?: number | string | null;
}

export function QuizAttemptPage() {
  const { quizId, publicId } = useParams<{ quizId?: string; publicId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const navigationState = location.state as QuizAttemptNavigationState | null;
  const initialAttemptData = navigationState?.attemptData;
  const numericQuizId = normalizeQuizId(quizId);
  const fallbackQuizId = normalizeQuizId(navigationState?.quizId);
  const isAttemptRoute = Boolean(publicId);
  const isStartRoute = !isAttemptRoute;
  const hasInvalidQuizId = isStartRoute && !numericQuizId;
  const shouldFetchAttemptDetail = isAttemptRoute && !!publicId && (!initialAttemptData || !initialAttemptData.questions?.length);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuizAnswerSubmitRequest>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: startAttemptRes, isLoading: isStartingAttempt, isError: isStartError } = useQuery({
    queryKey: ['startAttempt', numericQuizId],
    queryFn: () => quizAttemptsApi.startAttempt(numericQuizId),
    enabled: isStartRoute && !!numericQuizId && !initialAttemptData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: Infinity,
  });

  const { data: attemptDetailRes, isLoading: isLoadingAttemptDetail, isError: isAttemptDetailError } = useQuery({
    queryKey: ['attemptDetail', publicId],
    queryFn: () => quizAttemptsApi.getAttemptDetail(publicId!),
    enabled: shouldFetchAttemptDetail,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: Infinity,
  });

  const attemptData = attemptDetailRes?.data ?? initialAttemptData ?? startAttemptRes?.data;
  const isLoadingAttempt = isStartingAttempt || isLoadingAttemptDetail;
  const hasAttemptError = isStartError || isAttemptDetailError;

  useEffect(() => {
    if (attemptData?.timeLimitSeconds) {
      setTimeLeft(attemptData.timeLimitSeconds);
    }
  }, [attemptData]);

  useEffect(() => {
    if (!hasInvalidQuizId) {
      return;
    }

    message.error('Không thể bắt đầu bài kiểm tra.');
    console.error('Invalid quizId when starting quiz attempt:', quizId);
    navigate(-1);
  }, [hasInvalidQuizId, message, navigate, quizId]);

  useEffect(() => {
    if (!hasAttemptError) {
      return;
    }

    message.error(isAttemptRoute ? 'Không thể tải bài kiểm tra.' : 'Không thể bắt đầu bài kiểm tra.');
    navigate(-1);
  }, [hasAttemptError, isAttemptRoute, message, navigate]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const submitRes = await quizAttemptsApi.submitAttempt(attemptData.id, data);
      
      const category = attemptData.quizCategory ?? attemptData.quiz?.quizCategory;
      let placementData = null;
      if (category === 'PLACEMENT') {
        placementData = await onboardingApi.submitPlacement(attemptData.publicId);
      }
      
      return { submitRes, placementData, category };
    },
    onSuccess: (result) => {
      message.success('Nộp bài thành công!');
      navigate(`/quiz-attempts/${attemptData.publicId}/result`, {
        replace: true,
        state: {
          quizId: attemptData.quizId ?? fallbackQuizId ?? numericQuizId,
          placementResult: result.placementData,
        },
      });
    },
    onError: (err: any) => {
      console.error('Submit error:', err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài.');
    }
  });

  const handleSubmit = () => {
    const answersList = Object.values(answers);
    submitMutation.mutate({ answers: answersList });
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }

        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        attemptQuestionId: questionId,
        selectedAttemptOptionId: optionId,
      },
    }));
  };

  const handleTextAnswer = (questionId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        attemptQuestionId: questionId,
        answerText: text,
      },
    }));
  };

  if (isLoadingAttempt || !attemptData) {
    return <div className="min-h-screen bg-[#F4F3EE] p-8 max-w-3xl mx-auto"><Skeleton active paragraph={{ rows: 10 }} /></div>;
  }

  const questions = attemptData.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    console.error('Attempt data does not include questions:', attemptData);
    return <div className="min-h-screen bg-[#F4F3EE] p-8 text-center"><h2 className="text-2xl font-bold">Không có câu hỏi nào.</h2></div>;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <Button onClick={() => navigate(-1)} className="brutal-border font-bold h-12 px-6 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 transition-transform">
            &larr; THOÁT
          </Button>
          <div className="text-xl font-bold brutal-border bg-white px-6 py-2 shadow-[2px_2px_0px_0px_#000] border-[3px]">
            Câu {currentQuestionIndex + 1} / {totalQuestions}
          </div>
          {timeLeft !== null && (
            <div className={`text-xl font-black brutal-border bg-white px-6 py-2 shadow-[2px_2px_0px_0px_#000] border-[3px] ${timeLeft < 60 ? 'text-[#F05A4A] animate-pulse' : 'text-[#1D2A3A]'}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <ExamQuestionCard
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onOptionSelect={handleOptionSelect}
          onTextAnswer={handleTextAnswer}
        />

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8">
          <Button
            className="brutal-card h-14 px-8 font-black text-lg bg-white hover:-translate-y-1 transition-transform border-[3px] border-black shadow-[4px_4px_0px_0px_#000]"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            QUAY LẠI
          </Button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button
              className="brutal-pill h-14 px-12 font-black text-xl uppercase !bg-[#F05A4A] !text-white hover:!translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_#000] border-[3px] border-black"
              onClick={handleSubmit}
              loading={submitMutation.isPending}
            >
              NỘP BÀI
            </Button>
          ) : (
            <Button
              className="brutal-pill h-14 px-12 font-black text-xl uppercase !bg-[#1D2A3A] !text-white hover:!translate-y-[-2px] transition-transform shadow-[4px_4px_0px_0px_#000] border-[3px] border-black"
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              TIẾP TỤC
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
