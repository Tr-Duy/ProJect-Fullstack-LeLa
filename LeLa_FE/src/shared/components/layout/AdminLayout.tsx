import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { LogOut, LayoutDashboard, Tags, Languages, Book, HelpCircle, Moon, Sun, Monitor, Users, CreditCard, Bell, Crown, FolderTree, Trophy, MessageSquare } from 'lucide-react';
import type { UserRole } from '../../types/lela';

export function AdminLayout() {
  const { user, logout, hasRole } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  if (!hasRole(['ADMIN', 'CONTENT_CREATOR', 'MODERATOR'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  type NavItem = { name: string; path: string; icon: any; roles: UserRole[] };
  const navItems: NavItem[] = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Gửi thông báo', path: '/admin/notifications', icon: Bell, roles: ['ADMIN'] },
    { name: 'Người dùng', path: '/admin/users', icon: Users, roles: ['ADMIN', 'MODERATOR'] },
    { name: 'Giao dịch', path: '/admin/transactions', icon: CreditCard, roles: ['ADMIN'] },
    { name: 'Gói đăng ký', path: '/admin/subscription-plans', icon: Crown, roles: ['ADMIN'] },
    { name: 'Thẻ (Tags)', path: '/admin/tags', icon: Tags, roles: ['ADMIN'] },
    { name: 'Ngôn ngữ', path: '/admin/languages', icon: Languages, roles: ['ADMIN'] },
    { name: 'Chủ đề', path: '/admin/topics', icon: FolderTree, roles: ['ADMIN'] },
    { name: 'Thành tựu', path: '/admin/achievements', icon: Trophy, roles: ['ADMIN'] },
    { name: 'Bộ thẻ (Decks)', path: '/admin/decks', icon: Book, roles: ['ADMIN', 'CONTENT_CREATOR', 'MODERATOR'] },
    { name: 'Bài kiểm tra', path: '/admin/quizzes', icon: HelpCircle, roles: ['ADMIN', 'CONTENT_CREATOR'] },
    { name: 'Chat Hỗ trợ', path: '/admin/chat', icon: MessageSquare, roles: ['ADMIN'] },
  ];

  return (
    <div className="flex min-h-screen bg-geist-bg-100 text-geist-gray-1000 font-sans selection:bg-geist-blue-200">
      {/* Sidebar */}
      <aside className="w-64 sticky top-0 h-screen shrink-0 border-r border-geist-gray-300 overflow-y-auto hidden md:flex md:flex-col bg-geist-bg-100">
        {/* Top Section: Logo + Nav */}
        <div className="flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-geist-gray-300">
            <Link to="/admin/dashboard" className="text-xl font-bold tracking-tight !text-geist-gray-1000">
              LeLa<span className="!text-geist-gray-600">Admin</span>
            </Link>
          </div>
          
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              // Ensure user has at least one of the required roles
              const canAccess = hasRole(item.roles);
              if (!canAccess) return null;

              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-geist-gray-200 !text-geist-gray-1000'
                      : '!text-geist-gray-700 hover:bg-geist-gray-100 hover:!text-geist-gray-1000'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Theme & User */}
        <div className="mt-auto border-t border-geist-gray-300 p-4 flex flex-col gap-4 bg-geist-bg-100">
          <div className="flex items-center justify-between rounded-full border border-geist-gray-400 bg-geist-bg-200 p-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex justify-center rounded-full p-1.5 transition-colors ${theme === 'light' ? 'bg-geist-bg-100 shadow-sm text-geist-gray-1000' : 'text-geist-gray-700 hover:text-geist-gray-1000'}`}
              title="Giao diện sáng"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex justify-center rounded-full p-1.5 transition-colors ${theme === 'system' ? 'bg-geist-bg-100 shadow-sm text-geist-gray-1000' : 'text-geist-gray-700 hover:text-geist-gray-1000'}`}
              title="Giao diện hệ thống"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex justify-center rounded-full p-1.5 transition-colors ${theme === 'dark' ? 'bg-geist-bg-100 shadow-sm text-geist-gray-1000' : 'text-geist-gray-700 hover:text-geist-gray-1000'}`}
              title="Giao diện tối"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none truncate max-w-[140px]">{user?.fullName || user?.username}</span>
              <span className="text-xs text-geist-gray-700 mt-1 truncate max-w-[140px]">
                {Array.isArray(user?.roles) ? user?.roles.join(', ') : (user as any)?.role || ''}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-2 text-geist-gray-700 hover:bg-geist-gray-200 hover:text-geist-gray-1000 transition-colors shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 py-8 px-6 lg:px-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
