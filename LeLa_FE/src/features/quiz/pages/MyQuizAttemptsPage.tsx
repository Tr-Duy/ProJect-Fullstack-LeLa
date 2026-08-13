import { Button, Skeleton, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizAttemptsApi } from '../api/quiz-attempts.api';

export function MyQuizAttemptsPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['my-quiz-attempts'],
    queryFn: () => quizAttemptsApi.getMyAttempts({ size: 50 }),
  });

  const columns = [
    {
      title: 'Tên bài kiểm tra',
      dataIndex: 'quizTitle',
      render: (_: any, record: any) => <span className="font-bold">{record.quizTitle || `Quiz #${record.quizId}`}</span>
    },
    {
      title: 'Ngày làm',
      dataIndex: 'startedAt',
      render: (value: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Điểm số',
      dataIndex: 'scorePercent',
      render: (value: number, record: any) => {
            if (record.quizCategory === 'FINAL' || record.quizCategory === 'PLACEMENT') {
              if (record.maxScore != null) {
               return <strong className="text-lg text-[#2A8B9D]">{record.estimatedToeicScore != null ? record.estimatedToeicScore : 0} / {record.maxScore} TOEIC</strong>;
              }
              return <strong className="text-lg text-[#2A8B9D]">{record.estimatedToeicScore != null ? record.estimatedToeicScore : 0} TOEIC</strong>;
            }
          if (record.quizCategory === 'LEVEL_UP') {
            const toInt = (v: any) => {
             if (v === undefined || v === null) return 0;
             const n = typeof v === 'string' ? Number(v) : v;
             if (Number.isNaN(n)) return 0;
             return Math.round(Number(n));
            };
            const est = toInt(record.estimatedToeicScore);
            const max = toInt(record.maxScore);
            return <strong className="text-lg text-[#2A8B9D]">{`${est} / ${max}`}</strong>;
          }
          return <strong className="text-lg">{value != null ? Number(value).toFixed(0) : 0} / 100</strong>;
      }
    },
    {
      title: 'Kết quả',
      render: (_: any, record: any) => {
        if (record.quizCategory === 'PLACEMENT' || record.quizCategory === 'FINAL') {
           if (record.levelAtAttempt) {
              return <span className="font-bold">{record.levelAtAttempt.name}</span>;
           }
           return <span className="font-bold text-gray-500">-</span>;
        }

        const isPassed = record.passed === true;
        return (
          <Tag color={isPassed ? '#2A8B9D' : '#F05A4A'} className="brutal-border font-bold px-3 py-1 text-sm">
            {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
          </Tag>
        );
      }
    },
    {
      title: 'Hành động',
      render: (_: any, record: any) => (
        <Button
          className="brutal-border font-bold hover:!bg-[#1D2A3A] hover:!text-white transition-colors"
          onClick={() => navigate(`/quiz-attempts/${record.publicId}/result`, {
            state: {
              quizId: record.quizId,
            },
          })}
        >
          Xem kết quả
        </Button>
      )
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-[#F4F3EE]">
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1D2A3A]">Lịch Sử Thi / Kiểm Tra</h1>
          <p className="text-gray-600 font-medium text-lg mt-1">Theo dõi các bài kiểm tra bạn đã hoàn thành.</p>
        </div>
        <Button onClick={() => navigate('/decks')} className="brutal-border font-bold h-12 px-6 shadow-sm">
          VỀ TRANG CHỦ
        </Button>
      </div>

      <div className="brutal-card bg-white p-6 shadow-md border-4 border-black">
        {isLoading ? (
          <Skeleton active />
        ) : (
          <Table
            dataSource={data?.data?.content || []}
            columns={columns}
            rowKey="publicId"
            pagination={false}
            className="brutal-table"
            locale={{ emptyText: <div className="py-10 font-bold text-lg text-gray-500">Chưa có bài kiểm tra nào.</div> }}
          />
        )}
      </div>
    </div>
  );
}
