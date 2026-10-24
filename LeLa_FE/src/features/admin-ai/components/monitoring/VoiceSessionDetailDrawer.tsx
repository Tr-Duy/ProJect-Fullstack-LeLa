import React from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import {
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { AdminVoiceSessionDetail, AdminVoiceTurn } from '../../types/adminAi';

interface VoiceSessionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: AdminVoiceSessionDetail | null;
  isLoading: boolean;
}

export const VoiceSessionDetailDrawer: React.FC<VoiceSessionDetailDrawerProps> = ({
  isOpen,
  onClose,
  session,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        session
          ? `Chi tiết Phiên Hội thoại AI: #${session.publicId.slice(0, 8)}`
          : 'Chi tiết Phiên Hội thoại'
      }
      className="max-w-4xl"
    >
      {isLoading || !session ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-sm text-geist-gray-600">Đang tải dữ liệu phiên đàm thoại...</p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          {/* Top Session Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Learner Card */}
            <div className="p-3 bg-geist-gray-50 rounded-xl border border-geist-gray-200">
              <span className="text-[11px] font-semibold text-geist-gray-500 uppercase tracking-wider block mb-1">
                Học viên
              </span>
              <div className="font-bold text-sm text-geist-gray-1000 truncate">
                {session.userFullName}
              </div>
              <div className="text-xs text-geist-gray-500 truncate">@{session.username}</div>
            </div>

            {/* Scenario Card */}
            <div className="p-3 bg-geist-gray-50 rounded-xl border border-geist-gray-200">
              <span className="text-[11px] font-semibold text-geist-gray-500 uppercase tracking-wider block mb-1">
                Kịch bản
              </span>
              <div className="font-bold text-sm text-geist-gray-1000 truncate" title={session.scenarioTitle}>
                {session.scenarioTitle}
              </div>
              <div className="text-xs text-geist-gray-500">
                AI: {session.aiRole} • Học viên: {session.userRole}
              </div>
            </div>

            {/* Duration & Status */}
            <div className="p-3 bg-geist-gray-50 rounded-xl border border-geist-gray-200">
              <span className="text-[11px] font-semibold text-geist-gray-500 uppercase tracking-wider block mb-1">
                Thời lượng & Trạng thái
              </span>
              <div className="font-bold text-sm text-geist-gray-1000 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-geist-gray-500" />
                {session.minutesUsed} phút ({session.durationSeconds}s)
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    session.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : session.status === 'ABANDONED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {session.status}
                </span>
              </div>
            </div>

            {/* Overall Score Card */}
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
              <span className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider block mb-0.5">
                Điểm Tổng Quan
              </span>
              <div className="text-2xl font-black text-[var(--brand-500)]">
                {session.overallScore !== null && session.overallScore !== undefined ? `${session.overallScore}/100` : '--'}
              </div>
              <div className="text-[11px] text-orange-700 font-medium">
                Level bắt đầu: {session.levelAtStart}
              </div>
            </div>
          </div>

          {/* Sub Scores Bar & Learner Feedback */}
          <div className="p-4 bg-geist-bg-200 rounded-xl border border-geist-gray-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 items-center text-center">
            <div>
              <div className="text-[11px] text-geist-gray-500 font-medium">Phát âm</div>
              <div className="text-base font-bold text-geist-gray-900">
                {session.pronunciationScore ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-geist-gray-500 font-medium">Ngữ pháp</div>
              <div className="text-base font-bold text-geist-gray-900">
                {session.grammarScore ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-geist-gray-500 font-medium">Độ lưu loát</div>
              <div className="text-base font-bold text-geist-gray-900">
                {session.fluencyScore ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-geist-gray-500 font-medium">Từ vựng</div>
              <div className="text-base font-bold text-geist-gray-900">
                {session.vocabularyScore ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-geist-gray-500 font-medium">Đánh giá người học</div>
              <div className="text-xs font-bold text-orange-600 mt-0.5">
                {session.userFeedback === 'HARD' || session.userFeedback === 'TOO_HARD' ? 'Quá Khó' :
                 session.userFeedback === 'EASY' || session.userFeedback === 'TOO_EASY' ? 'Quá Dễ' :
                 'Vừa Sức (OK)'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-geist-gray-500 font-medium">Đề xuất Hệ thống</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1 mt-0.5">
                {session.systemRecommendation === 'INCREASE' && (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Tăng level
                  </span>
                )}
                {session.systemRecommendation === 'DECREASE' && (
                  <span className="text-red-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" /> Giảm level
                  </span>
                )}
                {(session.systemRecommendation === 'KEEP' || !session.systemRecommendation) && (
                  <span className="text-blue-600 flex items-center gap-0.5">
                    <Minus className="w-3.5 h-3.5" /> Giữ nguyên
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Target Words Pill Box */}
          {session.targetWords && session.targetWords.length > 0 && (
            <div className="p-3.5 bg-orange-50/40 rounded-xl border border-orange-200/50">
              <span className="text-xs font-bold text-orange-900 uppercase tracking-wider block mb-2">
                Từ vựng mục tiêu trong phiên (Target Words):
              </span>
              <div className="flex flex-wrap gap-2">
                {session.targetWords.map((tw) => (
                  <span
                    key={tw.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      tw.usedCorrectly
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : tw.usedCount > 0
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : 'bg-geist-gray-100 text-geist-gray-600 border-geist-gray-300'
                    }`}
                  >
                    {tw.usedCorrectly ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : tw.usedCount > 0 ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-geist-gray-400" />
                    )}
                    <span className="font-bold">{tw.wordText}</span>
                    <span className="text-[10px] opacity-75">
                      ({tw.usedCorrectly ? 'Đúng' : tw.usedCount > 0 ? 'Dùng sai' : 'Chưa dùng'})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Two-Way Audio Transcript Timeline */}
          <div>
            <h4 className="text-xs font-bold text-geist-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[var(--brand-500)]" /> Dòng thời gian cuộc trò chuyện (Timeline Audio Transcript)
            </h4>

            {session.turns.length === 0 ? (
              <div className="p-6 text-center text-xs text-geist-gray-500 italic bg-geist-gray-50 rounded-xl">
                Không có lượt nói nào được ghi nhận trong phiên này.
              </div>
            ) : (
              <div className="space-y-4">
                {session.turns.map((turn: AdminVoiceTurn) => {
                  const isUser = turn.role === 'USER';
                  let parsedErrors: any[] = [];
                  if (turn.grammarErrorsJson) {
                    try {
                      parsedErrors = JSON.parse(turn.grammarErrorsJson);
                    } catch (e) {
                      // ignore parse error
                    }
                  }

                  return (
                    <div
                      key={turn.id}
                      className={`flex gap-3 p-4 rounded-xl border ${
                        isUser
                          ? 'bg-white border-geist-gray-200'
                          : 'bg-orange-50/40 border-orange-200/60'
                      }`}
                    >
                      {/* Avatar icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isUser
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-[var(--brand-500)]'
                        }`}
                      >
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        {/* Header: Name & Confidence */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-geist-gray-900">
                            {isUser ? `${session.userFullName} (Lượt #${turn.turnNumber})` : `Trợ lý AI (${session.aiRole})`}
                          </span>
                          <span className="text-[11px] text-geist-gray-500 flex items-center gap-2">
                            {turn.sttConfidence && (
                              <span>Độ tự tin STT: {Math.round(Number(turn.sttConfidence) * 100)}%</span>
                            )}
                            {turn.pronunciationScore && (
                              <span className="font-semibold text-emerald-600">
                                Phát âm: {turn.pronunciationScore}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Transcript */}
                        <p className="text-sm text-geist-gray-900 leading-relaxed font-sans">
                          {turn.transcript}
                        </p>

                        {/* Grammar Errors & Corrections */}
                        {parsedErrors.length > 0 && (
                          <div className="mt-2 p-3 bg-red-50/80 rounded-lg border border-red-200 text-xs space-y-1.5">
                            <div className="font-bold text-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              Lỗi sai ngữ pháp phát hiện ({parsedErrors.length}):
                            </div>
                            {parsedErrors.map((err, eIdx) => (
                              <div key={eIdx} className="pl-4 text-red-900">
                                • <span className="line-through text-red-700 font-semibold">{err.error}</span> ➔{' '}
                                <span className="font-bold text-emerald-700">{err.correction}</span>
                                {err.explanation && (
                                  <span className="text-geist-gray-600 block pl-2 text-[11px] italic">
                                    Giải thích: {err.explanation}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested Correction */}
                        {turn.correctedText && (
                          <div className="text-xs p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                            <span className="font-bold text-emerald-800 block mb-0.5">Gợi ý sửa trọn câu:</span>
                            "{turn.correctedText}"
                          </div>
                        )}

                        {/* Hint / Suggestion */}
                        {turn.suggestionText && (
                          <div className="text-xs text-geist-gray-500 italic">
                            {turn.suggestionText}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-geist-gray-200">
            <Button variant="secondary" onClick={onClose}>
              Đóng chi tiết
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
