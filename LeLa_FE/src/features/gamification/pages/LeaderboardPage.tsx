import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { leaderboardsApi } from '../api/leaderboards.api';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'top'>('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => {
      switch (period) {
        case 'daily': return leaderboardsApi.getDaily({ size: 100 });
        case 'weekly': return leaderboardsApi.getWeekly({ size: 100 });
        case 'monthly': return leaderboardsApi.getMonthly({ size: 100 });
        default: return leaderboardsApi.getTop({ size: 100 });
      }
    },
  });

  const leaderboardData = data?.data?.content || [];
  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  const podiumOrder = [
    { rank: 2, data: top3[1], color: '#C0C0C0', height: 'h-24 md:h-32' },
    { rank: 1, data: top3[0], color: '#FFD700', height: 'h-32 md:h-48' },
    { rank: 3, data: top3[2], color: '#CD7F32', height: 'h-16 md:h-24' }
  ];

  const columns = [
    { 
      title: 'Hạng', 
      key: 'rank', 
      render: (_: any, __: any, index: number) => {
        return (
          <div 
            className="w-10 h-10 flex items-center justify-center brutal-border brutal-shadow-sm font-black text-lg bg-[#F4F3EE]"
          >
            {index + 4}
          </div>
        );
      },
      width: 80
    },
    { 
      title: 'Người dùng', 
      key: 'userId', 
      render: (record: any) => {
        const displayName = record.fullName || record.username || `User #${record.userId}`;
        const avatar = record.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${record.userId}`;
        
        return (
          <div className="flex items-center gap-3">
            <img 
              src={avatar} 
              alt="avatar" 
              className="w-10 h-10 rounded-full brutal-border bg-white object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/notionists/svg?seed=${record.userId}`; }}
            />
            <span className="font-bold">{displayName}</span>
          </div>
        );
      } 
    },
    { title: 'Điểm kinh nghiệm (XP)', dataIndex: 'xpScore', render: (val: number) => <span className="text-[#F05A4A] font-black">{val} XP</span> },
  ];

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1D2A3A]">Bảng xếp hạng</h1>
            <p className="text-gray-600 font-medium mt-1">Đua top cùng những người học khác!</p>
          </div>
          <Button onClick={() => navigate('/my-decks')} className="brutal-border font-bold">&larr; Về trang chủ</Button>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <Button 
            className={`brutal-border font-bold shrink-0 ${period === 'daily' ? '!bg-[#1D2A3A] !text-white' : 'bg-white'}`}
            onClick={() => setPeriod('daily')}
          >
            Hôm nay
          </Button>
          <Button 
            className={`brutal-border font-bold shrink-0 ${period === 'weekly' ? '!bg-[#1D2A3A] !text-white' : 'bg-white'}`}
            onClick={() => setPeriod('weekly')}
          >
            Tuần này
          </Button>
          <Button 
            className={`brutal-border font-bold shrink-0 ${period === 'monthly' ? '!bg-[#1D2A3A] !text-white' : 'bg-white'}`}
            onClick={() => setPeriod('monthly')}
          >
            Tháng này
          </Button>
          <Button 
            className={`brutal-border font-bold shrink-0 ${period === 'top' ? '!bg-[#1D2A3A] !text-white' : 'bg-white'}`}
            onClick={() => setPeriod('top')}
          >
            Mọi thời đại
          </Button>
        </div>

        {isLoading ? (
          <div className="brutal-card bg-white p-6">
            <Skeleton active />
          </div>
        ) : (
          <>
            {/* Podium Section */}
            {top3.length > 0 && (
              <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 mt-8 pt-10">
                {podiumOrder.map((pos) => {
                  if (!pos.data) {
                    return (
                      <div key={pos.rank} className="flex flex-col items-center justify-end w-24 md:w-32 opacity-60">
                        <div className="mb-3 relative group">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full brutal-border bg-gray-200 border-dashed relative z-10 flex items-center justify-center text-gray-400 font-bold text-2xl">
                            ?
                          </div>
                          <div 
                            className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full brutal-border flex items-center justify-center font-bold text-xs md:text-sm z-20 bg-gray-300 text-gray-600" 
                          >
                            {pos.rank}
                          </div>
                        </div>
                        <div className="font-bold text-center mb-1 text-xs md:text-sm truncate w-full px-1 text-gray-400">
                          Chưa có
                        </div>
                        <div className="text-gray-400 font-black text-xs md:text-sm mb-2">
                          0 XP
                        </div>
                        <div 
                          className={`w-full ${pos.height} brutal-border flex items-center justify-center font-black text-2xl md:text-4xl bg-gray-200 text-gray-400`} 
                        >
                          {pos.rank}
                        </div>
                      </div>
                    );
                  }
                  
                  const displayName = pos.data.fullName || pos.data.username || `User #${pos.data.userId}`;
                  const avatar = pos.data.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${pos.data.userId}`;

                  return (
                    <div key={pos.rank} className="flex flex-col items-center justify-end w-24 md:w-32">
                      <div className="mb-3 relative group">
                        <div className="absolute -inset-1 bg-black rounded-full blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <img 
                          src={avatar} 
                          alt="avatar" 
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full brutal-border brutal-shadow-sm bg-white relative z-10 object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/notionists/svg?seed=${pos.data.userId}`; }}
                        />
                        <div 
                          className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full brutal-border flex items-center justify-center font-bold text-xs md:text-sm z-20 brutal-shadow-sm" 
                          style={{ backgroundColor: pos.color }}
                        >
                          {pos.rank}
                        </div>
                      </div>
                      <div className="font-bold text-center mb-1 text-xs md:text-sm truncate w-full px-1 text-[#1D2A3A]" title={displayName}>
                        {displayName}
                      </div>
                      <div className="text-[#F05A4A] font-black text-xs md:text-sm mb-2">
                        {pos.data.xpScore} XP
                      </div>
                      <div 
                        className={`w-full ${pos.height} brutal-border brutal-shadow-sm flex items-center justify-center font-black text-2xl md:text-4xl transition-all hover:-translate-y-1`} 
                        style={{ backgroundColor: pos.color }}
                      >
                        {pos.rank}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="brutal-card bg-white p-4">
                <Table 
                  dataSource={rest} 
                  columns={columns} 
                  rowKey={(record) => record.id || record.userId} 
                  pagination={false}
                  className="brutal-table"
                />
              </div>
            )}
            
            {leaderboardData.length === 0 && (
              <div className="brutal-card bg-white p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold mb-2">Chưa có ai trên bảng xếp hạng</h3>
                <p className="text-gray-500">Hãy học ngay để chiếm vị trí top 1!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
