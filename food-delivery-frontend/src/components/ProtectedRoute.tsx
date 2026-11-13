import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole, type Role } from '../types/api';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
}

export function ProtectedRoute({
  children,
  requiredRole = 'ROLE_CUSTOMER',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="empty-state" role="status" aria-live="polite">
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasRole(user.role, requiredRole)) {
    return (
      <section className="empty-state" aria-labelledby="forbidden-heading">
        <h1 id="forbidden-heading">Access Restricted</h1>
        <p>
          Your account role does not have permission to view this page.
        </p>
        <Link to="/restaurants" className="btn btn-primary">
          Back to Restaurants
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
