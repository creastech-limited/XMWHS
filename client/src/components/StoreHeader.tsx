import React, { useEffect, useState, useRef } from 'react';
import {
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// TypeScript interfaces
interface User {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  avatar?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  __v: number;
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
  const user = auth?.user as User | null;
  const token = auth?.token;
  const logout = auth?.logout;
  const isAuthenticated = !!auth?.user;
  const authLoading = auth?.isLoading;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Use environment variable with fallback
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated && !authLoading) {
      navigate('/login');
      return;
    }

    // Initialize user data when auth is ready
    if (isAuthenticated && user && token) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, token, authLoading, navigate]);

  const getUserAvatar = (): string => {
    if (user?.profilePicture) {
      if (user.profilePicture.startsWith('/uploads/')) {
        return `${API_URL}${user.profilePicture}`;
      }
      return user.profilePicture;
    }
    return user?.avatar || '/default-avatar.png';
  };

  const getFullName = (): string => {
    if (user?.name) return user.name;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    return user?.email || 'User';
  };

  const fetchNotifications = async (): Promise<void> => {
    if (!token) return;

    try {
      setNotificationsLoading(true);
      const response = await axios.get(`${API_URL}/api/notification/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let notificationData: Notification[] = [];
      
      // Handle multiple response structures
      if (Array.isArray(response.data)) {
        notificationData = response.data;
      } else if (Array.isArray(response.data.data)) {
        notificationData = response.data.data;
      } else if (response.data.notifications) {
        notificationData = response.data.notifications;
      }

      setNotifications(notificationData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (logout) logout();
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!token) return;

    try {
      await axios.put(`${API_URL}/api/notification/read/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      if (logout) logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'info': return 'border-blue-500';
      case 'warning': return 'border-yellow-500';
      case 'error': return 'border-red-500';
      case 'success': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  const formatDate = (dateString: string): string => {
    const d = new Date(dateString);
    const now = new Date();
    
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <header className="fixed top-0 right-0 left-0 lg:left-[280px] z-40 bg-white shadow-sm border-b border-gray-200 transition-all duration-300">
        <div className="flex items-center justify-center px-4 py-3 lg:px-6 lg:py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </header>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 lg:left-[280px] z-40 bg-white shadow-sm border-b border-gray-200 transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
          {/* Left Section - Mobile Menu & Search */}
          <div className="text-gray-600 flex items-center space-x-4">
            {/* Mobile Menu Button (visible on tablet and mobile) */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
              title="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>

            
          </div>

          {/* Center Section - Store Info */}
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className="relative">
              <img
                src={getUserAvatar()}
                alt={getFullName()}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-md object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* User Details - Hidden on mobile and tablet */}
            <div className="hidden lg:block">
              <h2 className="font-semibold text-gray-900 text-lg truncate max-w-48">
                {getFullName()}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-green-700">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : notifications.length === 0 ? (
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
                          onClick={() => {
                            markNotificationAsRead(notification._id);
                            setSelectedNotification(notification);
                            setIsNotificationOpen(false);
                          }}
                        >
                          <div className="flex items-start">
                            <div className={`border-l-4 ${getNotificationTypeColor(notification.type)} pl-3 flex-1`}>
                              <p className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 text-xs mt-1">
                                {notification.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {formatDate(notification.createdAt)}
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
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
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
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getUserAvatar()}
                        alt={getFullName()}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-avatar.png';
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 truncate">{getFullName()}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => navigate('/store/settings')}
                    >
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
              )}
            </div>

        
          </div>
        </div>

       
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 lg:h-20"></div>

      {/* Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className={`border-l-4 ${getNotificationTypeColor(selectedNotification.type)} pl-4 mb-4`}>
              <h3 className="text-lg font-semibold">{selectedNotification.title}</h3>
              <p className="text-gray-500 text-sm">
                {formatDate(selectedNotification.createdAt)}
              </p>
            </div>
            <p className="text-gray-700 mb-6">{selectedNotification.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedNotification(null);
                  setIsNotificationOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreHeader;