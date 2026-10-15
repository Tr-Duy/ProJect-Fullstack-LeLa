import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, message, Checkbox } from 'antd';
import { Sparkles, Mic, Lock, Zap, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { voiceConversationApi } from '../api/voice-conversation.api';
import { VoiceCallRoom } from '../components/VoiceCallRoom';
import { VoiceReportModal } from '../components/VoiceReportModal';
import type { VoiceReportResponse, VoiceStartResponse } from '../api/voice-conversation.api';

export const VoiceConversationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [micConsentAccepted, setMicConsentAccepted] = useState(false);
  const [selectedScenarioSlug, setSelectedScenarioSlug] = useState<string>('');
  const [activeSession, setActiveSession] = useState<VoiceStartResponse | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [finalReport, setFinalReport] = useState<VoiceReportResponse | null>(null);

  // Lấy trạng thái hội thoại
  const { data: statusResp, isLoading: isStatusLoading } = useQuery({
    queryKey: ['voice-conversation', 'status'],
    queryFn: voiceConversationApi.getStatus,
  });

  // Lấy danh sách kịch bản
  const { data: scenariosResp, isLoading: isScenariosLoading } = useQuery({
    queryKey: ['voice-conversation', 'scenarios'],
    queryFn: voiceConversationApi.getScenarios,
  });

  const status = statusResp?.data;
  const scenarios = useMemo(() => scenariosResp?.data || [], [scenariosResp?.data]);

  useEffect(() => {
    if (scenarios.length > 0 && !selectedScenarioSlug) {
      setSelectedScenarioSlug(scenarios[0].slug);
    }
  }, [scenarios, selectedScenarioSlug]);

  // Bắt đầu phiên hội thoại
  const startMutation = useMutation({
    mutationFn: () => voiceConversationApi.startSession(selectedScenarioSlug || undefined),
    onSuccess: (res: { data: VoiceStartResponse }) => {
      setActiveSession(res.data);
      message.success('Đã kết nối cuộc gọi với AI thành công!');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể bắt đầu phiên thoại.');
    },
  });

  // Kết thúc phiên và lấy báo cáo
  const finishMutation = useMutation({
    mutationFn: (feedback?: string) => {
      if (!activeSession) return Promise.reject(new Error('No active session'));
      return voiceConversationApi.finishSession(activeSession.publicId, feedback);
    },
    onSuccess: (res: { data: VoiceReportResponse }) => {
      setFinalReport(res.data);
      setReportModalVisible(true);
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ['voice-conversation', 'status'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Lỗi kết thúc phiên thoại.');
    },
  });

  // Hủy phiên (Abandon)
  const abandonMutation = useMutation({
    mutationFn: () => {
      if (!activeSession) return Promise.reject(new Error('No active session'));
      return voiceConversationApi.abandonSession(activeSession.publicId);
    },
    onSuccess: () => {
      setActiveSession(null);
      message.info('Đã hủy phiên hội thoại.');
      queryClient.invalidateQueries({ queryKey: ['voice-conversation', 'status'] });
    },
  });

  const handleStart = () => {
    if (!micConsentAccepted) {
      message.warning('Vui lòng xác nhận đồng ý điều khoản Micro trước khi bắt đầu.');
      return;
    }
    startMutation.mutate();
  };

  const handleFinish = () => {
    finishMutation.mutate(undefined);
  };

  const handleFeedback = (fb: 'HARD' | 'COMFORTABLE' | 'EASY') => {
    finishMutation.mutate(fb);
  };

  if (isStatusLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Màn hình cuộc gọi đang diễn ra
  if (activeSession) {
    return (
      <div className="py-6 px-4">
        <VoiceCallRoom
          sessionData={activeSession}
          onFinishSession={handleFinish}
          onAbandonSession={() => abandonMutation.mutate()}
        />
        <VoiceReportModal
          visible={reportModalVisible}
          report={finalReport}
          onFeedback={handleFeedback}
          onClose={() => setReportModalVisible(false)}
        />
      </div>
    );
  }

  // Màn hình Lobby
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Banner Giới Thiệu */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 border-2 border-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-black  border border-teal-400/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Voice Conversation
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Hội Thoại Giọng Nói Tương Tác Với AI</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Luyện phản xạ đàm thoại thời gian thực bằng giọng nói tiếng Anh. AI sẽ đóng vai các tình huống đời sống thực tế, sửa lỗi ngữ pháp và tăng cấp độ theo năng lực của bạn.
          </p>
        </div>
      </div>

      {/* Điều kiện Mở Khóa */}
      {status && !status.unlocked ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Tính năng đang tạm khóa</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Bạn cần học và ghi nhớ tối thiểu <strong>20 thẻ từ vựng</strong> (hiện tại: {status.learnedCardsCount}/{status.requiredCardsCount} thẻ) để mở khóa phòng hội thoại AI.
          </p>
          <Button type="primary" size="large" href="/decks" className="rounded-xl font-bold bg-teal-600 h-11 px-6">
            Học Từ Vựng Ngay
          </Button>
        </div>
      ) : (
        /* Trạng thái đã mở khóa */
        <div className="space-y-6">
          {/* Thông số Dashboard nhỏ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 ">Level Hiện Tại</span>
                <div className="text-2xl font-black text-slate-800">{status?.currentLevel || 200}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 ">Lượt Còn Lại Hôm Nay</span>
                <div className="text-2xl font-black text-slate-800">
                  {status?.remainingQuota ?? 3}/{status?.maxSessionsPerDay ?? 3} lượt
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--teal-50)] text-[var(--teal)] rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 ">Phiên Đã Hoàn Thành</span>
                <div className="text-2xl font-black text-slate-800">{status?.totalSessions || 0} buổi</div>
              </div>
            </div>
          </div>

          {/* Chọn Kịch Bản */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-800">Chọn Tình Huống Giao Tiếp</h2>
            {isScenariosLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
                Đang tải danh sách tình huống...
              </div>
            ) : scenarios.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                Chưa có tình huống hội thoại nào khả dụng cho cấp độ này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenarios.map((sc: any) => {
                  const isSelected = selectedScenarioSlug === sc.slug;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setSelectedScenarioSlug(sc.slug)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 shadow-md ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-800 text-sm">{sc.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Level {sc.levelMin}-{sc.levelMax}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{sc.description}</p>
                      <div className="text-[11px] text-teal-700 font-semibold mt-2">
                        Vai của bạn: {sc.userRole}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quyền Riêng Tư & Micro */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <p className="font-bold text-slate-800">Cam kết bảo mật & Quyền riêng tư Micro:</p>
                <p>
                  LeLa sử dụng công nghệ nhận diện giọng nói trực tiếp từ trình duyệt để hỗ trợ bạn luyện nói. Máy chủ LeLa cam kết <strong>không thu thập và không lưu lại file ghi âm giọng nói</strong> của bạn.
                </p>
                <p className="text-slate-400">
                  Lưu ý: Dịch vụ nhận diện giọng nói của hãng trình duyệt (như Google trên Chrome) có thể xử lý âm thanh theo chính sách quyền riêng tư của họ.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <Checkbox
                checked={micConsentAccepted}
                onChange={(e) => setMicConsentAccepted(e.target.checked)}
                className="font-bold text-xs text-slate-700"
              >
                Tôi đã hiểu và đồng ý cho phép sử dụng Micro cho buổi hội thoại này.
              </Checkbox>
            </div>
          </div>

          {/* Nút Bắt Đầu */}
          <div className="text-center pt-2">
            <Button
              type="primary"
              size="large"
              loading={startMutation.isPending}
              disabled={(status?.remainingQuota ?? 0) <= 0 || !micConsentAccepted}
              onClick={handleStart}
              className="rounded-2xl font-black bg-teal-600 hover:bg-teal-700 h-14 px-10 text-lg shadow-lg shadow-teal-600/30 flex items-center gap-3 mx-auto"
            >
              <Mic className="w-5 h-5" />
              Bắt Đầu Cuộc Gọi Với AI
              <ArrowRight className="w-5 h-5" />
            </Button>
            {(status?.remainingQuota ?? 0) <= 0 && (
              <p className="text-xs text-rose-500 font-semibold mt-2">
                Bạn đã sử dụng hết 3 lượt của hôm nay. Lượt mới sẽ được làm mới vào 00:00!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Báo Cáo */}
      <VoiceReportModal
        visible={reportModalVisible}
        report={finalReport}
        onFeedback={handleFeedback}
        onClose={() => setReportModalVisible(false)}
      />
    </div>
  );
};
