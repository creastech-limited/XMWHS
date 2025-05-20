import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
  }, []);

  const login = (userData: User, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
    setUser(userData);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType | undefined => useContext(AuthContext);
