import React from 'react';
import { ArrowRightOutlined, BookOutlined, AudioOutlined, CheckCircleFilled } from '@ant-design/icons';
import { VocabCard } from '../../../shared/components/ui/VocabCard';
import { LelaMascot } from '../../../shared/components/ui/LelaMascot';
import type { FlashcardResponse } from '../../../shared/types/lela';

interface NextActionCardProps {
  dueTodayCount: number;
  dailyGoalTarget: number;
  cardsReviewedToday: number;
  featuredCard?: FlashcardResponse | null;
  onStartReview: () => void;
  onLearnNew: () => void;
  onStartVoiceAI: () => void;
  onStartQuiz: () => void;
  hasVoiceQuota?: boolean;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({
  dueTodayCount,
  dailyGoalTarget,
  cardsReviewedToday,
  featuredCard,
  onStartReview,
  onLearnNew,
  onStartVoiceAI,
  onStartQuiz,
  hasVoiceQuota = true,
}) => {
  // Estimated minutes: ceil(N * 8 seconds / 60)
  const estimatedMinutes = Math.max(1, Math.ceil((dueTodayCount * 8) / 60));
  const remainingForGoal = Math.max(0, dailyGoalTarget - cardsReviewedToday);
  const isGoalMet = dailyGoalTarget > 0 && cardsReviewedToday >= dailyGoalTarget;

  // Real vocab card props from featured card or curated TOEIC vocabulary
  const vocabWord = featuredCard?.frontText || 'accommodate';
  const vocabPhonetic = featuredCard?.phonetic || '/əˈkɑː.mə.deɪt/';
  const vocabMeaning = featuredCard?.backText || 'cung cấp chỗ ở, đáp ứng nhu cầu';
  const vocabPartOfSpeech = featuredCard?.partOfSpeech || 'verb';
  const vocabExample =
    featuredCard?.exampleText ||
    'The conference center can accommodate up to 500 participants comfortably.';
  const vocabTranslation =
    featuredCard?.exampleTranslation ||
    'Trung tâm hội nghị có thể đáp ứng chỗ cho tới 500 người tham gia một cách thoải mái.';
  const vocabAudio = featuredCard?.frontAudioUrl;

  return (
    <div className="bg-[var(--surface)] rounded-[24px] p-6 sm:p-8 border border-[var(--border)] shadow-[var(--shadow-md)] relative transition-all duration-200">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] items-center gap-8">
        {/* Left Side: Priority Next Action */}
        <div className="min-w-0 space-y-4 text-left w-full">
          {dueTodayCount > 0 ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
                Ôn tập định kỳ SM-2
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] tracking-tight">
                  Còn {dueTodayCount} thẻ cần ôn hôm nay
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-2)] mt-1.5 leading-relaxed">
                  Khoảng {estimatedMinutes} phút để ôn đúng nhịp và củng cố từ vựng vào trí nhớ dài hạn.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartReview}
                  className="h-12 px-6 rounded-[12px] bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white text-sm sm:text-base font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu ôn</span>
                  <ArrowRightOutlined className="text-xs" />
                </button>

                <button
                  type="button"
                  onClick={onLearnNew}
                  className="h-12 px-5 rounded-[12px] bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <BookOutlined />
                  <span>Học thẻ mới</span>
                </button>
              </div>
            </>
          ) : !isGoalMet ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--success-50)] text-[var(--success)] text-xs font-semibold">
                <CheckCircleFilled />
                Đã xong các thẻ đến hạn
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] tracking-tight">
                  Bạn đã ôn xong thẻ đến hạn!
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-2)] mt-1.5 leading-relaxed">
                  Học thêm {remainingForGoal} từ mới để chạm mục tiêu {dailyGoalTarget} thẻ hôm nay.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onLearnNew}
                  className="h-12 px-6 rounded-[12px] bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white text-sm sm:text-base font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <BookOutlined />
                  <span>Học từ mới ngay</span>
                  <ArrowRightOutlined className="text-xs" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--success-50)] text-[var(--success)] text-xs font-semibold">
                <span>🎉</span>
                Mục tiêu hôm nay đã xong!
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] tracking-tight">
                  Xuất sắc! Bạn đã hoàn thành chỉ tiêu ngày
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-2)] mt-1.5 leading-relaxed">
                  Giữ vững đà học tập! Hãy thử phản xạ luyện nói tình huống cùng AI.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {hasVoiceQuota ? (
                  <button
                    type="button"
                    onClick={onStartVoiceAI}
                    className="h-12 px-6 rounded-[12px] bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white text-sm sm:text-base font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                  >
                    <AudioOutlined />
                    <span>Luyện nói với AI</span>
                    <ArrowRightOutlined className="text-xs" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStartQuiz}
                    className="h-12 px-6 rounded-[12px] bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white text-sm sm:text-base font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Làm bài kiểm tra</span>
                    <ArrowRightOutlined className="text-xs" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLearnNew}
                  className="h-12 px-5 rounded-[12px] bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <BookOutlined />
                  <span>Học thêm từ mới</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Side: Real Interactive Vocabulary Card (or Lela celebrating if goal achieved) */}
        <div className="w-full max-w-[320px] min-w-0 [overflow-wrap:anywhere] p-4 flex items-center justify-center mx-auto">
          {isGoalMet && dueTodayCount === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 bg-[var(--surface-2)] rounded-[20px] text-center w-full max-w-[300px]">
              <LelaMascot size={88} mood="celebrating" />
              <span className="font-display font-bold text-base text-[var(--text)] mt-3">
                Tuyệt vời lắm!
              </span>
              <span className="text-xs text-[var(--text-3)] mt-1">
                Đã hoàn thành {cardsReviewedToday}/{dailyGoalTarget} thẻ hôm nay
              </span>
            </div>
          ) : (
            <VocabCard
              word={vocabWord}
              phonetic={vocabPhonetic}
              meaning={vocabMeaning}
              partOfSpeech={vocabPartOfSpeech}
              exampleText={vocabExample}
              exampleTranslation={vocabTranslation}
              audioUrl={vocabAudio}
              rotateDeg={-2}
            />
          )}
        </div>
      </div>
    </div>
  );
};
