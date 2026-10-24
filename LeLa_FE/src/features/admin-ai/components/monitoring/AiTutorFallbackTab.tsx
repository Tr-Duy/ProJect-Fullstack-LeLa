import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAiApi } from '../../api/adminAiApi';
import { AiTutorDetailModal } from './AiTutorDetailModal';
import { Input } from '../../../../shared/components/ui/Input';
import { Button } from '../../../../shared/components/ui/Button';
import {
  BrainCircuit,
  Search,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Sparkles
} from 'lucide-react';
import { Pagination } from 'antd';
import type { AdminAiTutorSession } from '../../types/adminAi';

export const AiTutorFallbackTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isFallbackOnly, setIsFallbackOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch AI tutor logs
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-ai-tutor-logs', search, isFallbackOnly, startDate, endDate, currentPage, pageSize],
    queryFn: () =>
      adminAiApi.getAiTutorLogs({
        search: search.trim() || undefined,
        isFallbackOnly: isFallbackOnly ? true : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage - 1,
        size: pageSize,
      }),
  });

  // Fetch session detail
  const { data: sessionDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-ai-tutor-detail', selectedSessionId],
    queryFn: () => adminAiApi.getAiTutorLogDetail(selectedSessionId!),
    enabled: selectedSessionId !== null && isDetailOpen,
  });

  const logs: AdminAiTutorSession[] = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  const handleOpenDetail = (id: number) => {
    setSelectedSessionId(id);
    setIsDetailOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setIsFallbackOnly(false);
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Educational Banner */}
      <div className="p-4 bg-gradient-to-r from-orange-50 via-purple-50 to-orange-50 rounded-xl border border-orange-200/70 text-xs text-geist-gray-800 space-y-1.5 shadow-sm">
        <div className="font-bold text-sm text-[var(--brand-600)] flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[var(--brand-500)]" />
          Giám sát Trợ lý Học tập AI Tutor & Cơ chế Tự phục hồi "Smart Data-Driven Fallback"
        </div>
        <p className="text-geist-gray-600 leading-relaxed">
          Khi Google Gemini API quá tải, hết quota (HTTP 429) hoặc mạng chập chờn, LeLa kích hoạt thuật toán{' '}
          <b className="text-purple-700">Smart Data-Driven Fallback</b> để tự động bóc tách thông tin học tập thực tế
          (XP hôm nay, số thẻ đã học, trình độ hiện tại, điều kiện thi kết thúc level) và giải đáp tức thì cho học viên
          mà không làm gián đoạn bài học.
        </p>
      </div>

      {/* Filter Bar */}
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
              placeholder="Tìm theo học viên, lỗi..."
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Fallback Checkbox Button */}
          <button
            type="button"
            onClick={() => {
              setIsFallbackOnly(!isFallbackOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFallbackOnly
                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-sm'
                : 'bg-geist-gray-100 text-geist-gray-700 border-geist-gray-300 hover:bg-geist-gray-200'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isFallbackOnly ? 'text-purple-700' : 'text-geist-gray-500'}`} />
            Chỉ hiện phiên Smart Fallback
          </button>

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

          {(search || isFallbackOnly || startDate || endDate) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Xóa lọc
            </Button>
          )}
        </div>

        <div className="text-xs text-geist-gray-600 whitespace-nowrap">
          Tìm thấy: <span className="font-bold text-geist-gray-1000">{totalElements}</span> phiên chat
        </div>
      </div>

      {/* Table */}
      <div className="bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-sm text-geist-gray-600">Đang tải nhật ký AI Tutor...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-sm font-semibold text-geist-gray-800">Không tìm thấy nhật ký hội thoại nào</p>
            <p className="text-xs text-geist-gray-500">Thử tắt lọc Smart Fallback hoặc xóa từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-geist-gray-300 bg-geist-gray-50 text-xs font-semibold text-geist-gray-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã phiên / Học viên</th>
                  <th className="py-3 px-4">Kênh</th>
                  <th className="py-3 px-4">Trạng thái Fallback</th>
                  <th className="py-3 px-4">Chi tiết lỗi / Lý do kích hoạt</th>
                  <th className="py-3 px-4 text-center">Số tin nhắn</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geist-gray-200">
                {logs.map((session) => (
                  <tr key={session.id} className="hover:bg-geist-gray-50/70 transition-colors">
                    {/* Learner */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-geist-gray-900">
                        {session.userFullName || 'Khách vãng lai'}
                      </div>
                      <div className="text-xs text-geist-gray-500 font-mono">
                        #{session.id} • @{session.username}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[var(--brand-600)] border border-orange-200">
                        <Sparkles className="w-3 h-3 text-[var(--brand-500)]" /> AI_TUTOR
                      </span>
                    </td>

                    {/* Fallback Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {session.isFallbackTriggered ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                          SMART FALLBACK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Gemini API OK
                        </span>
                      )}
                    </td>

                    {/* Error / Fallback Details */}
                    <td className="py-3.5 px-4 max-w-sm">
                      {session.isFallbackTriggered ? (
                        <div>
                          <div className="text-xs font-medium text-purple-900 line-clamp-1" title={session.fallbackReason}>
                            {session.fallbackReason || 'Kích hoạt dữ liệu dự phòng ngữ cảnh'}
                          </div>
                          {session.errorMessage && (
                            <div className="text-[11px] text-red-600 font-mono mt-0.5 line-clamp-1 truncate" title={session.errorMessage}>
                              {session.errorMessage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-geist-gray-500 italic">Luồng streaming bình thường</span>
                      )}
                    </td>

                    {/* Message count */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-geist-gray-800">{session.messageCount}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-geist-gray-600">
                      {new Date(session.createdAt).toLocaleString('vi-VN', {
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
                        onClick={() => handleOpenDetail(session.id)}
                        className="hover:text-[var(--brand-500)] text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem hội thoại
                      </Button>
                    </td>
                  </tr>
                ))}
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

      {/* Detail Dialog Modal */}
      <AiTutorDetailModal
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
