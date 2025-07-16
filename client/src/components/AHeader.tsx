import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WalletIcon,
  Bell,
  LogOut,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from "../context/AuthContext";

interface User {
  _id: string;
  name: string;
  email: string;
  walletBalance?: number;
  role: string;
  [key: string]: unknown;
}

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

interface AgentData {
  name: string;
  walletBalance: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

const AHeader = () => {
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 640);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const { logout } = useAuth() || {};
  const navigate = useNavigate();
  const auth = useAuth();
  const notifRef = useRef<HTMLDivElement>(null);

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
      console.log('User API Response:', data); // Debug log
      
      // Fixed: Extract user data based on the actual response structure
      const userData = data.user?.data || data.data || data.user || data;
      const walletBalance = data.user?.wallet?.balance || 0; // Fixed: Get balance from the correct path

      if (!userData) {
        throw new Error('Invalid user data received');
      }

      return {
        ...userData,
        walletBalance,
        role: userData.role || '',
      };
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
      console.log('Notifications API Response:', data); // Debug log
      
      // Fixed: Handle the actual response structure - data is directly an array
      let notificationsList: Notification[] = [];
      if (Array.isArray(data)) {
        notificationsList = data;
      } else if (data.notifications && Array.isArray(data.notifications)) {
        notificationsList = data.notifications;
      } else if (data.data && Array.isArray(data.data)) {
        notificationsList = data.data;
      }

      return notificationsList;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const authToken = auth?.token || localStorage.getItem('token');
      if (!authToken) return;

      const response = await fetch(`${API_BASE_URL}/api/notification/read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );

      // Update unread count
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle authentication errors
  const handleAuthError = (message: string) => {
    console.error(message);
    localStorage.removeItem('token');
    setUser(null);
    setAgentData(null);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get notification border color based on type
  const getNotificationTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'info': return 'border-l-blue-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      case 'success': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Initialize authentication and fetch data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        let authToken: string | null = null;
        let userProfile: User | null = null;

        if (auth?.user?._id && auth?.token) {
          userProfile = auth.user;
          authToken = auth.token;
          setUser(userProfile);
        } else {
          const storedToken = localStorage.getItem('token');
          if (!storedToken) {
            throw new Error('No authentication token found');
          }

          authToken = storedToken;
          userProfile = await fetchUserDetails(authToken);
          setUser(userProfile);
          auth?.login?.(userProfile, authToken);
        }

        // Set agent data with proper wallet balance
        if (userProfile) {
          setAgentData({
            name: userProfile.name || "Agent User",
            walletBalance: userProfile.walletBalance || 0,
          });

          if (authToken) {
            const userNotifications = await fetchNotifications(authToken);
            setNotifications(userNotifications);
            
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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          
          {/* Notifications dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              className="text-white p-2 rounded-full hover:text-blue-600 hover:bg-blue-600 hover:bg-opacity-10 relative"
              aria-label="notifications"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <Bell style={{ color: 'white' }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button 
                    onClick={() => setIsNotifOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications available
                  </div>
                ) : (
                  <ul>
                    {notifications.map((notification) => (
                      <li 
                        key={notification._id}
                        className={`border-b border-gray-100 last:border-0 ${!notification.read ? 'bg-blue-50' : ''}`}
                      >
                        <div 
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${getNotificationTypeColor(notification.type)}`}
                          onClick={() => {
                            if (!notification.read) {
                              markNotificationAsRead(notification._id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              {/* Fixed: Display the title instead of message, and message as subtitle */}
                              <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
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