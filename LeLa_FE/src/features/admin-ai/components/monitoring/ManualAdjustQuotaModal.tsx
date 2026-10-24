import React, { useState } from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import { Input } from '../../../../shared/components/ui/Input';
import { AlertCircle } from 'lucide-react';
import type { AdminAdjustQuotaRequest, AdminUserQuotaSummary } from '../../types/adminAi';

interface ManualAdjustQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdminAdjustQuotaRequest) => Promise<void>;
  users: AdminUserQuotaSummary[];
  isSubmitting: boolean;
  preselectedUserId?: number;
}

const QUICK_MINUTES = [10, 15, 30, 60, -10, -15, -30];

export const ManualAdjustQuotaModal: React.FC<ManualAdjustQuotaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
  isSubmitting,
  preselectedUserId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(preselectedUserId);
  const [minutes, setMinutes] = useState<number>(15);
  const [reason, setReason] = useState<string>('');

  React.useEffect(() => {
    if (preselectedUserId) {
      setSelectedUserId(preselectedUserId);
    } else if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].userId);
    }
  }, [preselectedUserId, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || minutes === 0 || !reason.trim()) return;

    await onSubmit({
      userId: selectedUserId,
      minutes: Number(minutes),
      reason: reason.trim(),
    });

    setReason('');
    setMinutes(15);
  };

  const selectedUser = users.find((u) => u.userId === selectedUserId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Điều chỉnh Hạn mức Phút Học AI (Manual Adjust)"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Hành động này sẽ ghi một bút toán mới vào <b>SỔ GHI HẠN MỨC (SO_GHI_HAN_MUC)</b> với loại{' '}
            <code>ADJUST</code> và lưu vết danh tính Quản trị viên thực hiện để phục vụ kiểm toán tài khoản.
          </span>
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
            Chọn học viên cần can thiệp <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            required
          >
            <option value="">-- Chọn học viên --</option>
            {users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.fullName} (@{u.username}) - Dùng: {u.totalSessionMinutes}p / Còn: {u.remainingSessionsToday} lượt hôm nay
              </option>
            ))}
          </select>

          {selectedUser && (
            <div className="mt-2 p-2.5 bg-geist-gray-50 rounded-lg text-xs text-geist-gray-700 flex justify-between">
              <span>Đã học thực tế: <b>{selectedUser.totalSessionMinutes} phút</b></span>
              <span>Tổng điều chỉnh: <b>{selectedUser.totalAdjustedMinutes >= 0 ? `+${selectedUser.totalAdjustedMinutes}` : selectedUser.totalAdjustedMinutes} phút</b></span>
              <span>Level: <b>{selectedUser.currentLevel}</b></span>
            </div>
          )}
        </div>

        {/* Minutes Input & Quick Pills */}
        <div>
          <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
            Số phút điều chỉnh (+ cộng thêm / - trừ bớt) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              placeholder="VD: 15, 30 hoặc -15..."
              className="font-bold text-base"
              required
            />
            <span className="text-sm font-semibold text-geist-gray-600">phút</span>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  m > 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                }`}
              >
                {m > 0 ? `+${m} phút` : `${m} phút`}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Textarea */}
        <div>
          <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
            Lý do can thiệp điều chỉnh <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            placeholder="VD: Đền bù gián đoạn hệ thống ngày 24/10, Thưởng sự kiện hoàn thành streak 30 ngày..."
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-geist-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedUserId || minutes === 0 || !reason.trim()}
            className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white"
          >
            {isSubmitting ? 'Đang lưu bút toán...' : 'Lưu bút toán điều chỉnh'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
