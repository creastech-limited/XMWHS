// src/hooks/useStoreDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAgentsById,
  getmarkNotification,
  getNotifications,
  getUserDetails,
  getUserTransactions,
} from '../services';
import type { 
  User, 
  UserResponse, 
  Transaction, 
  TransactionsResponse,
  Notification,
  NotificationsResponse,
  Agent,
  Wallet 
} from '../types';
import type { DashboardData } from '../types/store';

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
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    dailyRevenue: 0,
    numberOfAgents: 0,
    growth: {
      revenue: 0,
      agents: 0,
    },
    recentTransactions: [],
    topAgents: [],
    notifications: [],
  });

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
        throw new Error("Unexpected API structure: missing user data");
      }

      if (!profile) {
        throw new Error("Invalid user data received from API");
      }

      const transformedUser: User = {
        ...profile,
        _id:
          typeof profile["*id"] === "string"
            ? profile["*id"]
            : typeof profile._id === "string"
              ? profile._id
              : typeof profile.id === "string"
                ? profile.id
                : "",
        name:
          profile.name ||
          `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        role: profile.role || "store",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        storeName: profile.storeName || "",
        storeType: profile.storeType || "",
        schoolName: profile.schoolName || "",
        schoolId: typeof profile.schoolId === 'string'
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
        throw new Error("Invalid user ID received from API");
      }

      return transformedUser;
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      throw error;
    }
  }, []);

  const fetchUserTransactions = useCallback(async (): Promise<Transaction[]> => {
    try {
      const response: TransactionsResponse = await getUserTransactions();
      const rawData = response.data || response.transactions || [];

      const transactions: Transaction[] = rawData.map((tx: Transaction) => {
        const resolvedId = String(
          tx._id ||
          (tx as Record<string, unknown>).id ||
          (tx as Record<string, unknown>)["*id"] ||
          Math.random().toString(36).substring(2, 9)
        );

        let customerName = 'Unknown Sender';
        const senderWallet = tx.senderWalletId;

        if (tx.metadata?.senderEmail) {
          customerName = String(tx.metadata.senderEmail);
        } else if (
          senderWallet &&
          typeof senderWallet === 'object' &&
          'email' in senderWallet
        ) {
          customerName = String((senderWallet as { email: string }).email);
        }

        let statusDisplay = 'Failed';
        const rawStatus = (tx.status || '').toLowerCase();
        if (rawStatus === 'success' || rawStatus === 'completed') {
          statusDisplay = 'Completed';
        } else if (rawStatus === 'pending') {
          statusDisplay = 'Pending';
        }

        return {
          ...tx,
          _id: resolvedId,
          id: resolvedId,
          date: tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
          amount: Number(tx.amount) || 0,
          customer: customerName,
          status: statusDisplay,
          metadata: tx.metadata || {},
        } as Transaction;
      });

      return transactions;
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      return [];
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

      const notifications: Notification[] = notificationsList.map(
        (notif: unknown) => {
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
        }
      );

      return notifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }, []);

  const fetchAgentCount = useCallback(async (): Promise<number> => {
    try {
      const response = await getAgentsById();
      const agents = Array.isArray(response.data?.agent)
        ? response.data.agent
        : [];
      return agents.length;
    } catch (error) {
      console.error('Failed to fetch agent count:', error);
      return 0;
    }
  }, []);

  const fetchAgentPerformance = useCallback(
    async (transactions: Transaction[]): Promise<Agent[]> => {
      try {
        if (transactions.length === 0) return [];

        const senderCounts = transactions.reduce(
          (acc, tx) => {
            const senderEmail = tx.customer;
            if (senderEmail && senderEmail !== 'Unknown Sender') {
              acc[senderEmail] = (acc[senderEmail] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        );

        const senderRevenue = transactions.reduce(
          (acc, tx) => {
            const senderEmail = tx.customer;
            if (
              senderEmail &&
              senderEmail !== 'Unknown Sender' &&
              tx.status === 'Completed'
            ) {
              acc[senderEmail] = (acc[senderEmail] || 0) + tx.amount;
            }
            return acc;
          },
          {} as Record<string, number>
        );

        const agents: Agent[] = Object.entries(senderCounts)
          .map(([email, count]) => {
            const revenue = senderRevenue[email] || 0;
            const maxTransactions = Math.max(...Object.values(senderCounts));
            const performance =
              maxTransactions > 0
                ? Math.round((count / maxTransactions) * 100)
                : 0;

            return {
              name: email.split('@')[0],
              sales: count,
              performance,
              revenue,
            };
          })
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);

        return agents;
      } catch (error) {
        console.error('Failed to calculate agent performance:', error);
        return [];
      }
    },
    []
  );

  const fetchDashboardData = useCallback(
    async (userData?: User) => {
      try {
        const [transactions, notifications, agentCount] = await Promise.all([
          fetchUserTransactions(),
          fetchNotifications(),
          fetchAgentCount(),
        ]);

        const topAgents = agentCount > 0 ? await fetchAgentPerformance(transactions) : [];

        const today = new Date();
        const todayISO = today.toISOString().split('T')[0];

        const dailyRevenue = transactions
          .filter((tx) => {
            const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
            return txDate === todayISO && tx.status === 'Completed';
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        setDashboardData({
          balance: userData?.balance || 0,
          dailyRevenue,
          numberOfAgents: agentCount,
          growth: {
            revenue: 8.5,
            agents: 12,
          },
          recentTransactions: transactions.slice(0, 5),
          topAgents: topAgents,
          notifications: notifications.slice(0, 3),
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      }
    },
    [
      fetchUserTransactions,
      fetchNotifications,
      fetchAgentCount,
      fetchAgentPerformance,
    ]
  );

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const notifications = await fetchNotifications();
      setDashboardData((prev) => ({
        ...prev,
        notifications: notifications.slice(0, 3),
      }));
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
          await fetchDashboardData(auth.user);
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

        await fetchDashboardData(profile);
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