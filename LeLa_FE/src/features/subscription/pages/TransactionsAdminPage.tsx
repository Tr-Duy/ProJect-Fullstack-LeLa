import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Trash2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import type { PaymentResponse } from '../api/payments.api';
import { paymentsApi } from '../api/payments.api';

const STATUS_MAP: Record<string, { label: string; colorClass: string }> = {
  SUCCEEDED: { label: 'Thành công', colorClass: 'bg-geist-success-100 text-geist-success-800' },
  PENDING: { label: 'Đang xử lý', colorClass: 'bg-geist-warning-100 text-geist-warning-900' },
  FAILED: { label: 'Thất bại', colorClass: 'bg-geist-error-100 text-geist-error-800' },
  REFUNDED: { label: 'Hoàn tiền', colorClass: 'bg-geist-blue-100 text-geist-blue-800' },
  CANCELLED: { label: 'Đã hủy', colorClass: 'bg-geist-gray-200 text-geist-gray-700' },
};

export function TransactionsAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<PaymentResponse | null>(null);
  
  // API query - backend returns Page<PaymentResponse>
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['admin-transactions', search],
    queryFn: async () => {
      try {
        const response = await paymentsApi.getAll({ size: 100 });
        if (response.data?.content) return response.data.content;
        return [];
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
      }
    }
  });

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
  };

  const openDetails = (txn: PaymentResponse) => {
    setSelectedTxn(txn);
    setIsModalOpen(true);
  };



  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      alert('Đã xóa giao dịch thành công!');
    },
    onError: () => {
      alert('Có lỗi xảy ra khi xóa giao dịch.');
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Giao dịch</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý thanh toán và các gói cước</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-geist-gray-500" />
          <Input 
            placeholder="Tìm kiếm..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-geist-bg-100 rounded-lg border border-geist-gray-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Người thanh toán</th>
                <th className="px-4 py-3">Nhà cung cấp</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
              ) : transactions?.map((txn: PaymentResponse) => {
                const statusInfo = STATUS_MAP[txn.status] || { label: txn.status, colorClass: 'bg-geist-gray-200 text-geist-gray-700' };
                return (
                <tr key={txn.id} className="hover:bg-geist-gray-100/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-geist-gray-900 font-medium">{txn.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">User {txn.userId}</div>
                    <div className="text-xs text-geist-gray-500 font-mono">ID: {txn.userId}</div>
                  </td>
                  <td className="px-4 py-3 text-geist-gray-1000">{txn.provider || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono text-geist-gray-1000">{formatCurrency(txn.amount, txn.currencyCode)}</td>
                  <td className="px-4 py-3 text-geist-gray-700">
                    {txn.createdAt ? new Date(txn.createdAt).toLocaleString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${statusInfo.colorClass}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">

                      <Button variant="ghost" size="icon" onClick={() => openDetails(txn)} title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(txn.id)} title="Xóa giao dịch" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!isLoading && (!transactions || transactions.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Không tìm thấy giao dịch nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title="Chi tiết giao dịch"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        {selectedTxn && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
              <div className="text-sm text-geist-gray-700">ID giao dịch</div>
              <div className="text-sm font-mono font-medium text-right">{selectedTxn.id}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
              <div className="text-sm text-geist-gray-700">Người thanh toán</div>
              <div className="text-sm text-right">
                <span className="font-semibold">User {selectedTxn.userId}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
              <div className="text-sm text-geist-gray-700">Nhà cung cấp</div>
              <div className="text-sm font-medium text-right">{selectedTxn.provider || '-'}</div>
            </div>
            {selectedTxn.providerTransactionId && (
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
                <div className="text-sm text-geist-gray-700">Mã GD nhà cung cấp</div>
                <div className="text-sm font-mono text-right">{selectedTxn.providerTransactionId}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
              <div className="text-sm text-geist-gray-700">Số tiền</div>
              <div className="text-sm font-mono font-bold text-right text-geist-blue-700">{formatCurrency(selectedTxn.amount, selectedTxn.currencyCode)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
              <div className="text-sm text-geist-gray-700">Trạng thái</div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${STATUS_MAP[selectedTxn.status]?.colorClass || 'bg-geist-gray-200'}`}>
                  {STATUS_MAP[selectedTxn.status]?.label || selectedTxn.status}
                </span>
              </div>
            </div>
            {selectedTxn.failureReason && (
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-geist-gray-300">
                <div className="text-sm text-geist-gray-700">Lý do thất bại</div>
                <div className="text-sm text-right text-geist-error-800">{selectedTxn.failureReason}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-sm text-geist-gray-700">Thời gian tạo</div>
              <div className="text-sm text-right">{selectedTxn.createdAt ? new Date(selectedTxn.createdAt).toLocaleString('vi-VN') : '-'}</div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-geist-gray-300">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
