import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAiApi } from '../../api/adminAiApi';
import { VoiceSessionDetailDrawer } from './VoiceSessionDetailDrawer';
import { Input } from '../../../../shared/components/ui/Input';
import { Button } from '../../../../shared/components/ui/Button';
import {
  Search,
  Clock,
  Eye,
  RotateCcw,
  Layers
} from 'lucide-react';
import { Pagination } from 'antd';
import type { AdminVoiceSession } from '../../types/adminAi';

export const VoiceSessionsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch voice sessions list
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-voice-sessions', search, statusFilter, startDate, endDate, currentPage, pageSize],
    queryFn: () =>
      adminAiApi.getVoiceSessions({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage - 1,
        size: pageSize,
      }),
  });

  // Fetch detail when session is selected
  const { data: sessionDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-voice-session-detail', selectedSessionId],
    queryFn: () => adminAiApi.getVoiceSessionDetail(selectedSessionId!),
    enabled: selectedSessionId !== null && isDetailOpen,
  });

  const sessions: AdminVoiceSession[] = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  const handleOpenDetail = (id: number) => {
    setSelectedSessionId(id);
    setIsDetailOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-geist-bg-100 p-4 rounded-xl border border-geist-gray-300 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-geist-gray-500 absolute left-3 top-3" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên học viên, email, mã phiên..."
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
              <option value="IN_PROGRESS">Đang đàm thoại (IN_PROGRESS)</option>
              <option value="ABANDONED">Lỗi / Hủy (ABANDONED)</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-2.5 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            />
            <span className="text-geist-gray-500 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-2.5 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            />
          </div>

          {(search || statusFilter || startDate || endDate) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Xóa bộ lọc
            </Button>
          )}
        </div>

        <div className="text-xs text-geist-gray-600 whitespace-nowrap">
          Tổng số: <span className="font-bold text-geist-gray-1000">{totalElements}</span> phiên
        </div>
      </div>

      {/* Table */}
      <div className="bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-sm text-geist-gray-600">Đang tải nhật ký hội thoại giọng nói...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-sm font-semibold text-geist-gray-800">Không tìm thấy phiên hội thoại nào</p>
            <p className="text-xs text-geist-gray-500">Hãy thử xóa bộ lọc tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-geist-gray-300 bg-geist-gray-50 text-xs font-semibold text-geist-gray-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Học viên</th>
                  <th className="py-3 px-4">Kịch bản áp dụng</th>
                  <th className="py-3 px-4 text-center">Điểm tổng quan</th>
                  <th className="py-3 px-4">Chi tiết điểm (P/G/F/V)</th>
                  <th className="py-3 px-4">Thời lượng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geist-gray-200">
                {sessions.map((sess) => {
                  const score = sess.overallScore;
                  let scoreBadgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
                  if (score !== null && score !== undefined) {
                    if (score >= 80) scoreBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                    else if (score >= 60) scoreBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                    else scoreBadgeClass = 'bg-red-50 text-red-800 border-red-300 font-bold';
                  }

                  return (
                    <tr key={sess.id} className="hover:bg-geist-gray-50/70 transition-colors">
                      {/* Learner Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-geist-gray-900">{sess.userFullName}</div>
                        <div className="text-xs text-geist-gray-500 truncate">@{sess.username}</div>
                      </td>

                      {/* Scenario Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-geist-gray-900 line-clamp-1" title={sess.scenarioTitle}>
                          {sess.scenarioTitle}
                        </div>
                        <div className="text-[11px] text-geist-gray-500 flex items-center gap-1 mt-0.5">
                          <Layers className="w-3 h-3 text-[var(--brand-500)]" /> Level bắt đầu: {sess.levelAtStart}
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs border ${scoreBadgeClass}`}>
                          {score !== null && score !== undefined ? `${score}/100` : '--'}
                        </span>
                      </td>

                      {/* Sub-scores */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-geist-gray-700">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span>P (Phát âm): <b>{sess.pronunciationScore ?? '-'}</b></span>
                          <span>G (Ngữ pháp): <b>{sess.grammarScore ?? '-'}</b></span>
                          <span>F (Lưu loát): <b>{sess.fluencyScore ?? '-'}</b></span>
                          <span>V (Từ vựng): <b>{sess.vocabularyScore ?? '-'}</b></span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-geist-gray-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-geist-gray-500" />
                          {sess.minutesUsed} phút
                        </div>
                        <div className="text-[11px] text-geist-gray-500">
                          {sess.validTurnCount} lượt nói
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            sess.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sess.status === 'ABANDONED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sess.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : sess.status === 'ABANDONED'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          {sess.status === 'COMPLETED'
                            ? 'Thành công'
                            : sess.status === 'ABANDONED'
                            ? 'Lỗi / Hủy'
                            : 'Đang đàm thoại'}
                        </span>
                      </td>

                      {/* Started time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-geist-gray-600">
                        {new Date(sess.startedAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDetail(sess.id)}
                          className="hover:text-[var(--brand-500)] text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalElements > 0 && (
          <div className="p-4 border-t border-geist-gray-300 bg-geist-bg-100 flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs text-geist-gray-600">
              Trang {currentPage} / {Math.ceil(totalElements / pageSize)}
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalElements}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
            />
          </div>
        )}
      </div>

      {/* Session Detail Drawer / Modal */}
      <VoiceSessionDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSessionId(null);
        }}
        session={sessionDetail || null}
        isLoading={isLoadingDetail}
      />
    </div>
  );
};
