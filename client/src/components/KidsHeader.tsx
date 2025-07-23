import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Wallet, User, X, Clock, AlertCircle, CheckCircle, Info, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

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

interface Profile {
  name?: string;
  fullName?: string;
  profilePic?: string;
  qrCodeId?: string;
  _id?: string;
}

interface Wallet {
  balance: number;
}

interface KidsHeaderProps {
  profile: Profile | null;
  wallet: Wallet | null;
}

const KidsHeader = ({ profile, wallet }: KidsHeaderProps) => {
  const navigate = useNavigate();
  const { user: authUser, token: authToken, logout } = useAuth() || {};
  const [user, setUser] = useState<User | null>(authUser || null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 768px)").matches);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';
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
      const response = await fetch(`${API_URL}/api/notification/read/${notificationId}`, {
        method: 'PUT',
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
      
      await Promise.all(
        unreadNotifications.map(notif => 
          fetch(`${API_URL}/api/notification/read/${notif._id}`, {
            method: 'POST',
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

  // Handle notification click - Show modal without closing panel
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Set the selected notification and open modal
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowNotificationModal(false);
    setSelectedNotification(null);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'wallet':
      case 'payment':
        return <DollarSign className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle screen size changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleResize = (e: MediaQueryListEvent): void => setIsMobile(e.matches);
    
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Load user data
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
            profilePicture: payload.profilePicture,
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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        !(modalRef.current?.contains(event.target as Node))
      ) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleModalClose();
      }
    };

    if (showNotificationModal) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showNotificationModal]);

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
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFullDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = () => {
    if (user?.name && user.name !== 'User') return user.name;
    if (user?.firstName || user?.lastName) return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return user?.email ?? 'Guest';
  };

  const getUserAvatar = () => {
    if (user?.profilePicture) {
      if (user.profilePicture.startsWith('/uploads/')) {
        return `${API_URL}${user.profilePicture}`;
      }
      if (user.profilePicture.startsWith('http')) {
        return user.profilePicture;
      }
      return `${API_URL}/${user.profilePicture}`;
    }
    
    if (user?.avatar) {
      if (user.avatar.startsWith('/uploads/')) {
        return `${API_URL}${user.avatar}`;
      }
      if (user.avatar.startsWith('http')) {
        return user.avatar;
      }
      return `${API_URL}/${user.avatar}`;
    }
    
    return '/default-avatar.png';
  };

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
      case 'wallet':
      case 'payment':
        return 'border-purple-500';
      default:
        return 'border-gray-300';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info':
        return 'bg-blue-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'error':
        return 'bg-red-50';
      case 'success':
        return 'bg-green-50';
      case 'wallet':
      case 'payment':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const username = loading ? "Loading..." : (getDisplayName() || profile?.name || profile?.fullName || "Kid User");
  const walletBalance = wallet ? wallet.balance : 0;
  const avatar = getUserAvatar();

  return (
    <>
      <div className="rounded-xl overflow-visible mb-6 shadow-xl border border-gray-100 relative">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
          <div className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-5">
              {/* Profile Section */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg overflow-hidden border-4 border-white">
                    {loading ? (
                      <div className="w-full h-full rounded-full bg-gray-200 animate-pulse" />
                    ) : (
                      <img 
                        src={avatar} 
                        alt={username}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                    {loading ? (
                      <div className="w-32 h-8 bg-white bg-opacity-20 rounded animate-pulse" />
                    ) : (
                      username
                    )}
                  </h1>
                  <p className="text-blue-100 font-medium flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" />
                    <span>Kids Wallet Dashboard</span>
                  </p>
                </div>
              </div>
              
              {/* Controls Section */}
              <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end">
                {/* Wallet Balance */}
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Wallet Balance</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    ₦{walletBalance.toLocaleString()}
                  </p>
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) {
                        fetchNotifications();
                      }
                    }}
                    className="relative p-3 rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-200 group"
                    aria-label="Notifications"
                  >
                    <Bell className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-blue-800 flex items-center justify-center text-xs font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {showNotifications && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-[100] overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
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
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 mb-1">
                                    {notification.title}
                                  </div>
                                  <div className="text-sm text-gray-700 line-clamp-2">
                                    {notification.message}
                                  </div>
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
                              <Bell className="h-8 w-8 text-gray-300" />
                            </div>
                            <p>No notifications yet</p>
                            <p className="text-xs mt-1">We'll notify you when something happens</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
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
                            onClick={() => setShowNotifications(false)}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-all duration-200 rounded-lg flex items-center gap-2 font-medium text-white shadow-lg hover:shadow-xl hover:scale-105"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className={isMobile ? "hidden" : "block"}>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div 
            ref={modalRef}
            className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
              showNotificationModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b ${getNotificationBgColor(selectedNotification.type)}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedNotification.title}
                  </h3>
                </div>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className={`border-l-4 ${getNotificationTypeColor(selectedNotification.type)} pl-4 mb-4`}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedNotification.message}
                </p>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatFullDate(selectedNotification.createdAt)}</span>
                </div>
                <span className="capitalize">{selectedNotification.type}</span>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

export default KidsHeader;