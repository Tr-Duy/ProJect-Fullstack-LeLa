import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Progress, Skeleton, Tag, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LockOutlined,
  CheckCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { finalLevelAssessmentApi } from '../api/final-level-assessment.api';
import { useAuth } from '../../../shared/providers/AuthProvider';

export function FinalLevelAssessmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedQuizForModal, setSelectedQuizForModal] = useState<any | null>(null);
  const [showDecksDetail, setShowDecksDetail] = useState<boolean>(false);

  const { data: overviewResp, isLoading } = useQuery({
    queryKey: ['final-level-assessment'],
    queryFn: finalLevelAssessmentApi.getOverview,
  });

  const overview = overviewResp?.data;

  const resetCycleMutation = useMutation({
    mutationFn: finalLevelAssessmentApi.resetCycle,
    onSuccess: () => {
      message.success('Đã làm mới chu kỳ thi mới! Bạn có thể chọn bất kỳ bài nào.');
      queryClient.invalidateQueries({ queryKey: ['final-level-assessment'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo chu kỳ mới.');
    }
  });

  const completeDeckMutation = useMutation({
    mutationFn: (deckId: number) => finalLevelAssessmentApi.simulateCompleteDeck(deckId),
    onSuccess: () => {
      message.success('Đã mô phỏng hoàn thành bộ thẻ thành công!');
      queryClient.invalidateQueries({ queryKey: ['final-level-assessment'] });
    }
  });

  const currentLevelName = overview?.currentLevelName || user?.currentLevel?.name || 'Chưa xác định';
  const quizzes = overview?.quizzes || [];
  const decks = overview?.decks || [];
  const completedDecksCount = overview?.completedDecks ?? 0;
  const totalDecksCount = overview?.totalDecks ?? 0;
  const REQUIRED_DECKS = 15;
  const requiredTarget = Math.min(REQUIRED_DECKS, totalDecksCount > 0 ? totalDecksCount : REQUIRED_DECKS);
  const isEligible = overview?.isEligible ?? (completedDecksCount >= requiredTarget);
  const cycleStatus = overview?.cycleStatus || 'IN_PROGRESS';
  const isCooldownActive = !!(overview?.cooldownRemainingSeconds && overview.cooldownRemainingSeconds > 0);

  const handleStartClick = (quiz: any) => {
    setSelectedQuizForModal(quiz);
  };

  const handleConfirmStart = () => {
    if (selectedQuizForModal) {
      const quizId = selectedQuizForModal.id;
      setSelectedQuizForModal(null);
      navigate(`/quiz/${quizId}/start`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#F4F3EE]">
      {/* Header section */}
      <div className="mb-8 brutal-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-block bg-[#2A8B9D] text-white font-black text-xs px-3 py-1 mb-2 uppercase border-2 border-black">
              🏆 THI KẾT THÚC LEVEL
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#1D2A3A] mb-2 flex items-center gap-3">
              <TrophyOutlined className="text-[#F59E0B]" />
              BÀI THI KẾT THÚC LEVEL
            </h1>
            <p className="text-gray-600 font-bold text-base md:text-lg">
              Đánh giá tổng hợp kiến thức sau khi hoàn thành các bộ thẻ của Level hiện tại. Đạt ≥ 70% (14/20 câu) để nâng lên Level tiếp theo!
            </p>
          </div>

          <div className="bg-[#FEF3C7] border-2 border-[#F59E0B] p-4 rounded-lg flex flex-col min-w-[220px] shadow-[3px_3px_0px_0px_#000]">
            <span className="text-xs font-black uppercase text-gray-600">Trình độ hiện tại</span>
            <span className="text-xl font-black text-[#B45309]">{currentLevelName}</span>
          </div>
        </div>
      </div>

      {/* Deck Completion Progress Banner */}
      <div className="mb-8 brutal-card bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-black uppercase text-[#1D2A3A] flex items-center gap-2">
              {isEligible ? '✅ BẠN ĐÃ ĐỦ ĐIỀU KIỆN THI' : '⚠️ BẠN CHƯA ĐỦ ĐIỀU KIỆN THI'}
            </h2>
            <p className="text-gray-600 font-medium text-sm mt-1">
              {isEligible
                ? `Bạn đã hoàn thành ${completedDecksCount >= requiredTarget ? requiredTarget : completedDecksCount} bộ thẻ và có thể tham gia Bài thi kết thúc Level.`
                : `Bạn cần hoàn thành ít nhất ${requiredTarget} bộ thẻ của Level hiện tại để mở khóa Bài thi kết thúc Level.`}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-1">
            <div className="flex items-center gap-3">
              <span className="font-black text-lg text-[#2A8B9D]">
                {completedDecksCount} / {totalDecksCount} bộ thẻ
              </span>
              <Button
                size="small"
                className="brutal-pill font-bold text-xs bg-gray-100 hover:bg-gray-200 border-2 border-black"
                onClick={() => setShowDecksDetail(!showDecksDetail)}
              >
                {showDecksDetail ? 'Ẩn danh sách bộ thẻ ▲' : 'Xem danh sách bộ thẻ ▼'}
              </Button>
            </div>
            <span className="text-xs font-bold text-gray-500">
              {isEligible
                ? 'Đã đạt điều kiện tối thiểu.'
                : `Còn thiếu ${Math.max(0, requiredTarget - completedDecksCount)} bộ thẻ.`}
            </span>
          </div>
        </div>

        <Progress
          percent={Math.min(100, Math.round((completedDecksCount / (requiredTarget || 1)) * 100))}
          strokeColor={isEligible ? '#22C55E' : '#F59E0B'}
          trailColor="#E5E7EB"
          strokeWidth={14}
        />

        {/* Decks detail list dropdown */}
        {showDecksDetail && (
          <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
            <h4 className="font-black uppercase text-sm text-gray-700 mb-3">Danh sách bộ thẻ thuộc trình độ {currentLevelName}:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {decks.map((d: any) => (
                <div
                  key={d.id}
                  className={`p-3 border-2 border-black rounded flex justify-between items-center text-xs font-bold ${
                    d.isCompleted ? 'bg-[#F0FDF4] border-[#22C55E]' : 'bg-[#FFFBEB] border-[#F59E0B]'
                  }`}
                >
                  <div>
                    <span className="block font-black text-sm text-[#1D2A3A]">{d.title}</span>
                    <span className="text-gray-500">
                      {d.masteredCards || 0}/{d.totalCards || 16} thẻ đã thuộc
                    </span>
                  </div>
                  {d.isCompleted ? (
                    <Tag color="success" className="font-black border-black">✅ ĐÃ HOÀN THÀNH</Tag>
                  ) : (
                    <Button
                      size="small"
                      loading={completeDeckMutation.isPending}
                      className="brutal-pill font-black text-[10px] bg-[#F05A4A] text-white hover:!bg-[#d94f41] border border-black"
                      onClick={() => completeDeckMutation.mutate(d.id)}
                    >
                      ⚡ MÔ PHỎNG XONG
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cycle Status Banners */}
      {cycleStatus === 'REQUIRES_REVIEW' && (
        <div className="mb-8 brutal-card bg-[#FEF2F2] border-4 border-[#EF4444] p-6 shadow-[6px_6px_0px_0px_rgba(239,68,68,1)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-[#EF4444] uppercase mb-1 flex items-center gap-2">
              <ExclamationCircleOutlined /> ❌ CHƯA ĐẠT TRÌNH ĐỘ TRONG CHU KỲ NÀY
            </h3>
            <p className="text-gray-700 font-medium">
              Bạn đã hoàn thành cả 10 bài kiểm tra nhưng chưa đạt 70% ở bài nào. Vui lòng dành thời gian ôn tập lại kiến thức trước khi mở chu kỳ mới.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="large"
              icon={<BookOutlined />}
              className="brutal-pill font-black uppercase bg-[#2A8B9D] text-white hover:!bg-[#1F6B79] border-2 border-black h-12 px-5"
              onClick={() => navigate('/decks')}
            >
              Ôn Tập Từ Vựng ➔
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              loading={resetCycleMutation.isPending}
              className="brutal-pill font-black uppercase bg-[#F05A4A] text-white hover:!bg-[#d94f41] border-2 border-black h-12 px-5"
              onClick={() => resetCycleMutation.mutate()}
            >
              Mở Chu Kỳ Mới ➔
            </Button>
          </div>
        </div>
      )}

      {isCooldownActive && (
        <div className="mb-8 brutal-card bg-[#FFFBEB] border-4 border-[#F59E0B] p-6 shadow-[6px_6px_0px_0px_rgba(245,158,11,1)] flex items-center gap-4">
          <ClockCircleOutlined className="text-3xl text-[#D97706]" />
          <div>
            <h3 className="text-lg font-black text-[#92400E] uppercase mb-1">
              🔒 TẤT CẢ BÀI THI ĐANG TẠM KHÓA 12 GIỜ
            </h3>
            <p className="text-gray-700 font-medium">
              Bạn vừa thực hiện bài kiểm tra chưa đạt yêu cầu 70%. Hệ thống tạm khóa 12h để bạn nghỉ ngơi và ôn tập. 
              {overview?.cooldownRemainingSeconds && (
                <strong className="text-[#B45309] block mt-1">
                  Mở lại sau: {Math.floor(overview.cooldownRemainingSeconds / 3600)} giờ {Math.floor((overview.cooldownRemainingSeconds % 3600) / 60)} phút.
                </strong>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Main 10 Quizzes Grid */}
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
          {quizzes.map((quiz: any, idx: number) => {
            const status = quiz.attemptStatus || 'AVAILABLE';
            const isAvailable = status === 'AVAILABLE' && isEligible && !isCooldownActive;
            const isPassed = status === 'COMPLETED_PASSED';
            const isFailed = status === 'COMPLETED_FAILED';
            const isCooldown = status === 'GLOBAL_COOLDOWN' || isCooldownActive;

            return (
              <div
                key={quiz.id}
                className={`brutal-card bg-white p-6 border-4 border-black flex flex-col justify-between transition-all ${
                  isPassed
                    ? 'bg-[#F0FDF4] border-[#22C55E] shadow-[6px_6px_0px_0px_rgba(34,197,94,1)]'
                    : isAvailable
                      ? 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] border-black bg-white'
                      : isFailed
                        ? 'bg-[#FEF2F2] border-[#EF4444] opacity-90 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.4)]'
                        : 'bg-[#FAF9F6] opacity-80 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-xl font-black uppercase text-[#1D2A3A] leading-tight">
                      {quiz.title || `Final Test #${idx + 1}`}
                    </h3>
                    {isPassed ? (
                      <Tag color="success" className="font-bold text-xs border-black px-2 py-0.5">
                        <CheckCircleOutlined /> ĐÃ ĐẠT
                      </Tag>
                    ) : isFailed ? (
                      <Tag color="error" className="font-bold text-xs border-black px-2 py-0.5">
                        ❌ ĐÃ THI - KHÔNG ĐẠT
                      </Tag>
                    ) : isCooldown ? (
                      <Tag color="warning" className="font-bold text-xs border-black px-2 py-0.5">
                        <LockOutlined /> TẠM KHÓA 12H
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
                    20 câu hỏi trắc nghiệm / 20 phút - Thời gian đạt: ≥ 70% (14/20 câu)
                  </p>

                  {quiz.lockReason && (
                    <div className="mb-4 p-3 border-2 rounded text-xs font-bold bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] flex items-center gap-2">
                      <LockOutlined />
                      <span>{quiz.lockReason}</span>
                    </div>
                  )}
                </div>

                <Button
                  disabled={!isAvailable}
                  className={`w-full brutal-pill font-black uppercase h-11 border-2 border-black text-sm transition-all ${
                    isPassed
                      ? '!bg-[#22C55E] !text-white cursor-not-allowed opacity-90'
                      : isAvailable
                        ? '!bg-[#F05A4A] !text-white hover:!bg-[#D94F41] hover:!shadow-md cursor-pointer'
                        : '!bg-gray-200 !text-gray-500 cursor-not-allowed border-gray-400'
                  }`}
                  onClick={() => handleStartClick(quiz)}
                >
                  {isPassed
                    ? '✅ ĐÃ HOÀN THÀNH - ĐẠT'
                    : isFailed
                      ? '❌ ĐÃ THI - KHÔNG ĐẠT'
                      : isCooldown
                        ? '🔒 TẠM KHÓA 12H'
                        : isAvailable
                          ? 'BẮT ĐẦU BÀI THI ➔'
                          : '🔒 CHƯA ĐỦ ĐIỀU KIỆN'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Instruction Modal (Requirement 28) */}
      <Modal
        title={
          <div className="text-xl font-black uppercase text-[#1D2A3A] flex items-center gap-2">
            <TrophyOutlined className="text-[#F59E0B]" />
            🎯 BÀI THI KẾT THÚC LEVEL
          </div>
        }
        open={!!selectedQuizForModal}
        onCancel={() => setSelectedQuizForModal(null)}
        footer={[
          <Button
            key="cancel"
            size="large"
            className="brutal-pill font-bold border-2 border-black"
            onClick={() => setSelectedQuizForModal(null)}
          >
            HỦY
          </Button>,
          <Button
            key="confirm"
            size="large"
            className="brutal-pill font-black uppercase bg-[#F05A4A] text-white hover:!bg-[#D94F41] border-2 border-black px-6"
            onClick={handleConfirmStart}
          >
            BẮT ĐẦU BÀI THI ➔
          </Button>,
        ]}
      >
        {selectedQuizForModal && (
          <div className="py-4 space-y-3 font-medium text-gray-700">
            <div className="p-3 bg-[#E6F4F1] border-2 border-[#2A8B9D] rounded">
              <span className="block font-black text-[#2A8B9D]">Trình độ đánh giá: {currentLevelName}</span>
              <span className="text-xs text-gray-600">Đề thi: {selectedQuizForModal.title}</span>
            </div>

            <h4 className="font-black uppercase text-gray-800 text-sm mt-4">📋 QUY ĐỊNH BÀI THI:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Số lượng: <strong>20 câu hỏi trắc nghiệm</strong></li>
              <li>Thời gian: <strong>20 phút</strong></li>
              <li>Điểm đạt: <strong>≥ 70% (từ 14/20 câu đúng)</strong></li>
              <li><strong className="text-[#22C55E]">NẾU ĐẠT:</strong> Bạn sẽ được nâng lên đúng 1 trình độ tiếp theo lập tức.</li>
              <li><strong className="text-[#EF4444]">NẾU KHÔNG ĐẠT:</strong> Trình độ giữ nguyên. Bài kiểm tra này bị khóa trong chu kỳ, và <strong>toàn bộ 10 bài thi bị tạm khóa 12 giờ</strong>.</li>
            </ul>

            <p className="font-bold text-xs text-gray-500 italic mt-2">
              Bạn có chắc chắn muốn bắt đầu lượt thi này?
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
