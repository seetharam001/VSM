import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    const redirectMap = { admin: '/admin', mechanic: '/mechanic', customer: '/customer' };
    return <Navigate to={redirectMap[user?.role] || '/customer'} replace />;
  }

  return children;
}
