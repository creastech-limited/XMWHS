import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, jwt: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Define role-based routes
const ROLE_ROUTES: Record<string, string> = {
  school: '/schools',
  parent: '/parent',
  student: '/kidswallet',
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
    '/Sdisputes',
    '/settings',
  ],
  parent: [
    '/parent',
    '/fundwallet',
    '/payschoolbills',
    '/ptransactionhistory',
    '/Pdispute',
    '/Psettings',
  ],
  student: [
    '/kidswallet',
    '/kidpayagent',
    '/kidpaymenthistory',
    '/schoolbills',
    '/ksettings',
    '/kdispute',
  ],
  store: [
    '/store',
    '/agents',
    '/stransactions',
    '/Swithdrawal',
    '/Storedispute',
    '/store/settings',
  ],
  agent: [
    '/agent',
    '/agent/scanqr',
    '/agent/transfertostore',
    '/agent/transactions',
  ],
  admin: ['/admin'],
};

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  '/login',
  '/signup',
  '/schoolsignup',
  '/forgot-password',
  '/terms',
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const validateToken = async (tokenToValidate: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

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
      // Redirect to role-specific route after login
      const roleRoute = ROLE_ROUTES[userData.role] || '/';
      navigate(roleRoute);
    },
    [navigate]
  );

  // Check auth status and handle routing
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);

      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        if (!PUBLIC_PAGES.includes(location.pathname)) {
          navigate('/login');
        }
        return;
      }

      const isValidToken = await validateToken(storedToken);

      if (isValidToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // Check if current route is allowed for this user role
          const currentPath = location.pathname;

          // If user is on public page, no need to redirect
          if (PUBLIC_PAGES.includes(currentPath)) {
            setIsLoading(false);
            return;
          }

          // If user is not on their role-specific route, redirect them
          const allowedRoutes = ROLE_SPECIFIC_ROUTES[parsedUser.role] || [];
          if (!allowedRoutes.some(route => currentPath.startsWith(route))) {
            navigate(ROLE_ROUTES[parsedUser.role] || '/');
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
    const allowedRoutes = ROLE_SPECIFIC_ROUTES[user.role] || [];

    // Allow access to public pages
    if (PUBLIC_PAGES.includes(currentPath)) return;

    // Redirect if user tries to access non-authorized route
    if (!allowedRoutes.some(route => currentPath.startsWith(route))) {
      navigate(ROLE_ROUTES[user.role] || '/');
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

  // Periodic token validation
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(async () => {
      const isValid = await validateToken(token);
      if (!isValid) {
        logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(intervalId);
  }, [token, logout]);

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