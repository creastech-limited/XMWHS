import React, { useEffect, useState } from 'react';
import {
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// TypeScript interfaces
interface StoreUser {
  name: string;
  notifications: number;
  avatar: string | null;
  status: 'Online' | 'Away' | 'Offline';
  lastLogin?: string;
  email?: string;
  _id?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

interface StoreHeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({ 
  onMenuToggle, 
  isSidebarOpen = false 
}) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const token = auth?.token;
  const logout = auth?.logout;
  const isAuthenticated = !!auth?.user;
  const authLoading = auth?.isLoading;
  
  const [storeUser, setStoreUser] = useState<StoreUser>({
    name: 'Store ABC',
    notifications: 0,
    avatar: null,
    status: 'Online',
    email: 'store@example.com'
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Use environment variable with fallback
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated && !authLoading) {
      navigate('/login');
      return;
    }

    // Initialize user data when auth is ready
    if (isAuthenticated && user && token) {
      initializeUserData();
      fetchNotifications();
    }
  }, [isAuthenticated, user, token, authLoading, navigate]);

  const initializeUserData = (): void => {
    if (user) {
      setStoreUser(prev => ({
                    ...prev,
                    name: String(user.name || user.storeName || 'Store ABC'),
                    avatar: user.avatar || null,
                    email: user.email || 'store@example.com',
                    _id: user._id,
                    lastLogin: typeof user.lastLogin === 'string' ? user.lastLogin : undefined
                  }));
    }
  };

  const fetchUserDetails = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        // Handle different response structures
        let profile: StoreUser | undefined;
        const data = response.data;
        
        if (data.user?.data) {
          profile = data.user.data;
        } else if (data.data) {
          profile = data.data;
        } else if (data.user) {
          profile = data.user as StoreUser;
        } else {
          profile = data as StoreUser;
        }

        if (profile) {
          const userProfile = {
            name: profile.name || 'Store ABC',
            avatar: profile.avatar || null,
            email: profile.email || 'store@example.com',
            _id: profile._id,
            notifications: storeUser.notifications, // Keep current notification count
            status: 'Online' as const,
            lastLogin: profile.lastLogin
          };

          setStoreUser(prev => ({ ...prev, ...userProfile }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (logout) logout(); // Use AuthContext logout
      }
    }
  };

  const fetchNotifications = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/api/notification/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        let notificationData: Notification[] = [];
        
        // Handle different response structures
        if (response.data.notifications) {
          notificationData = response.data.notifications;
        } else if (Array.isArray(response.data.data)) {
          notificationData = response.data.data;
        } else if (Array.isArray(response.data)) {
          notificationData = response.data;
        }

        setNotifications(notificationData);
        
        // Update unread notification count
        const unreadCount = notificationData.filter(n => !n.read).length;
        setStoreUser(prev => ({ ...prev, notifications: unreadCount }));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Don't redirect on notification fetch failure
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (token) {
        // Call logout endpoint
        await axios.get(`${API_URL}/api/users/logout`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.warn('Logout request failed or already expired.', error);
    } finally {
      setIsLoading(false);
      if (logout) logout(); 
    }
  };

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!token) return;

    try {
      await axios.patch(`${API_URL}/api/notification/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );

      // Update unread count
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      );
      const unreadCount = updatedNotifications.filter(n => !n.read).length;
      setStoreUser(prev => ({ ...prev, notifications: unreadCount }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getStatusColor = (status: StoreUser['status']): string => {
    switch (status) {
      case 'Online':
        return 'bg-green-500';
      case 'Away':
        return 'bg-yellow-500';
      case 'Offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: StoreUser['status']): string => {
    switch (status) {
      case 'Online':
        return 'text-green-700';
      case 'Away':
        return 'text-yellow-700';
      case 'Offline':
        return 'text-gray-700';
      default:
        return 'text-gray-700';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <header className="fixed top-0 right-0 left-0 md:left-70 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-center px-4 py-3 md:px-6 md:py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </header>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 md:left-70 z-40 bg-white shadow-sm border-b border-gray-200 transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Left Section - Mobile Menu & Search */}
          <div className="text-gray-600 flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
              title="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Search Bar - Hidden on mobile */}
            <div className="text-gray-600 hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Center Section - Store Info */}
          <div className="flex items-center space-x-3">
            {/* Store Avatar */}
            <div className="relative">
              {storeUser.avatar ? (
                <img
                  src={storeUser.avatar}
                  alt={storeUser.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-md object-cover"
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm md:text-base">
                    {getInitials(storeUser.name)}
                  </span>
                </div>
              )}
              {/* Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 ${getStatusColor(storeUser.status)} rounded-full border-2 border-white`}></div>
            </div>

            {/* Store Details - Hidden on mobile */}
            <div className="hidden md:block">
              <h2 className="font-semibold text-gray-900 text-lg truncate max-w-48">
                {storeUser.name}
              </h2>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${getStatusTextColor(storeUser.status)}`}>
                  {storeUser.status}
                </span>
                {storeUser.lastLogin && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      Last: {storeUser.lastLogin}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {storeUser.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {storeUser.notifications > 9 ? '9+' : storeUser.notifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsNotificationOpen(false)}
                  ></div>
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification._id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-xs mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {formatNotificationTime(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button 
                          onClick={fetchNotifications}
                          className="text-blue-600 text-sm hover:text-blue-800 transition-colors"
                        >
                          Refresh notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Open profile menu"
                aria-label="Open profile menu"
              >
                <User className="w-5 h-5" />
                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {storeUser.avatar ? (
                          <img
                            src={storeUser.avatar}
                            alt={storeUser.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(storeUser.name)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 truncate">{storeUser.name}</p>
                          <p className="text-sm text-gray-500 truncate">{storeUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button 
                        onClick={fetchUserDetails}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Refresh Profile
                      </button>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLoading ? 'Logging out...' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Logout Button - Mobile */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="md:hidden p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default StoreHeader;