import React from 'react';
import { Modal, Button } from 'antd';
import { Award, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { VoiceReportResponse } from '../api/voice-conversation.api';

interface VoiceReportModalProps {
  visible: boolean;
  report: VoiceReportResponse | null;
  onFeedback: (feedback: 'HARD' | 'COMFORTABLE' | 'EASY') => void;
  onClose: () => void;
}

export const VoiceReportModal: React.FC<VoiceReportModalProps> = ({
  visible,
  report,
  onFeedback,
  onClose,
}) => {
  if (!report) return null;

  const isEasyBlocked = report.overallScore < 50;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      className="rounded-2xl overflow-hidden"
    >
      <div className="py-2 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 border-b pb-4">
          <div className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-2xl mb-1">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Báo Cáo Tổng Kết Phiên Thoại</h2>
          <p className="text-slate-500 text-sm">Đánh giá khách quan theo 4 tiêu chí hội thoại</p>
        </div>

        {/* Level & XP Banner */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-center">
            <span className="text-xs font-bold text-slate-500 ">Level Sau Buổi Học</span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xl font-bold text-slate-400">{report.oldLevel}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-2xl font-black text-teal-600">{report.newLevel}</span>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
            <span className="text-xs font-bold text-amber-700 ">Kinh Nghiệm Nhận Được</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-amber-600 font-black text-2xl">
              <Zap className="w-6 h-6 fill-amber-500" />
              +{report.xpAwarded} XP
            </div>
          </div>
        </div>

        {/* 4 Tiêu chí điểm số */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Tổng điểm</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{report.overallScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">/100</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Ngữ pháp</div>
            <div className="text-2xl font-black text-[var(--teal)] mt-1">{report.grammarScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">40% trọng số</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Từ vựng</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{report.vocabularyScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">40% trọng số</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Lưu loát</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{report.fluencyScore}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">20% trọng số</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic text-center">
          * Tiêu chí Phát âm: để trống (NULL) do sử dụng Web Speech nhận dạng văn bản, điểm số tập trung vào độ chính xác câu từ và lưu loát.
        </p>

        {/* Cảnh báo chọn HARD 3 lần liên tiếp */}
        {report.consecutiveHardWarning && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <span className="font-bold">Khuyến nghị ôn tập:</span> Bạn đã chọn đánh giá "Khó quá" trong 3 phiên liên tiếp. Bạn nên dành thêm thời gian ôn lại các thẻ Flashcard trong phần Học tập để củng cố nền tảng trước khi tiếp tục.
            </div>
          </div>
        )}

        {/* Danh sách Target Words */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold  text-slate-500">Kết Quả Dùng Từ Mục Tiêu</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {report.targetWords.map((tw) => (
              <div
                key={tw.flashcardId}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  tw.usedCorrectly
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : tw.status === 'USED_WRONG'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div>
                  <div className="font-bold">{tw.word}</div>
                  <div className="text-[11px] opacity-75">{tw.meaning}</div>
                </div>
                {tw.usedCorrectly && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Câu sai và sửa lỗi */}
        {report.corrections.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold  text-slate-500">Gợi Ý Sửa Câu & Ngữ Pháp</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {report.corrections.map((c, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500">
                    <span className="font-semibold text-rose-600">Bạn đã nói:</span> "{c.originalTranscript}"
                  </div>
                  <div className="text-emerald-700 font-semibold">
                    <span>Cách nói tự nhiên hơn:</span> "{c.correctedText}"
                  </div>
                  {c.errors && c.errors.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      Ghi chú: {c.errors.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nút đánh giá phản hồi */}
        <div className="pt-2 border-t space-y-3">
          <div className="text-center text-xs font-bold text-slate-600">
            Bạn cảm thấy độ khó của buổi hội thoại vừa rồi như thế nào?
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button
              danger
              size="large"
              className="font-bold rounded-xl h-11"
              onClick={() => onFeedback('HARD')}
            >
              Khó quá (-50)
            </Button>
            <Button
              type="primary"
              size="large"
              className="font-bold rounded-xl h-11 !bg-teal-600 hover:!bg-teal-700"
              onClick={() => onFeedback('COMFORTABLE')}
            >
              Vừa sức (Giữ)
            </Button>
            <Button
              size="large"
              disabled={isEasyBlocked}
              className={`font-bold rounded-xl h-11 border-2 ${
                isEasyBlocked ? 'border-slate-200 text-slate-300' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => onFeedback('EASY')}
            >
              {isEasyBlocked ? 'Dễ quá (Chặn)' : 'Dễ quá (+50)'}
            </Button>
          </div>
          {isEasyBlocked && (
            <p className="text-[11px] text-rose-500 text-center">
              * Nút "Dễ quá" tạm thời bị khóa vì điểm tổng dưới 50. Hãy chọn "Khó quá" hoặc "Vừa sức".
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
