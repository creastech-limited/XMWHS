import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import type { NotificationsResponse } from '../types';
import { getmarkNotification, getNotifications } from '../services';
import { ConfirmLogoutModal } from '../components/shared/ConfirmLogoutModal';

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

// Capitalise every word: "mercy kalu" -> "Mercy Kalu"
const capitalizeWords = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

// "Mercy Kalu" -> "MK"
const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

const StoreHeader: React.FC<StoreHeaderProps> = ({
  onMenuToggle,
  isSidebarOpen = false,
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
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchNotifications = useCallback(async (): Promise<void> => {
    if (!token) return;

    try {
      setNotificationsLoading(true);
      const data: NotificationsResponse = await getNotifications();

      let notificationData: Notification[] = [];

      if (Array.isArray(data)) {
        notificationData = data;
      } else if (data.data && Array.isArray(data.data)) {
        notificationData = data.data;
      } else if (data.notifications && Array.isArray(data.notifications)) {
        notificationData = data.notifications;
      }

      setNotifications(notificationData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (logout) {
          logout();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      }
    } finally {
      setNotificationsLoading(false);
    }
  }, [token, logout, navigate]);

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
    if (!isAuthenticated && !authLoading) {
      navigate('/login');
      return;
    }

    if (isAuthenticated && user && token) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, token, authLoading, navigate, fetchNotifications]);

  // First + last name, properly capitalised
  const getFullName = (): string => {
    if (user?.firstName && user?.lastName) {
      return capitalizeWords(`${user.firstName} ${user.lastName}`);
    }
    if (user?.name) return capitalizeWords(user.name);
    if (user?.firstName) return capitalizeWords(user.firstName);
    return user?.email || 'User';
  };

  // Returns a picture URL only when there is a real one; otherwise null
  // so we can render the navy initials circle instead.
  const getProfilePictureUrl = (): string | null => {
    if (avatarError || !user?.profilePicture) return null;
    if (user.profilePicture.startsWith('/uploads/')) {
      return `${API_URL}${user.profilePicture}`;
    }
    return user.profilePicture;
  };

  const renderAvatar = (sizeClasses: string, textClasses: string) => {
    const pictureUrl = getProfilePictureUrl();

    if (pictureUrl) {
      return (
        <img
          src={pictureUrl}
          alt={getFullName()}
          className={`${sizeClasses} rounded-full object-cover shrink-0`}
          onError={() => setAvatarError(true)}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses} ${textClasses} rounded-full bg-[#0F1B3D] text-white font-semibold flex items-center justify-center shrink-0`}
        aria-label={getFullName()}
      >
        {getInitials(getFullName())}
      </div>
    );
  };

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!token) return;

    try {
      await getmarkNotification(notificationId);

      setNotifications((prev: Notification[]) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      const error = err as AxiosError;
      console.error('Failed to mark notification as read:', error);

      if (error.response?.status === 401 && logout) {
        logout();
        navigate('/login');
      }
    }
  };

  // Step 1: the Logout menu item only asks for confirmation
  const handleLogoutClick = (): void => {
    setIsProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  // Step 2: the modal's "Yes, log out" performs the real logout
  const handleConfirmLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      if (logout) logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
      setShowLogoutConfirm(false);
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

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const iconStyle: React.CSSProperties = {
    display: 'block',
    stroke: '#0F1B3D',
    fill: 'none',
    opacity: 1,
    visibility: 'visible',
  };

  const iconButtonStyle: React.CSSProperties = {
    padding: 0,
    borderRadius: 12,
    border: '1px solid rgba(229, 231, 235, 0.7)',
    background: '#fff',
  };

  // Shared style for the square white icon buttons (help + bell)
  const iconButtonClasses =
    'relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/70 bg-white text-[#0F1B3D] transition-colors hover:bg-gray-50';

  // Loading state while auth initialises
  if (authLoading) {
    return (
      <header className="fixed top-0 right-0 left-0 lg:left-[240px] z-40 bg-[#F7F8FC] border-b border-gray-200/60">
        <div className="flex items-center justify-center px-4 py-3 lg:px-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </header>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 lg:left-[240px] z-40 bg-[#F7F8FC] border-b border-gray-200/60 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-8">
          {/* Left: mobile menu */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
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

          {/* Right: notifications, profile */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={iconButtonClasses}
                style={iconButtonStyle}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={18} color="#0F1B3D" style={iconStyle} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                        {unreadNotificationsCount} new
                      </span>
                    )}
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
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''
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

            {/* Profile pill + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex h-11 items-center gap-2.5 rounded-full border border-gray-200/70 bg-white py-1 pl-1 pr-3 transition-colors hover:bg-gray-50 sm:pr-4"
                title="Open profile menu"
                aria-label="Open profile menu"
                aria-expanded={isProfileOpen}
              >
                {renderAvatar('h-9 w-9', 'text-xs')}
                <span className="hidden max-w-40 truncate text-sm font-semibold text-[#0F1B3D] sm:block">
                  {getFullName()}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      {renderAvatar('h-10 w-10', 'text-sm')}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{getFullName()}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogoutClick}
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

      {/* Spacer to prevent content from going under the fixed header */}
      <div className="h-[69px]"></div>

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

      {/* Logout confirmation */}
      <ConfirmLogoutModal
        open={showLogoutConfirm}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default StoreHeader;