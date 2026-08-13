import { Users, CreditCard, Layers, Hash } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api';

const COLORS = ['#9ca3af', '#3b82f6', '#8b5cf6', '#ec4899']; // Geist grays and branding colors

export function AdminDashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/admin/metrics');
        return response.data?.data || null;
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
        return null;
      }
    }
  });

  // Fallback to empty if loading or no data
  const userActivityData = metrics?.userActivity || [];
  const subscriptionData = metrics?.subscriptionDistribution || [];

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-geist-gray-1000">
          Bảng điều khiển
        </h1>
        <p className="text-geist-gray-700 mt-2 text-sm">
          Tổng quan hệ thống và các chỉ số chính
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="flex flex-col p-5 border border-geist-gray-400 rounded-lg bg-geist-bg-100 shadow-sm">
          <div className="flex items-center gap-2 text-geist-gray-700 mb-3">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Tổng số người dùng</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-geist-gray-1000">
            {isLoading ? '...' : (metrics?.totalUsers || 0)}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex flex-col p-5 border border-geist-gray-400 rounded-lg bg-geist-bg-100 shadow-sm">
          <div className="flex items-center gap-2 text-geist-gray-700 mb-3">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium">Doanh thu tháng</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-geist-gray-1000">
            {isLoading ? '...' : (metrics?.monthlyRevenue ? (metrics.monthlyRevenue / 1000000).toFixed(1) + 'M' : '0')} <span className="text-xl text-geist-gray-700 font-normal">VND</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex flex-col p-5 border border-geist-gray-400 rounded-lg bg-geist-bg-100 shadow-sm">
          <div className="flex items-center gap-2 text-geist-gray-700 mb-3">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Bộ thẻ hệ thống</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-geist-gray-1000">
            {isLoading ? '...' : (metrics?.systemDecks || 0)}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex flex-col p-5 border border-geist-gray-400 rounded-lg bg-geist-bg-100 shadow-sm">
          <div className="flex items-center gap-2 text-geist-gray-700 mb-3">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">Số lượng thẻ ghi nhớ</span>
          </div>
          <div className="text-3xl font-semibold tracking-tight text-geist-gray-1000">
            {isLoading ? '...' : (metrics?.totalFlashcards || 0)}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Activity Chart */}
        <div className="flex flex-col border border-geist-gray-400 rounded-lg bg-geist-bg-100 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-base font-semibold text-geist-gray-1000 mb-6">Hoạt động người dùng (7 ngày qua)</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#111827', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution Chart */}
        <div className="flex flex-col border border-geist-gray-400 rounded-lg bg-geist-bg-100 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-base font-semibold text-geist-gray-1000 mb-6">Phân bố gói cước</h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {subscriptionData.map((_entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#111827', fontWeight: 500 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
