import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAiApi } from '../../api/adminAiApi';
import { ManualAdjustQuotaModal } from './ManualAdjustQuotaModal';
import { Button } from '../../../../shared/components/ui/Button';
import { Input } from '../../../../shared/components/ui/Input';
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { message, Pagination } from 'antd';
import type { AdminQuotaLedgerEntry, AdminAdjustQuotaRequest } from '../../types/adminAi';

export const QuotaLedgerTab: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<number | undefined>(undefined);

  // Fetch quota ledger records
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-quota-ledger', search, entryTypeFilter, startDate, endDate, currentPage, pageSize],
    queryFn: () =>
      adminAiApi.getQuotaLedger({
        search: search.trim() || undefined,
        entryType: entryTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage - 1,
        size: pageSize,
      }),
  });

  // Fetch users list for adjust modal
  const { data: userSummaries = [] } = useQuery({
    queryKey: ['admin-user-quota-summaries'],
    queryFn: () => adminAiApi.getUserQuotaSummaries(),
  });

  // Adjust quota mutation
  const adjustMutation = useMutation({
    mutationFn: (data: AdminAdjustQuotaRequest) => adminAiApi.adjustQuota(data),
    onSuccess: (res) => {
      message.success(`Đã ghi bút toán điều chỉnh ${res.minutesUsed > 0 ? '+' : ''}${res.minutesUsed} phút thành công!`);
      queryClient.invalidateQueries({ queryKey: ['admin-quota-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-quota-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ai-overview'] });
      setIsAdjustModalOpen(false);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi điều chỉnh hạn mức');
    },
  });

  const ledgerEntries: AdminQuotaLedgerEntry[] = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  const handleOpenAdjust = (userId?: number) => {
    setSelectedUserForAdjust(userId);
    setIsAdjustModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setEntryTypeFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Quick User Overview */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-orange-50/40 rounded-xl border border-orange-200/60">
        <div>
          <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-[var(--brand-500)]" /> Sổ cái Biến động Hạn mức (Usage Ledger)
          </h3>
          <p className="text-xs text-geist-gray-600 mt-0.5">
            Theo dõi chi tiết từng phút học AI Voice thực tế và các bút toán can thiệp bù/trừ của Quản trị viên
          </p>
        </div>

        <Button
          onClick={() => handleOpenAdjust()}
          className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white shadow-sm flex items-center gap-1.5 text-xs sm:text-sm font-semibold shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Điều chỉnh Hạn mức (Manual Adjust)
        </Button>
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
              placeholder="Tìm theo học viên, lý do..."
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* Entry Type */}
          <div className="w-full sm:w-44">
            <select
              value={entryTypeFilter}
              onChange={(e) => {
                setEntryTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            >
              <option value="">Tất cả loại bút toán</option>
              <option value="SESSION">Phiên học AI (SESSION)</option>
              <option value="ADJUST">Admin điều chỉnh (ADJUST)</option>
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

          {(search || entryTypeFilter || startDate || endDate) && (
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
          Tổng cộng: <span className="font-bold text-geist-gray-1000">{totalElements}</span> bản ghi sổ cái
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-geist-bg-100 rounded-xl border border-geist-gray-300 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-sm text-geist-gray-600">Đang tải dữ liệu sổ ghi hạn mức...</p>
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-sm font-semibold text-geist-gray-800">Chưa có bản ghi sổ cái nào</p>
            <p className="text-xs text-geist-gray-500">Bấm nút "Điều chỉnh Hạn mức" để thực hiện bút toán can thiệp đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-geist-gray-300 bg-geist-gray-50 text-xs font-semibold text-geist-gray-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Học viên</th>
                  <th className="py-3 px-4">Loại biến động</th>
                  <th className="py-3 px-4 text-center">Số phút (+/-)</th>
                  <th className="py-3 px-4">Phiên liên kết / Lý do</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geist-gray-200">
                {ledgerEntries.map((entry) => {
                  const isAdjust = entry.entryType === 'ADJUST';
                  const isPositive = entry.minutesUsed >= 0;

                  return (
                    <tr key={entry.id} className="hover:bg-geist-gray-50/70 transition-colors">
                      {/* Created Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-geist-gray-600">
                        {new Date(entry.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Learner */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-geist-gray-900">{entry.userFullName}</div>
                        <div className="text-xs text-geist-gray-500">@{entry.username}</div>
                      </td>

                      {/* Entry Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isAdjust
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-purple-50 text-purple-800 border-purple-300'
                          }`}
                        >
                          {isAdjust ? 'ADMIN ADJUST' : 'SESSION USAGE'}
                        </span>
                      </td>

                      {/* Minutes used */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center font-bold text-sm ${
                            isAdjust
                              ? isPositive
                                ? 'text-emerald-600'
                                : 'text-red-600'
                              : 'text-geist-gray-900'
                          }`}
                        >
                          {isAdjust && isPositive && '+'}
                          {entry.minutesUsed} phút
                        </span>
                      </td>

                      {/* Reason / Session link */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="text-xs text-geist-gray-900 font-medium">
                          {entry.reason || 'Tiêu hao trong phiên đàm thoại AI'}
                        </div>
                        {entry.sessionPublicId && (
                          <div className="text-[11px] text-geist-gray-500 font-mono mt-0.5 truncate">
                            Mã phiên: #{entry.sessionPublicId.slice(0, 8)} • {entry.scenarioTitle}
                          </div>
                        )}
                      </td>

                      {/* Admin actor */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-geist-gray-700">
                        <span className="font-medium text-geist-gray-900">
                          {entry.adminActorName || 'Hệ thống'}
                        </span>
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

      {/* Manual Adjust Modal */}
      <ManualAdjustQuotaModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={async (data) => {
          await adjustMutation.mutateAsync(data);
        }}
        users={userSummaries}
        isSubmitting={adjustMutation.isPending}
        preselectedUserId={selectedUserForAdjust}
      />
    </div>
  );
};
