import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getmarkNotification, getNotifications, getUserDetails } from '../services';
import { getStoreDashboard } from '../services/api/storeDashboard';
import { emptyDashboard, mapDashboard } from '../utils/dashboardMapper';
import type { User, UserResponse, Notification, NotificationsResponse, Wallet } from '../types';
import type { DashboardData } from '../types/dashboard';

export const useStoreDashboard = () => {
  const auth = useAuth() as {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
  };
  const token = auth?.token;

  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>(emptyDashboard);

  const setUser = (profile: User | null) => {
    if (profile) {
      localStorage.setItem('user', JSON.stringify(profile));
    } else {
      localStorage.removeItem('user');
    }
  };

  const handleAuthError = useCallback((message: string) => {
    setError(message);
    setUser(null);
  }, []);

  const fetchUserDetails = useCallback(async (): Promise<User> => {
    try {
      const data: UserResponse = await getUserDetails();

      let profile: User | undefined;
      let walletData: Partial<Wallet> | undefined;

      if (data.user?.data) {
        profile = data.user.data;
        walletData = data.user.wallet;
      } else if (data.data) {
        profile = data.data;
        walletData = data.wallet;
      } else {
        throw new Error('Unexpected API structure: missing user data');
      }

      if (!profile) {
        throw new Error('Invalid user data received from API');
      }

      const transformedUser: User = {
        ...profile,
        _id:
          typeof profile['*id'] === 'string'
            ? profile['*id']
            : typeof profile._id === 'string'
              ? profile._id
              : typeof profile.id === 'string'
                ? profile.id
                : '',
        name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        role: profile.role || 'store',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        storeName: profile.storeName || '',
        storeType: profile.storeType || '',
        schoolName: profile.schoolName || '',
        schoolId:
          typeof profile.schoolId === 'string'
            ? profile.schoolId
            : typeof profile.school_id === 'string'
              ? profile.school_id
              : typeof profile.store_id === 'string'
                ? profile.store_id.split('/')[0]
                : '',
        store_id:
          typeof profile.store_id === 'string'
            ? profile.store_id
            : typeof profile.storeId === 'string'
              ? profile.storeId
              : '',
        balance: walletData?.balance || 0,
      };

      if (!transformedUser._id) {
        throw new Error('Invalid user ID received from API');
      }

      return transformedUser;
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      throw error;
    }
  }, []);

  const fetchNotifications = useCallback(async (): Promise<Notification[]> => {
    try {
      const response = (await getNotifications()) as unknown as NotificationsResponse;
      let notificationsList: unknown[] = [];

      if (Array.isArray(response)) {
        notificationsList = response;
      } else if (Array.isArray(response.data)) {
        notificationsList = response.data;
      } else if (Array.isArray(response.notifications)) {
        notificationsList = response.notifications;
      } else if (response && typeof response === 'object') {
        const foundArray = Object.values(response).find(Array.isArray);
        notificationsList = foundArray || [];
      }

      interface NotificationData {
        _id?: string;
        id?: string;
        userId?: string;
        type?: string;
        title?: string;
        message?: string;
        read?: boolean;
        createdAt?: string;
        __v?: number;
      }

      return notificationsList.map((notif: unknown) => {
        const data = notif as NotificationData;
        return {
          _id: data._id || data.id || Math.random().toString(36).substring(2, 9),
          userId: data.userId || '',
          type: data.type || 'info',
          title: data.title || 'Notification',
          message: data.message || 'New notification',
          read: Boolean(data.read),
          createdAt: data.createdAt || new Date().toISOString(),
          __v: data.__v || 0,
        };
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }, []);

  // One call (/api/store/dashboard) now supplies the balance, revenue, agents and transactions.
  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashboard, notifications] = await Promise.all([getStoreDashboard(), fetchNotifications()]);
      if (!dashboard.success) throw new Error('Dashboard request was not successful');
      setDashboardData({ ...mapDashboard(dashboard), notifications: notifications.slice(0, 3) });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  }, [fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const notifications = await fetchNotifications();
      setDashboardData((prev) => ({ ...prev, notifications: notifications.slice(0, 3) }));
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [token, fetchNotifications]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await getmarkNotification(notificationId);
      setDashboardData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        if (auth?.user?._id && auth?.token) {
          setUser(auth.user);
          await fetchDashboardData();
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }

        const profile = await fetchUserDetails();
        setUser(profile);

        if (auth?.login) {
          auth.login(profile, storedToken);
        }

        await fetchDashboardData();
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth, fetchUserDetails, fetchDashboardData, handleAuthError]);

  return {
    dashboardData,
    activeTab,
    loading,
    error,
    setActiveTab,
    refreshNotifications,
    markNotificationAsRead,
    fetchDashboardData,
  };
};