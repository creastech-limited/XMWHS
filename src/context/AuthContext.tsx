import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../types/user';
import type { AuthContextType, AuthProviderProps } from '../types/auth.js';
import { validateToken } from '../services/api/authService';
import axios from 'axios';
import { isDidAgent } from '../utils/didAgent';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define role-based home routes
const ROLE_ROUTES: Record<string, string> = {
  school: '/schools',
  parent: '/parent',
  student: '/kidswallet',
  security: '/security',
  store: '/store',
  agent: '/agent',
  admin: '/admin',
};

const ROLE_SPECIFIC_ROUTES: Record<string, string[]> = {
  school: [
    '/schools',
    '/students',
    '/stores',
    '/schoolfees',
    '/transactions',
    '/withdrawal',
    '/attendance/security',
    '/attendance/report',
    '/Sdisputes',
    '/settings',
    '/schooltransfer',
  ],
  parent: [
    '/parent',
    '/fundwallet',
    '/payschoolbills',
    '/ptransactionhistory',
    '/Pdispute',
    '/Psettings',
    '/paytoagent',
    '/transfertokids',
  ],
  student: [
    '/kidswallet',
    '/kidpayagent',
    '/kidpaymenthistory',
    '/schoolbills',
    '/ksettings',
    '/kdispute',
  ],
  security: ['/security', '/security/settings'],
  store: [
    '/store',
    '/agents',
    '/stransactions',
    '/Swithdrawal',
    '/Storedispute',
    '/store/settings',
    '/add-did-number',
    '/store/invoices',
    '/store/cdr-import',
    '/store/reports',
  ],
  agent: [
    '/agent',
    '/agent/scanqr',
    '/agent/transfertostore',
    '/agent/transactions',
  ],
  didagent: ['/did-agent'],
  admin: ['/admin', '/admin/disputes'],
};

// A DID agent is its own "role" for routing purposes
const getRoleKey = (u: User): string => {
  if (isDidAgent(u)) return 'didagent';
  if (u.role === 'individual' && u.isParent) return 'parent';
  return u.role;
};

const getHomeRoute = (u: User): string => {
  const key = getRoleKey(u);
  if (key === 'didagent') return '/did-agent/dashboard';
  return ROLE_ROUTES[key] || '/';
};

const isRouteAllowed = (u: User, pathname: string): boolean => {
  const allowedRoutes = ROLE_SPECIFIC_ROUTES[getRoleKey(u)] || [];
  return allowedRoutes.some((route) => pathname.startsWith(route));
};

// Helper function to check if a path is public
const isPublicPath = (pathname: string): boolean => {
  const publicPaths = [
    '/login',
    '/signup',
    '/schoolsignup',
    '/attendance/security/new',
    '/forgot-password',
    '/terms',
    '/privacyAndPolicy',
    '/success',
  ];

  if (publicPaths.includes(pathname)) {
    return true;
  }

  // Reset password route with token parameter
  if (pathname.startsWith('/reset-password/')) {
    return true;
  }

  return false;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    navigate('/login');
  }, [navigate]);

  const login = useCallback(
    (userData: User, jwt: string) => {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', jwt);
      setUser(userData);
      setToken(jwt);
      // Redirect to the right home route after login
      navigate(getHomeRoute(userData));
    },
    [navigate]
  );

  // Check auth status and handle routing
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);

      const currentPath = location.pathname;

      // Public pages: allow access without authentication
      if (isPublicPath(currentPath)) {
        setIsLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      // No token and not on a public page: go to login
      if (!storedToken || !storedUser) {
        setIsLoading(false);
        navigate('/login');
        return;
      }

      const isValidToken = await validateToken(storedToken);

      if (isValidToken) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setToken(storedToken);

          // Is this route allowed for this user?
          if (!isRouteAllowed(parsedUser, currentPath)) {
            navigate(getHomeRoute(parsedUser));
          }
        } catch (err) {
          console.error('Error parsing stored user:', err);
          logout();
        }
      } else {
        logout();
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, [location.pathname, logout, navigate]);

  // Handle unauthorized access attempts
  useEffect(() => {
    if (isLoading || !user) return;

    const currentPath = location.pathname;

    // Allow access to public pages
    if (isPublicPath(currentPath)) return;

    // Redirect if user tries to access a non-authorized route
    if (!isRouteAllowed(user, currentPath)) {
      navigate(getHomeRoute(user));
    }
  }, [isLoading, user, location.pathname, navigate]);

  // Axios interceptor for 401 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  // Periodic token validation (only when user is authenticated)
  useEffect(() => {
    if (!token || !user) return;

    const intervalId = setInterval(async () => {
      const isValid = await validateToken(token);
      if (!isValid) {
        logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(intervalId);
  }, [token, user, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};