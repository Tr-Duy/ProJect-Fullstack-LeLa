import React, { useState } from 'react';
import { Button, Modal, Spin } from 'antd';
import type { DailyActivityDto } from '../../gamification/api/daily-activities.api';

interface ActivityHeatmapSectionProps {
  historyData?: DailyActivityDto[];
  isLoading: boolean;
}

export const ActivityHeatmapSection: React.FC<ActivityHeatmapSectionProps> = ({
  historyData,
  isLoading,
}) => {
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    date: string;
    active: boolean;
    cardsLearned?: number;
    reviewCount?: number;
    quizCount?: number;
    xpEarned?: number;
  } | null>(null);

  const getLocalISODate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 364);
  const emptyDays = startDateObj.getDay();

  const historyMap = new Map<string, DailyActivityDto>();
  if (historyData) {
    historyData.forEach((activity) => {
      historyMap.set(activity.activityDate, activity);
    });
  }

  const heatmapDays = Array.from({ length: 365 }).map((_, index) => {
    const date = new Date(startDateObj);
    date.setDate(date.getDate() + index);
    return getLocalISODate(date);
  });

  const formatDisplayDate = (isoDateStr: string) => {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDateStr;
  };

  const getHeatmapColor = (activity?: DailyActivityDto) => {
    if (!activity?.active) return '#F4F3EE';
    const totalActions = (activity.reviewCount || 0) + (activity.cardsLearned || 0) + (activity.quizCount || 0);
    if (totalActions >= 3) return '#2B1B0E';
    if (totalActions >= 2) return '#2A8B9D';
    return '#70C2D1';
  };

  return (
    <div className="rounded-[var(--radius-card)] shadow-[var(--shadow-md)] bg-white p-6 md:p-8 mb-8 border border-[var(--border)]">
      <h2 className="text-2xl font-black mb-6  border-b-[3px] border-[var(--border)] pb-3 text-[#2B1B0E]">
        LỊCH SỬ HOẠT ĐỘNG
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <div className="overflow-hidden">
          <div
            className="grid gap-1 pb-2 overflow-x-auto"
            style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column' }}
          >
            {Array.from({ length: emptyDays }).map((_, index) => (
              <div key={`empty-${index}`} className="w-4 h-4 pointer-events-none opacity-0" />
            ))}

            {heatmapDays.map((dateStr) => {
              const dayActivity = historyMap.get(dateStr);
              return (
                <div
                  key={dateStr}
                  title={`${dateStr}: ${dayActivity?.active ? 'Có hoạt động học' : 'Không có hoạt động học'}`}
                  className="w-4 h-4 border border-[var(--border)] transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: getHeatmapColor(dayActivity) }}
                  onClick={() => {
                    setSelectedDayDetail({
                      date: dateStr,
                      active: !!dayActivity?.active,
                      cardsLearned: dayActivity?.cardsLearned || 0,
                      reviewCount: dayActivity?.reviewCount || 0,
                      quizCount: dayActivity?.quizCount || 0,
                      xpEarned: dayActivity?.xpEarned || 0,
                    });
                  }}
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 justify-end text-sm font-bold ">
            <span>Ít</span>
            <div className="w-4 h-4 border border-[var(--border)] bg-[#F4F3EE]" />
            <div className="w-4 h-4 border border-[var(--border)] bg-[#70C2D1]" />
            <div className="w-4 h-4 border border-[var(--border)] bg-[#2A8B9D]" />
            <div className="w-4 h-4 border border-[var(--border)] bg-[#2B1B0E]" />
            <span>Nhiều</span>
          </div>
        </div>
      )}

      {/* Activity Day Detail Modal */}
      <Modal
        title={null}
        open={!!selectedDayDetail}
        onCancel={() => setSelectedDayDetail(null)}
        footer={null}
        centered
      >
        {selectedDayDetail && (
          <div className="p-4">
            <h3 className="text-2xl font-black  mb-4 text-[#2B1B0E] border-b-[3px] border-[var(--border)] pb-2">
              Chi tiết hoạt động
            </h3>
            <div className="space-y-3 font-bold text-base text-[#2B1B0E]">
              <div>
                <span className="text-gray-500 mr-2">Ngày:</span>
                <span>{formatDisplayDate(selectedDayDetail.date)}</span>
              </div>
              <div>
                <span className="text-gray-500 mr-2">Trạng thái:</span>
                <span className={selectedDayDetail.active ? 'text-[#2A8B9D]' : 'text-gray-400'}>
                  {selectedDayDetail.active ? 'Có hoạt động' : 'Không hoạt động'}
                </span>
              </div>

              {selectedDayDetail.active && (
                <div className="bg-[#F4F3EE] p-4 border border-[var(--border)] rounded-lg space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thẻ đã học:</span>
                    <span>{selectedDayDetail.cardsLearned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thẻ đã ôn tập:</span>
                    <span>{selectedDayDetail.reviewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bài kiểm tra:</span>
                    <span>{selectedDayDetail.quizCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">XP nhận được:</span>
                    <span>{selectedDayDetail.xpEarned} XP</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-right">
              <Button
                className="brutal-pill border-[var(--border)] font-bold text-white bg-[#2B1B0E] hover:!bg-[#2A8B9D]"
                onClick={() => setSelectedDayDetail(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
