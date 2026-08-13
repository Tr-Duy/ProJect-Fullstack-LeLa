import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/providers/AuthProvider';
import type { UserRole } from '../../shared/types/lela';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, isInitializingAuth } = useAuth();
  const location = useLocation();

  if (isInitializingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F3EE]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-navy"></div>
          <span className="font-bold text-brand-navy">Đang kiểm tra phiên làm việc...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles as string[])) {
    // If Admin/Staff tries to access Learner-only protected routes, redirect to Admin Dashboard
    if (hasRole(['ADMIN', 'CONTENT_CREATOR', 'MODERATOR'])) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // If Learner tries to access Admin-only protected routes, redirect to Learner Dashboard
    if (hasRole(['LEARNER'])) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
