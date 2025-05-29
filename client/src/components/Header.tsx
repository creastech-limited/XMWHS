import React, { useState, useRef, useEffect } from 'react';
import {
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon as LogoutIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from './5.png';

interface User {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  avatar?: string;
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

export const Header: React.FC = () => {
  const { user: authUser, token: authToken, logout } = useAuth() || {};
  const [user, setUser] = useState<User | null>(authUser || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://nodes-staging.up.railway.app';
  const token = authToken || localStorage.getItem('token');

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!token) return;
    
    try {
      setNotificationsLoading(true);
      const response = await fetch(`${API_URL}/api/notification/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        logout?.();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      // Handle different response structures
      const notificationsList = Array.isArray(data) ? data : data.notifications || data.data || [];
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/notification/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Update all unread notifications
      await Promise.all(
        unreadNotifications.map(notif => 
          fetch(`${API_URL}/api/notification/${notif._id}/read`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
        )
      );

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);

        if (authUser) {
          setUser(authUser);
          return;
        }

        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          const fullName = parsed.name
            ?? ((parsed.firstName && parsed.lastName) ? `${parsed.firstName} ${parsed.lastName}` : (parsed.firstName ?? parsed.lastName ?? ''));
          setUser({ ...parsed, name: fullName.trim() || 'User' });
          return;
        }

        if (token) {
          const res = await fetch(`${API_URL}/api/users/getuserone`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (res.status === 401) {
            logout?.();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }

          if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);

          const json = await res.json();
          const payload = json.user?.data ?? json.data ?? json.user ?? json;

          const fullName = payload.name
            ?? (payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}` : payload.firstName ?? payload.lastName ?? '');

          const formatted: User = {
            _id: payload._id,
            name: fullName.trim() || 'User',
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            role: payload.role,
            avatar: payload.avatar,
          };

          setUser(formatted);
          localStorage.setItem('user', JSON.stringify(formatted));
        }
      } catch (err) {
        console.error('Error loading user:', err);
        const fallback = localStorage.getItem('user');
        if (fallback) {
          try {
            setUser(JSON.parse(fallback));
          } catch {
            // ignore parse errors
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [API_URL, authUser, token, logout, navigate]);

  // Fetch notifications when component mounts and when user is loaded
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
    }
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDisplayName = () => {
    if (user?.name && user.name !== 'User') return user.name;
    if (user?.firstName || user?.lastName) return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return user?.email ?? 'Guest';
  };

  const getDisplayRole = () => user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User';

  function handleProfileClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    navigate('/profile');
  }

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get notification type color
  const getNotificationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info':
        return 'border-blue-500';
      case 'warning':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      case 'success':
        return 'border-green-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <div className="flex-shrink-0 flex items-center ml-20 sm:ml-70">
          <img 
        src={logo} 
        alt="Logo" 
        className="h-8 w-auto cursor-pointer"
        onClick={() => navigate('')}
          />
        </div>
        
        {/* Search bar - with proper sizing */}
        <div className="flex-1 max-w-xl mx-4 hidden sm:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="text-gray-500 block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors duration-200"
            />
          </div>
        </div>

        {/* Right-aligned action buttons */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setMenuOpen(false);
                if (!notifOpen) {
                  fetchNotifications(); // Refresh notifications when opening
                }
              }}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 relative"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                
                <div className="py-1 max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={`px-4 py-3 hover:bg-gray-50 border-l-4 ${getNotificationTypeColor(notification.type)} ${
                          !notification.read ? 'bg-blue-50' : 'border-transparent hover:border-blue-500'
                        } transition-all duration-200 cursor-pointer`}
                        onClick={() => !notification.read && markAsRead(notification._id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-700">{notification.message}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="ml-2 mt-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">
                      <div className="flex justify-center mb-3">
                        <BellIcon className="h-8 w-8 text-gray-300" />
                      </div>
                      <p>No notifications yet</p>
                      <p className="text-xs mt-1">We'll notify you when something happens</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 flex justify-between">
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </button>
                    <button 
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/ptransactionhistory');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                    >
                      See all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => {
                setMenuOpen(!menuOpen);
                setNotifOpen(false);
              }}
              className="flex items-center space-x-2 rounded-full focus:outline-none"
              aria-label="User menu"
            >
              <div className="flex items-center space-x-3 px-2 py-1 rounded-full hover:bg-gray-100">
                {loading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : (
                  <img
                    src={user?.avatar || '/default-avatar.png'}
                    alt="User profile"
                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                )}
                <div className="hidden md:flex md:flex-col md:items-start">
                  {loading ? (
                    <>
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                        {getDisplayName()}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {getDisplayRole()}
                      </span>
                    </>
                  )}
                </div>
                <svg className="hidden md:block h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {menuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.avatar || '/default-avatar.png'}
                      alt="User profile"
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-avatar.png';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-gray-500" />
                    Your Profile
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-500" />
                    Settings
                  </button>
                </div>
                <div className="py-1 bg-gray-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogoutIcon className="h-4 w-4 mr-3 text-red-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};