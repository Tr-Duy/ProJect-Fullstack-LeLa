import React from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import {
  User,
  Bot,
  ShieldAlert
} from 'lucide-react';
import type { AdminAiTutorSession } from '../../types/adminAi';

interface AiTutorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AdminAiTutorSession | null;
  isLoading: boolean;
}

export const AiTutorDetailModal: React.FC<AiTutorDetailModalProps> = ({
  isOpen,
  onClose,
  session,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        session
          ? `Nhật ký Đối thoại AI Tutor: #${session.id} - ${session.userFullName}`
          : 'Chi tiết Hội thoại AI Tutor'
      }
      className="max-w-4xl"
    >
      {isLoading || !session ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-sm text-geist-gray-600">Đang tải nhật ký tin nhắn...</p>
        </div>
      ) : (
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Summary */}
          <div className="p-3.5 bg-geist-gray-50 rounded-xl border border-geist-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-geist-gray-500">Học viên: </span>
              <span className="font-bold text-geist-gray-900">{session.userFullName}</span> (
              <span className="text-geist-gray-600">@{session.username}</span>)
            </div>
            <div>
              <span className="text-geist-gray-500">Thời gian tạo: </span>
              <span className="font-medium text-geist-gray-800">
                {new Date(session.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Smart Fallback Warning Banner if triggered */}
          {session.isFallbackTriggered && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-900 text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Phiên này đã kích hoạt "Smart Data-Driven Fallback"
              </div>
              <div className="space-y-1">
                {session.fallbackReason && (
                  <div>
                    <b>Nguyên nhân:</b> {session.fallbackReason}
                  </div>
                )}
                {session.errorMessage && (
                  <div className="font-mono text-[11px] bg-amber-100/60 p-2 rounded text-amber-900 break-all">
                    {session.errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-geist-gray-700 uppercase tracking-wider">
              Nội dung trao đổi ({session.messages?.length || 0} tin nhắn)
            </h4>

            {(!session.messages || session.messages.length === 0) ? (
              <p className="text-xs text-geist-gray-500 italic p-4 text-center bg-geist-gray-50 rounded-lg">
                Chưa có tin nhắn nào trong phiên này.
              </p>
            ) : (
              <div className="space-y-3">
                {session.messages.map((msg) => {
                  const isLearner = msg.senderType === 'LEARNER';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 p-3.5 rounded-xl border ${
                        isLearner
                          ? 'bg-white border-geist-gray-200'
                          : msg.isFallback
                          ? 'bg-purple-50/70 border-purple-200'
                          : 'bg-orange-50/30 border-orange-200/50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isLearner
                            ? 'bg-blue-100 text-blue-700'
                            : msg.isFallback
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-[var(--brand-500)]'
                        }`}
                      >
                        {isLearner ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-geist-gray-900 flex items-center gap-1.5">
                            {isLearner ? session.userFullName : 'LeLa AI Tutor'}
                            {!isLearner && msg.isFallback && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                SMART FALLBACK
                              </span>
                            )}
                            {!isLearner && !msg.isFallback && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                GEMINI API
                              </span>
                            )}
                          </span>

                          <span className="text-[11px] text-geist-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="text-sm text-geist-gray-900 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-geist-gray-200">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
