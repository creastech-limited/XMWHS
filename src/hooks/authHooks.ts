import { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../types/auth.js';

// Define role-based routes
const ROLE_ROUTES: Record<string, string> = {
  school: '/schools',
  parent: '/parent',
  student: '/kidswallet',
  security: '/security',
  store: '/store',
  agent: '/agent',
  admin: '/admin',
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hook for role-based access control
export const useRoleAccess = (allowedRoles: string[]) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      const roleRoute = ROLE_ROUTES[user.role] || '/';
      navigate(roleRoute);
    }
  }, [user, allowedRoles, navigate, location.pathname]);

  return { hasAccess: user ? allowedRoles.includes(user.role) : false };
};