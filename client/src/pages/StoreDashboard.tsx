import React, { useState, useEffect, useCallback } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  MoreVertical, 
  RefreshCw, 
  Wallet, 
  Users, 
  DollarSign, 
  Bell,
  UserPlus,
  Activity
} from 'lucide-react';
import StoreSidebar from '../components/StoreSidebar';
import StoreHeader from '../components/StoreHeader';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';
import { useAuth } from '../context/AuthContext';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

// Define TypeScript interfaces
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  balance?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeName?: string;
  storeType?: string;
  schoolName?: string;
  // Add other user properties as needed
  [key: string]: unknown;
}

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  type: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  balance?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeName?: string;
  storeType?: string;
  schoolName?: string;
  // Add other user properties as needed
  [key: string]: unknown;
}

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  type: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  customer: string;
}

interface Agent {
  name: string;
  sales: number;
  performance: number;
  revenue: number;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface DashboardData {
  balance: number;
  balance: number;
  dailyRevenue: number;
  numberOfAgents: number;
  growth: {
    revenue: number;
    agents: number;
  };
  recentTransactions: Transaction[];
  topAgents: Agent[];
  notifications: Notification[];
  notifications: Notification[];
}

const StoreDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    dailyRevenue: 0,
    numberOfAgents: 0,
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    dailyRevenue: 0,
    numberOfAgents: 0,
    growth: {
      revenue: 0,
      agents: 0,
      revenue: 0,
      agents: 0,
    },
    recentTransactions: [],
    topAgents: [],
    notifications: []
  });
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();

  // Error handler
  const handleAuthError = useCallback((message: string) => {
    setError(message);
    setUser(null);
    setToken(null);
    // Optionally redirect to login
    // window.location.href = '/login';
  }, []);

  // Fetch user details from API
  const fetchUserDetails = useCallback(async (authToken: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle the specific response structure from your API
      let profile: User | undefined;
      let walletData: WalletData | undefined;

      // Extract user data
      if (data.user?.data) {
        profile = data.user.data;
        walletData = data.user.wallet;
      } else if (data.data) {
        profile = data.data;
        walletData = data.wallet;
      } else {
        profile = data;
        walletData = data.wallet;
      }

      if (!profile) {
        throw new Error('Invalid user data received from API');
      }

      // Transform the data to match our User interface
      const transformedUser: User = {
        ...profile,
        _id: typeof profile['*id'] === 'string'
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
        // Extract balance from wallet data
        balance: walletData?.balance || 0
      };

      console.log('Transformed user:', transformedUser);

      if (!transformedUser._id) {
        throw new Error('Invalid user ID received from API');
      }

      return transformedUser;
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      throw error;
    }
  }, []);

  // Fetch user transactions
  const fetchUserTransactions = useCallback(async (authToken: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API data to match our Transaction interface
      const transactionsArray = (data.transactions || data.data || data || []) as Array<Record<string, unknown>>;
      const transactions: Transaction[] = transactionsArray.map((tx) => ({
        id: (typeof tx._id === 'string' ? tx._id : typeof tx.id === 'string' ? tx.id : String(tx._id || tx.id || '')).slice(-8),
        date: new Date(typeof tx.createdAt === 'string' ? tx.createdAt : typeof tx.date === 'string' ? tx.date : '').toLocaleDateString(),
        amount: typeof tx.amount === 'number' ? tx.amount : 0,
        status: typeof tx.status === 'string' ? (tx.status as Transaction['status']) : 'Pending',
        customer: typeof tx.customerName === 'string'
          ? tx.customerName
          : typeof tx.customer === 'string'
          ? tx.customer
          : 'Unknown Customer'
      }));

      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (authToken: string): Promise<Notification[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/get`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const notifications: Notification[] = (data.notifications || data.data || data || []).map((notif: Record<string, unknown>) => ({
        id: String(notif._id || notif.id || Math.random()),
        message: String(notif.message || notif.title || 'New notification'),
        type: String(notif.type || 'info'),
        createdAt: String(notif.createdAt || new Date().toISOString()),
        read: Boolean(notif.read || false)
      }));

      return notifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }, []);

  // Fetch agent count
  const fetchAgentCount = useCallback(async (authToken: string): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getagentbyidcount`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count || data.data?.count || 0;
    } catch (error) {
      console.error('Failed to fetch agent count:', error);
      return 0;
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (authToken: string, userData?: User) => {
    try {
      const [transactions, notifications, agentCount] = await Promise.all([
        fetchUserTransactions(authToken),
        fetchNotifications(authToken),
        fetchAgentCount(authToken)
      ]);

      // Calculate daily revenue from recent transactions
      const today = new Date().toLocaleDateString();
      const dailyRevenue = transactions
        .filter(tx => tx.date === today && tx.status === 'Completed')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Mock top agents data (replace with actual API call if available)
      const topAgents: Agent[] = [
        { name: 'Alice Cooper', sales: 58, performance: 94, revenue: 245000 },
        { name: 'Bob Smith', sales: 45, performance: 87, revenue: 180000 },
        { name: 'Claire Davis', sales: 42, performance: 91, revenue: 168000 },
        { name: 'Daniel Jones', sales: 38, performance: 82, revenue: 152000 },
      ];

      const currentUser = userData || user;
      const userBalance = currentUser?.balance || 0;

      setDashboardData({
        balance: userBalance,
        dailyRevenue,
        numberOfAgents: agentCount,
        growth: {
          revenue: 8.5,
          agents: 12,
        },
        recentTransactions: transactions.slice(0, 5), // Show only recent 5
        topAgents,
        notifications: notifications.slice(0, 3) // Show only recent 3
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  }, [user, fetchUserTransactions, fetchNotifications, fetchAgentCount]);

  // Authentication initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Starting auth initialization...');
        
        // Check if already in context
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          setUser(auth.user);
          setToken(auth.token);
          
          // Fetch dashboard data
          await fetchDashboardData(auth.token, auth.user);
          setLoading(false);
          return;
        }

        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token in localStorage');
          throw new Error('No authentication token found');
        }

        console.log('Found token in localStorage');
        
        // Fetch user from API to ensure fresh data
        console.log('Fetching user from API...');
        const profile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', profile);
        
        setUser(profile);
        setToken(storedToken);
        
        // Update auth context
        if (auth?.login) {
          auth.login(profile, storedToken);
        }
        
        // Fetch dashboard data
        await fetchDashboardData(storedToken, profile);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth, fetchUserDetails, fetchDashboardData, handleAuthError]);
    recentTransactions: [],
    topAgents: [],
    notifications: []
  });
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();

  // Error handler
  const handleAuthError = useCallback((message: string) => {
    setError(message);
    setUser(null);
    setToken(null);
    // Optionally redirect to login
    // window.location.href = '/login';
  }, []);

  // Fetch user details from API
  const fetchUserDetails = useCallback(async (authToken: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle the specific response structure from your API
      let profile: User | undefined;
      let walletData: WalletData | undefined;

      // Extract user data
      if (data.user?.data) {
        profile = data.user.data;
        walletData = data.user.wallet;
      } else if (data.data) {
        profile = data.data;
        walletData = data.wallet;
      } else {
        profile = data;
        walletData = data.wallet;
      }

      if (!profile) {
        throw new Error('Invalid user data received from API');
      }

      // Transform the data to match our User interface
      const transformedUser: User = {
        ...profile,
        _id: typeof profile['*id'] === 'string'
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
        // Extract balance from wallet data
        balance: walletData?.balance || 0
      };

      console.log('Transformed user:', transformedUser);

      if (!transformedUser._id) {
        throw new Error('Invalid user ID received from API');
      }

      return transformedUser;
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      throw error;
    }
  }, []);

  // Fetch user transactions
  const fetchUserTransactions = useCallback(async (authToken: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API data to match our Transaction interface
      const transactionsArray = (data.transactions || data.data || data || []) as Array<Record<string, unknown>>;
      const transactions: Transaction[] = transactionsArray.map((tx) => ({
        id: (typeof tx._id === 'string' ? tx._id : typeof tx.id === 'string' ? tx.id : String(tx._id || tx.id || '')).slice(-8),
        date: new Date(typeof tx.createdAt === 'string' ? tx.createdAt : typeof tx.date === 'string' ? tx.date : '').toLocaleDateString(),
        amount: typeof tx.amount === 'number' ? tx.amount : 0,
        status: typeof tx.status === 'string' ? (tx.status as Transaction['status']) : 'Pending',
        customer: typeof tx.customerName === 'string'
          ? tx.customerName
          : typeof tx.customer === 'string'
          ? tx.customer
          : 'Unknown Customer'
      }));

      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (authToken: string): Promise<Notification[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notification/get`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const notifications: Notification[] = (data.notifications || data.data || data || []).map((notif: Record<string, unknown>) => ({
        id: String(notif._id || notif.id || Math.random()),
        message: String(notif.message || notif.title || 'New notification'),
        type: String(notif.type || 'info'),
        createdAt: String(notif.createdAt || new Date().toISOString()),
        read: Boolean(notif.read || false)
      }));

      return notifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }, []);

  // Fetch agent count
  const fetchAgentCount = useCallback(async (authToken: string): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getagentbyidcount`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count || data.data?.count || 0;
    } catch (error) {
      console.error('Failed to fetch agent count:', error);
      return 0;
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (authToken: string, userData?: User) => {
    try {
      const [transactions, notifications, agentCount] = await Promise.all([
        fetchUserTransactions(authToken),
        fetchNotifications(authToken),
        fetchAgentCount(authToken)
      ]);

      // Calculate daily revenue from recent transactions
      const today = new Date().toLocaleDateString();
      const dailyRevenue = transactions
        .filter(tx => tx.date === today && tx.status === 'Completed')
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Mock top agents data (replace with actual API call if available)
      const topAgents: Agent[] = [
        { name: 'Alice Cooper', sales: 58, performance: 94, revenue: 245000 },
        { name: 'Bob Smith', sales: 45, performance: 87, revenue: 180000 },
        { name: 'Claire Davis', sales: 42, performance: 91, revenue: 168000 },
        { name: 'Daniel Jones', sales: 38, performance: 82, revenue: 152000 },
      ];

      const currentUser = userData || user;
      const userBalance = currentUser?.balance || 0;

      setDashboardData({
        balance: userBalance,
        dailyRevenue,
        numberOfAgents: agentCount,
        growth: {
          revenue: 8.5,
          agents: 12,
        },
        recentTransactions: transactions.slice(0, 5), // Show only recent 5
        topAgents,
        notifications: notifications.slice(0, 3) // Show only recent 3
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  }, [user, fetchUserTransactions, fetchNotifications, fetchAgentCount]);

  // Authentication initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Starting auth initialization...');
        
        // Check if already in context
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          setUser(auth.user);
          setToken(auth.token);
          
          // Fetch dashboard data
          await fetchDashboardData(auth.token, auth.user);
          setLoading(false);
          return;
        }

        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token in localStorage');
          throw new Error('No authentication token found');
        }

        console.log('Found token in localStorage');
        
        // Fetch user from API to ensure fresh data
        console.log('Fetching user from API...');
        const profile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', profile);
        
        setUser(profile);
        setToken(storedToken);
        
        // Update auth context
        if (auth?.login) {
          auth.login(profile, storedToken);
        }
        
        // Fetch dashboard data
        await fetchDashboardData(storedToken, profile);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth, fetchUserDetails, fetchDashboardData, handleAuthError]);

  // Get status badge component
  const getStatusBadge = (status: Transaction['status']) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch(status) {
      case 'Completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'Pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'Failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  // Get performance bar color
  const getPerformanceColor = (performance: number): string => {
    if (performance >= 90) return 'bg-green-500';
    if (performance >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format notification time
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format notification time
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
            {/* Header and Sidebar */}
            <StoreHeader />
            <StoreSidebar />
        

        {/* Main Content */}
        <main className="flex-1 max-w-full px-4 sm:px-6 lg:px-8 py-8 mt-6">
          {/* Welcome Message */}
          {user && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
              <p className="text-gray-600">Here's what's happening with your store today.</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Wallet Balance</p>
                  <p className="text-3xl font-bold mt-2">₦{dashboardData.balance.toLocaleString()}</p>
                  <p className="text-3xl font-bold mt-2">₦{dashboardData.balance.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Daily Revenue */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Daily Revenue</p>
                  <p className="text-3xl font-bold mt-2">₦{dashboardData.dailyRevenue.toLocaleString()}</p>
                  <p className="text-3xl font-bold mt-2">₦{dashboardData.dailyRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{dashboardData.growth.revenue}%</span>
                    <span className="text-sm">+{dashboardData.growth.revenue}%</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Number of Agents */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Number of Agents</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.numberOfAgents}</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.numberOfAgents}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+{dashboardData.growth.agents}%</span>
                    <span className="text-sm">+{dashboardData.growth.agents}%</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Refresh Transactions"
                        title="Refresh Transactions"
                        onClick={() => token && fetchDashboardData(token)}
                        onClick={() => token && fetchDashboardData(token)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="More Options"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.recentTransactions.length > 0 ? (
                        dashboardData.recentTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{transaction.id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{transaction.customer}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{transaction.date}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getStatusBadge(transaction.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      )}
                      {dashboardData.recentTransactions.length > 0 ? (
                        dashboardData.recentTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{transaction.id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{transaction.customer}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{transaction.date}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getStatusBadge(transaction.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 border-t border-gray-200 text-center">
                  <a 
                  <a 
                    href="/stransactions" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                  >
                    <span className="text-white">View All Transactions</span>
                  </a>
                  </a>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {dashboardData.notifications.filter(n => !n.read).length} New
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {dashboardData.notifications.filter(n => !n.read).length} New
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {dashboardData.notifications.length > 0 ? (
                    dashboardData.notifications.map((notification) => (
                      <div key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                        notification.type === 'warning' ? 'bg-orange-50' :
                        notification.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <div className="flex-shrink-0">
                          {notification.type === 'warning' ? (
                            <Bell className="w-5 h-5 text-orange-600" />
                          ) : notification.type === 'success' ? (
                            <UserPlus className="w-5 h-5 text-green-600" />
                          ) : (
                            <Activity className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatNotificationTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No notifications
                  {dashboardData.notifications.length > 0 ? (
                    dashboardData.notifications.map((notification) => (
                      <div key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                        notification.type === 'warning' ? 'bg-orange-50' :
                        notification.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <div className="flex-shrink-0">
                          {notification.type === 'warning' ? (
                            <Bell className="w-5 h-5 text-orange-600" />
                          ) : notification.type === 'success' ? (
                            <UserPlus className="w-5 h-5 text-green-600" />
                          ) : (
                            <Activity className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatNotificationTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No notifications
                    </div>
                  )}
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 text-center">
                  <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 0
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Top Agents
                  </button>
                  <button
                    onClick={() => setActiveTab(1)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 1
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Pending Transactions
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Agent Name</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Sales</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Performance</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.topAgents.map((agent) => (
                        {dashboardData.topAgents.map((agent) => (
                          <tr key={agent.name} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4">
                              <span className="font-medium text-gray-900">{agent.name}</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-gray-700">{agent.sales}</span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center justify-center space-x-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                                  <div 
                                    className={`h-2 rounded-full ${getPerformanceColor(agent.performance)}`}
                                    style={{ width: `${agent.performance}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-700 min-w-12">{agent.performance}%</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <span className="font-medium text-gray-900">₦{agent.revenue.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 1 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Transaction ID</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600">Amount</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.recentTransactions
                        {dashboardData.recentTransactions
                          .filter(transaction => transaction.status === 'Pending')
                          .map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4">
                                <span className="font-medium text-gray-900">{transaction.id}</span>
                              </td>
                              <td className="py-4">
                                <span className="text-gray-700">{transaction.customer}</span>
                              </td>
                              <td className="py-4">
                                <span className="text-gray-600">{transaction.date}</span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</span>
                              </td>
                              <td className="py-4 text-center">
                                {getStatusBadge(transaction.status)}
                              </td>
                              <td className="py-4 text-center">
                                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                  Process
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {dashboardData.recentTransactions.filter(tx => tx.status === 'Pending').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No pending transactions
                      </div>
                    )}
                    {dashboardData.recentTransactions.filter(tx => tx.status === 'Pending').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No pending transactions
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 text-center">
                  <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    View Full Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
  
  );
};

export default StoreDashboard;