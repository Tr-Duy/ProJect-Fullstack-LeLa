import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Lock, Unlock, Shield } from 'lucide-react';
import { message, Modal as AntdModal, Tabs, Checkbox, Spin } from 'antd';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import { apiClient } from '../../../shared/lib/api';
import { useAuth } from '../../../shared/providers/AuthProvider';

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  xpTotal: number;
  streakCurrent: number;
  createdAt: string;
  roles?: string[];
  currentLevel?: {
    id: number;
    name: string;
  };
};

export type RoleResponse = {
  id: number;
  roleCode: string;
  roleName: string;
  description: string;
};

const STATUS_MAP: Record<string, { label: string; colorClass: string }> = {
  ACTIVE: { label: 'Hoạt động', colorClass: 'bg-geist-success-100 text-geist-success-800' },
  PENDING: { label: 'Chờ xác thực', colorClass: 'bg-geist-warning-100 text-geist-warning-900' },
  SUSPENDED: { label: 'Tạm khóa', colorClass: 'bg-geist-error-100 text-geist-error-800' },
  DEACTIVATED: { label: 'Vô hiệu hóa', colorClass: 'bg-geist-gray-200 text-geist-gray-700' },
};

export function UsersAdminPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  const { hasRole, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // API query users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, activeTab],
    queryFn: async () => {
      try {
        const params: any = { search };
        if (activeTab === 'ADMIN') params.role = 'ADMIN';
        if (activeTab === 'LEARNER') params.role = 'LEARNER';
        
        const response = await apiClient.get('/users', { params });
        return response.data?.data?.content || [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    }
  });

  // API query all roles
  const { data: allRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/roles');
        return (response.data?.data || []) as RoleResponse[];
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        return [];
      }
    },
    enabled: isRoleModalOpen
  });

  // Assign Role Mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      return apiClient.post('/user-roles', { userId, roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      message.success('Đã cấp quyền thành công');
    },
    onError: () => message.error('Không thể cấp quyền')
  });

  // Unassign Role Mutation
  const unassignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      return apiClient.delete(`/user-roles/user/${userId}/role/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      message.success('Đã thu hồi quyền thành công');
    },
    onError: () => message.error('Không thể thu hồi quyền')
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'ACTIVE' | 'SUSPENDED' }) => {
      return apiClient.patch(`/users/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      message.success('Cập nhật trạng thái thành công');
    },
    onError: () => message.error('Không thể cập nhật trạng thái')
  });

  const toggleStatus = (user: UserResponse) => {
    if (user.id == (currentUser?.id as any)) {
      message.error("Bạn không thể khóa chính mình");
      return;
    }
    const isActive = user.status === 'ACTIVE';
    const action = isActive ? 'Khóa' : 'Mở khóa';
    const nextStatus = isActive ? 'SUSPENDED' : 'ACTIVE';
    
    AntdModal.confirm({
      title: `Xác nhận ${action.toLowerCase()}`,
      content: `Bạn có chắc chắn muốn ${action.toLowerCase()} tài khoản ${user.email}?`,
      okText: action,
      cancelText: 'Hủy',
      okButtonProps: { danger: isActive },
      onOk: () => {
        toggleStatusMutation.mutate({ id: user.id, status: nextStatus });
      },
    });
  };

  const handleRoleToggle = (role: RoleResponse, checked: boolean) => {
    if (!selectedUser) return;
    if (checked) {
      assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
    } else {
      unassignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
    }
    
    // Optimistic update of local selected user state
    setSelectedUser(prev => {
      if (!prev) return prev;
      const currentRoles = prev.roles || [];
      const newRoles = checked 
        ? [...currentRoles, role.roleCode]
        : currentRoles.filter(r => r !== role.roleCode);
      return { ...prev, roles: newRoles };
    });
  };

  const items = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'LEARNER', label: 'Người học' },
    { key: 'ADMIN', label: 'Quản trị viên' },
  ];

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">Người dùng</h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={items}
          className="mb-0"
        />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-geist-gray-500" />
          <Input 
            placeholder="Tìm kiếm email, tên..." 
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
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trình độ</th>
                <th className="px-4 py-3">XP / Streak</th>
                <th className="px-4 py-3">Ngày tham gia</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geist-gray-300">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-geist-gray-600"><Spin /> Đang tải...</td></tr>
              ) : users?.map((user: UserResponse) => {
                const isActive = user.status === 'ACTIVE';
                const statusInfo = STATUS_MAP[user.status] || { label: user.status, colorClass: 'bg-geist-gray-200 text-geist-gray-700' };
                const userRoles = user.roles || [];

                return (
                <tr key={user.id} className="hover:bg-geist-gray-100/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-geist-gray-900">{user.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-geist-gray-1000">{user.fullName || user.username}</div>
                    <div className="text-geist-gray-700">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.map(role => (
                        <span key={role} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${role === 'ADMIN' ? 'bg-geist-blue-100 text-geist-blue-800' : 'bg-geist-gray-200 text-geist-gray-800'}`}>
                          {role}
                        </span>
                      ))}
                      {userRoles.length === 0 && <span className="text-geist-gray-500 text-xs">Chưa có</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-geist-gray-900">
                    {userRoles.includes('LEARNER')
                      ? (user.currentLevel?.name ?? 'Chưa xác định')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-geist-gray-900">
                    <span className="font-mono">{user.xpTotal ?? 0}</span> XP / <span className="font-mono">{user.streakCurrent ?? 0}</span> ngày
                  </td>
                  <td className="px-4 py-3 text-geist-gray-700">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${statusInfo.colorClass}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-geist-blue-700 hover:text-geist-blue-900 hover:bg-geist-blue-100"
                        title="Phân quyền"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsRoleModalOpen(true);
                        }}
                        disabled={!hasRole(['ADMIN'])}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={isActive ? "text-geist-red-800 hover:text-geist-red-900 hover:bg-geist-red-100" : "text-geist-success-800 hover:text-geist-success-900 hover:bg-geist-success-100"}
                        title={isActive ? "Khóa tài khoản" : "Mở khóa"}
                        onClick={() => toggleStatus(user)}
                        disabled={!hasRole(['ADMIN']) || user.id == (currentUser?.id as any)}
                      >
                        {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!isLoading && (!users || users.length === 0) && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-geist-gray-600">Không tìm thấy người dùng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={`Phân quyền cho ${selectedUser?.fullName || selectedUser?.email}`}
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedUser(null);
        }}
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-geist-gray-700">
            Chọn các vai trò hệ thống mà bạn muốn gán cho tài khoản này.
          </p>
          
          {isLoadingRoles ? (
            <div className="py-8 text-center text-geist-gray-500"><Spin /> Đang tải danh sách...</div>
          ) : (
            <div className="space-y-3 bg-geist-bg-50 p-4 rounded-md border border-geist-gray-300">
              {allRoles?.map(role => {
                const isChecked = selectedUser?.roles?.includes(role.roleCode) || false;
                const isProcessing = assignRoleMutation.isPending || unassignRoleMutation.isPending;
                
                return (
                  <div key={role.id} className="flex items-start gap-3">
                    <Checkbox 
                      checked={isChecked}
                      disabled={isProcessing || (role.roleCode === 'ADMIN' && selectedUser?.id == (currentUser?.id as any))}
                      onChange={(e) => handleRoleToggle(role, e.target.checked)}
                    />
                    <div>
                      <div className="font-medium text-geist-gray-1000 text-sm flex items-center gap-2">
                        {role.roleName} 
                        <span className="text-[10px] font-mono bg-geist-gray-200 px-1.5 py-0.5 rounded text-geist-gray-700">{role.roleCode}</span>
                      </div>
                      <div className="text-xs text-geist-gray-600 mt-0.5">{role.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          
        </div>
      </Modal>
    </div>
  );
}
