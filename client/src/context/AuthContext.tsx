import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  [key: string]: unknown; // to allow additional fields
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to validate token with backend
  const validateToken = async (tokenToValidate: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Enhanced logout function with redirect
  const logout = React.useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    
    // Only redirect if not already on login page
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  // Original login function - unchanged
  const login = (userData: User, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
    setUser(userData);
    setToken(jwt);
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken || !storedUser) {
        setIsLoading(false);
        // Only redirect if not on public pages
        const publicPages = ['/login', '/register', '/forgot-password', '/'];
        if (!publicPages.includes(location.pathname)) {
          navigate('/login');
        }
        return;
      }

      // Validate token with backend
      const isValidToken = await validateToken(storedToken);
      
      if (isValidToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (err) {
          console.error('Error parsing stored user:', err);
          logout();
        }
      } else {
        // Token is invalid, clear everything and redirect
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        navigate('/login');
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [navigate, location.pathname, logout]);

  // Set up axios interceptor for automatic 401 handling
  useEffect(() => {
    const axiosInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle 401 Unauthorized responses globally
        if (error.response?.status === 401) {
          console.log('401 Unauthorized - token expired or invalid');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(axiosInterceptor);
    };
  }, [logout]);

  // Periodic token validation (every 10 minutes)
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(async () => {
      const isValid = await validateToken(token);
      if (!isValid) {
        console.log('Token validation failed - logging out');
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

export const useAuth = (): AuthContextType | undefined => useContext(AuthContext);