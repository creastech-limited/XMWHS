import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WalletIcon,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from "../context/AuthContext";

interface User {
  _id: string;
  name: string;
  email: string;
  walletBalance?: number;
  role: string;
  // Add other user properties as needed
  [key: string]: unknown;
}

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Add other notification properties as needed
}

interface AgentData {
  name: string;
  walletBalance: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

const AHeader = () => {
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // Removed unused token state
  // Removed unused notifications state
   const { logout } = useAuth() || {};
   const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 640);
  
  const auth = useAuth();

  // Fetch user details from API
  const fetchUserDetails = async (authToken: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      let profile: User | undefined;
      if (data.user?.data) {
        profile = data.user.data;
      } else if (data.data) {
        profile = data.data;
      } else if (data.user) {
        profile = data.user as User;
      } else {
        profile = data as User;
      }

      if (!profile) {
        throw new Error('Invalid user data received');
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };
  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async (authToken: string): Promise<Notification[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/get`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures for notifications
      let notificationsList: Notification[] = [];
      if (data.notifications) {
        notificationsList = data.notifications;
      } else if (data.data) {
        notificationsList = data.data;
      } else if (Array.isArray(data)) {
        notificationsList = data;
      }

      return notificationsList;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return empty array on error instead of throwing
    }
  };

  // Handle authentication errors
  const handleAuthError = (message: string) => {
    console.error(message);
    // Clear stored data
    localStorage.removeItem('token');
    setUser(null);
    // setToken(null); // Removed unused token state
    setAgentData(null);
    // Optionally redirect to login or show error message
  };

  // Initialize authentication and fetch data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Starting auth initialization...');
        
        let authToken: string | null = null;
        let userProfile: User | null = null;

        // Check if user is already in auth context
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          userProfile = auth.user;
          authToken = auth.token;
          setUser(userProfile);
          // setToken(authToken); // Removed unused token state
        } else {
          // Try localStorage as fallback
          const storedToken = localStorage.getItem('token');
          if (!storedToken) {
            console.log('No token in localStorage');
            throw new Error('No authentication token found');
          }

          console.log('Found token in localStorage, fetching user from API...');
          authToken = storedToken;
          
          // Fetch user from API to ensure fresh data
          userProfile = await fetchUserDetails(authToken);
          console.log('Successfully fetched user profile:', userProfile);

          // Ensure 'role' is always present for AuthContext compatibility
          const mergedUser: User = {
            ...userProfile,
            role: userProfile.role || '',
          };

          // Update state and auth context
          setUser(mergedUser);
          setToken(authToken);
          auth?.login?.(mergedUser, authToken);
        }

        // Set agent data from user profile
        if (userProfile) {
          setAgentData({
            name: userProfile.name || "Agent User",
            walletBalance: userProfile.walletBalance || 0,
          });

          // Fetch notifications
          if (authToken) {
            const userNotifications = await fetchNotifications(authToken);
            
            // Count unread notifications
            const unread = userNotifications.filter(notif => !notif.read).length;
            setUnreadCount(unread);
          }
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const colors = {
    primary: '#3f51b5',
    secondary: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#f8faff',
    headerGradient: 'linear-gradient(120deg, #2c3e50 0%, #3f51b5 100%)',
  };

  if (loading) {
    return (
      <div className="flex m-2 flex-col bg-[#f8faff]">
        <div 
          className="text-white p-4 sm:p-6 flex justify-between items-center"
          style={{ background: colors.headerGradient }}
        >
          <div className="flex items-center gap-4">
            <WalletIcon className={`text-white ${isMobile ? 'text-3xl' : 'text-4xl'}`} />
            <div className="flex flex-col align-center justify-center">
              <h1 className={isMobile ? "text-xl font-bold leading-tight" : "text-2xl font-bold leading-tight"}>
                <span style={{ fontSize: isMobile ? '1.25rem' : '2.5rem' }}>Loading...</span>
              </h1>
              <p className="opacity-90 text-sm">Agent Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <h2 className={isMobile ? "text-lg font-bold" : "text-xl font-bold"}>
                ₦--
              </h2>
              <p className="opacity-80 text-xs">Wallet Balance</p>
            </div>
            <button 
              className="text-white p-2 rounded-full hover:text-blue-600 hover:bg-blue-600 hover:bg-opacity-10"
              aria-label="notifications"
            >
              <Bell style={{ color: 'white' }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex m-2 flex-col bg-[#f8faff]">
      <div 
        className="text-white p-4 sm:p-6 flex justify-between items-center"
        style={{ background: colors.headerGradient }}
      >
        <div className="flex items-center gap-4">
          <WalletIcon className={`text-white ${isMobile ? 'text-3xl' : 'text-4xl'}`} />
          <div className="flex flex-col align-center justify-center">
            <h1 className={isMobile ? "text-xl font-bold leading-tight" : "text-2xl font-bold leading-tight"}>
              <span style={{ fontSize: isMobile ? '1.25rem' : '2.5rem' }}>
                {agentData?.name || user?.name || "Agent User"}
              </span>
            </h1>
            <p className="opacity-90 text-sm">Agent Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className='text-right'>
            <h2 className={isMobile ? "mt-6 text-lg font-bold" : "text-xl font-bold"}>
              ₦{agentData?.walletBalance?.toLocaleString() || '0'}
            </h2>
            <p className="opacity-80 text-xs">Wallet Balance</p>
          </div>
          <button 
            className="text-white p-2 rounded-full hover:text-blue-600 hover:bg-blue-600 hover:bg-opacity-10 relative"
            aria-label="notifications"
            title={`${unreadCount} unread notifications`}
          >
            <Bell style={{ color: 'white' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 transition duration-200 rounded-lg flex items-center gap-2 font-medium text-white"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className={isMobile ? "hidden" : "block"}>Logout</span>
              </button>
        </div>
      </div>
    </div>
  );
};

export default AHeader;

// Sets the authentication token in localStorage
function setToken(authToken: string) {
  localStorage.setItem('token', authToken);
}