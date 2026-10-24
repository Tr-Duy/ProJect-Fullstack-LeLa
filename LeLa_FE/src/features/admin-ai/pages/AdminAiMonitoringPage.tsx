import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAiApi } from '../api/adminAiApi';
import { VoiceSessionsTab } from '../components/monitoring/VoiceSessionsTab';
import { QuotaLedgerTab } from '../components/monitoring/QuotaLedgerTab';
import { AiTutorFallbackTab } from '../components/monitoring/AiTutorFallbackTab';
import {
  BrainCircuit,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Activity,
  Clock,
  ShieldAlert,
  Users,
  CheckCircle2
} from 'lucide-react';
import type { AdminAiOverviewStats } from '../types/adminAi';

type TabType = 'VOICE_SESSIONS' | 'QUOTA_LEDGER' | 'AI_TUTOR_LOGS';

export const AdminAiMonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('VOICE_SESSIONS');

  // Fetch KPI overview stats
  const { data: stats } = useQuery<AdminAiOverviewStats>({
    queryKey: ['admin-ai-overview'],
    queryFn: () => adminAiApi.getOverviewStats(),
    refetchInterval: 30000, // refresh every 30s
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-geist-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[var(--brand-500)] flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-geist-gray-1000">
              Giám sát & Hạn mức AI
            </h1>
            <p className="text-xs text-geist-gray-600 mt-0.5">
              Theo dõi chất lượng đàm thoại AI Voice, quản trị biến động sổ cái phút học và nhật ký Fallback trợ lý AI Tutor
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Voice Sessions */}
        <div className="p-4 bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-geist-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Phiên Thoại AI</span>
            <Mic className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-geist-gray-1000">
              {stats?.totalVoiceSessions ?? '--'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {stats?.completedVoiceSessions ?? 0} hoàn thành
            </div>
          </div>
        </div>

        {/* Card 2: Voice Minutes */}
        <div className="p-4 bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-geist-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Phút Học Thoại</span>
            <Clock className="w-4 h-4 text-[var(--brand-500)]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--brand-500)]">
              {stats?.totalVoiceMinutes ?? '--'}
              <span className="text-xs font-normal text-geist-gray-600 ml-1">phút</span>
            </div>
            <div className="text-[11px] text-geist-gray-500 mt-1">
              Ghi nhận qua SO_GHI_HAN_MUC
            </div>
          </div>
        </div>

        {/* Card 3: Active Scenarios */}
        <div className="p-4 bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-geist-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kịch bản AI</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-geist-gray-1000">
              {stats?.publishedScenarios ?? '--'}
              <span className="text-xs font-normal text-geist-gray-600 ml-1">/ {stats?.totalScenarios ?? 0}</span>
            </div>
            <div className="text-[11px] text-geist-gray-500 mt-1">
              Đang hoạt động trên LeLa
            </div>
          </div>
        </div>

        {/* Card 4: AI Tutor & Fallback */}
        <div className="p-4 bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-geist-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tutor Fallback</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-700">
              {stats?.totalFallbackTriggeredConversations ?? 0}
              <span className="text-xs font-normal text-geist-gray-600 ml-1">
                / {stats?.totalAiTutorConversations ?? 0} phiên
              </span>
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">
              Tự phục hồi qua Context Data
            </div>
          </div>
        </div>

        {/* Card 5: Active AI Users */}
        <div className="p-4 bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-geist-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Học Viên Dùng AI</span>
            <Users className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-geist-gray-1000">
              {stats?.totalActiveAiUsers ?? '--'}
            </div>
            <div className="text-[11px] text-geist-gray-500 mt-1">
              Đã mở khóa & có cấp độ AI
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="border-b border-geist-gray-300 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('VOICE_SESSIONS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'VOICE_SESSIONS'
              ? 'border-[var(--brand-500)] text-[var(--brand-500)] bg-orange-50/40 rounded-t-lg'
              : 'border-transparent text-geist-gray-600 hover:text-geist-gray-1000 hover:bg-geist-gray-50'
          }`}
        >
          <Mic className="w-4 h-4" />
          Tab 1: Nhật ký Hội thoại Giọng nói (Voice Sessions)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUOTA_LEDGER')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'QUOTA_LEDGER'
              ? 'border-[var(--brand-500)] text-[var(--brand-500)] bg-orange-50/40 rounded-t-lg'
              : 'border-transparent text-geist-gray-600 hover:text-geist-gray-1000 hover:bg-geist-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Tab 2: Sổ cái & Điều chỉnh Hạn mức (Quota Ledger)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AI_TUTOR_LOGS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'AI_TUTOR_LOGS'
              ? 'border-[var(--brand-500)] text-[var(--brand-500)] bg-orange-50/40 rounded-t-lg'
              : 'border-transparent text-geist-gray-600 hover:text-geist-gray-1000 hover:bg-geist-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Tab 3: Giám sát Trợ lý AI Tutor & Fallback Logs
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'VOICE_SESSIONS' && <VoiceSessionsTab />}
        {activeTab === 'QUOTA_LEDGER' && <QuotaLedgerTab />}
        {activeTab === 'AI_TUTOR_LOGS' && <AiTutorFallbackTab />}
      </div>
    </div>
  );
};

export default AdminAiMonitoringPage;
