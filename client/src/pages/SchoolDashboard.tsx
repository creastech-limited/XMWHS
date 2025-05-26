import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaWallet, FaUsers, FaStore, FaCalendarAlt } from 'react-icons/fa';

interface Stats {
  walletBalance: number;
  totalStudents: number;
  totalStores: number;
}

interface PieDataEntry {
  name: string;
  value: number;
  color: string;
}

interface BarDataEntry {
  month: string;
  fees: number;
}

interface LineDataEntry {
  name: string;
  attendance: number;
}

type SnackbarSeverity = 'success' | 'error';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  [key: string]: unknown;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth?.user || null);
  const [token, setToken] = useState<string | null>(auth?.token || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    walletBalance: 0,
    totalStudents: 0,
    totalStores: 0,
  });

  // static chart data
  const pieData: PieDataEntry[] = [
    { name: 'Nursery', value: 300, color: '#42a5f5' },
    { name: 'Primary', value: 500, color: '#66bb6a' },
    { name: 'Secondary', value: 200, color: '#ffca28' },
  ];
  const barData: BarDataEntry[] = [
    { month: 'Jan', fees: 400 },
    { month: 'Feb', fees: 300 },
    { month: 'Mar', fees: 500 },
    { month: 'Apr', fees: 200 },
    { month: 'May', fees: 350 },
    { month: 'Jun', fees: 450 },
  ];
  const attendanceData: LineDataEntry[] = [
    { name: 'Mon', attendance: 88 },
    { name: 'Tue', attendance: 92 },
    { name: 'Wed', attendance: 85 },
    { name: 'Thu', attendance: 93 },
    { name: 'Fri', attendance: 90 },
  ];

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-05-12',
      description: 'School Fees Payment - John Doe',
      amount: 25000,
      type: 'credit',
    },
    {
      id: '2',
      date: '2025-05-10',
      description: 'Book Store Purchase',
      amount: 5000,
      type: 'debit',
    },
    {
      id: '3',
      date: '2025-05-07',
      description: 'School Fees Payment - Jane Smith',
      amount: 30000,
      type: 'credit',
    },
    {
      id: '4',
      date: '2025-05-05',
      description: 'Stationery Supplies',
      amount: 7500,
      type: 'debit',
    },
  ]);

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>(
    'overview'
  );

  // Show error and logout
  const handleAuthError = useCallback(
    (message: string) => {
      setAuthError(message);
      setSnackbar({ open: true, message, severity: 'error' });
      auth?.logout?.();
      setUser(null);
      setToken(null);
    },
    [auth]
  );
  console.log('Auth token:', auth);

  // fetch current user from API
  interface UserProfileResponse {
    user?: {
      data?: User;
    };
    data?: User;
  }

  type FetchUserDetails = (authToken: string) => Promise<User>;

  const fetchUserDetails: FetchUserDetails = useCallback(
    async (authToken: string): Promise<User> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);

        const data: UserProfileResponse = await res.json();
        console.log('User API response:', data); // Debug the actual response structure

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

        if (!profile?._id) throw new Error('Invalid user payload');

        setUser(profile);
        setToken(authToken);
        auth?.login?.(profile, authToken);
        return profile;
      } catch (error) {
        console.error('Error fetching user details:', error);
        throw error;
      }
    },
    [auth]
  );

  // initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Starting auth initialization...');

        // Already in context?
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          setUser(auth.user);
          setToken(auth.token);
          setLoading(false);
          return;
        }

        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token in localStorage');
          throw new Error('No authentication token found');
        }

        console.log('Found token in localStorage:', storedToken);

        // Always fetch user from API to ensure fresh data
        console.log('Fetching user from API...');
        const profile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', profile);
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth, fetchUserDetails, handleAuthError]);

  // fetch stats
  useEffect(() => {
    if (!token) {
      console.log('No token available for stats');
      return;
    }

    if (!user?._id) {
      console.log('No user ID available for stats');
      return;
    }

    console.log('Starting stats fetch with user ID:', user._id);

    (async () => {
      try {
        setLoading(true);
        const [stu, store, wallet] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/users/getstudentbyidcount?id=${user._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(`${API_BASE_URL}/api/users/getstorebyidcount?id=${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/wallet/getuserwallet`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!stu.ok) throw new Error(`Student fetch failed: ${stu.status}`);
        if (!store.ok) throw new Error(`Store fetch failed: ${store.status}`);
        if (!wallet.ok)
          throw new Error(`Wallet fetch failed: ${wallet.status}`);

        const stuData = await stu.json();
        const storeData = await store.json();
        const walletData = await wallet.json();

        console.log('Stats data:', { stuData, storeData, walletData });

        setStats({
          walletBalance: walletData.balance || 0,
          totalStudents: stuData.data || 0,
          totalStores: storeData.data || 0,
        });

        setSnackbar({
          open: true,
          message: 'Data loaded',
          severity: 'success',
        });
      } catch (error) {
        console.error('Stats fetch error:', error);
        setSnackbar({
          open: true,
          message:
            error instanceof Error ? error.message : 'Failed to load stats',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user?._id, token]);

  // auto-hide snackbar
  useEffect(() => {
    if (!snackbar.open) return;
    const t = setTimeout(
      () => setSnackbar((s) => ({ ...s, open: false })),
      6000
    );
    return () => clearTimeout(t);
  }, [snackbar.open]);

  // redirect on error
  useEffect(() => {
    if (authError) setTimeout(() => (window.location.href = '/login'), 3000);
  }, [authError]);

  if (loading)
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-grow bg-gray-100">
          <Asidebar />
          <main className="flex-1 p-4 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-r-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-indigo-800">Loading...</p>
          </main>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-grow">
        <aside className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow z-10">
          <Asidebar />
        </aside>

        <main className="flex-grow p-4 md:p-8 md:ml-64">
          {/* Top Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">
                  School Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back,{' '}
                  {user && user.name ? user.name : 'Administrator'}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 font-medium text-sm flex items-center border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 font-medium text-sm flex items-center border-b-2 ${
                    activeTab === 'details'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Detailed Analysis
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                    <FaWallet className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Wallet Balance
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                      ₦{stats.walletBalance.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +5.3% from last month
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start">
                  <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                    <FaUsers className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Total Students
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.totalStudents.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +12 new this week
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start">
                  <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                    <FaStore className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Total Stores
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.totalStores.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +2 new this month
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Student Distribution
                    </h3>
                    <select
                      className="text-sm border border-gray-300 rounded p-1 bg-white text-gray-600"
                      aria-label="Student distribution period"
                    >
                      <option>This Year</option>
                      <option>Last Year</option>
                    </select>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartTooltip
                          content={({ payload, label }) => (
                            <div className="bg-white p-2 shadow rounded text-sm">
                              <p>{label}</p>
                              {payload?.map((entry, index) => (
                                <p key={index} style={{ color: entry.color }}>
                                  {entry.name}: {entry.value}
                                </p>
                              ))}
                            </div>
                          )}
                        />
                        <Legend verticalAlign="bottom" layout="horizontal" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Fee Collection Trend
                    </h3>
                    <select
                      className="text-sm border border-gray-300 rounded p-1 bg-white text-gray-600"
                      aria-label="Fee collection period"
                    >
                      <option>Last 6 Months</option>
                      <option>This Year</option>
                    </select>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barData}
                        margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <RechartTooltip />
                        <Bar
                          dataKey="fees"
                          fill="#6366f1"
                          radius={[6, 6, 0, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Transactions & Calendar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => (window.location.href = '/transactions')}
                      className="text-indigo-600 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-72">
                    {transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex justify-between items-center p-3 hover:bg-gray-50 rounded"
                          >
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-full mr-3 ${transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                              >
                                <FaWallet className="text-sm" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {transaction.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    transaction.date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p
                              className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {transaction.type === 'credit' ? '+' : '-'}₦
                              {transaction.amount.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-8">
                        No transactions available.
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      School Calendar
                    </h3>
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                      <FaCalendarAlt className="text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-center text-black">
                    <Calendar
                      onChange={(value) => {
                        if (value instanceof Date) {
                          setCalendarDate(value);
                        } else if (
                          Array.isArray(value) &&
                          value[0] instanceof Date
                        ) {
                          setCalendarDate(value[0]);
                        }
                      }}
                      value={calendarDate}
                      className="react-calendar rounded-lg w-full border-0 shadow-none"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Detailed Analysis Tab */}
              <div className="grid grid-cols-1 gap-6">
                {/* Weekly Attendance Chart */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Student Registration Rate
                    </h3>
                    <select
                      className="text-gray-500 text-sm border border-gray-300 rounded p-1 bg-white"
                      aria-label="Student registration rate period"
                    >
                      <option>This Week</option>
                      <option>Last Week</option>
                    </select>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={attendanceData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[75, 100]}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartTooltip />
                        <Line
                          type="monotone"
                          dataKey="attendance"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* More detailed stats could go here */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Top Paying Class
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Primary 5A</p>
                        <p className="text-sm font-medium">92%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: '92%' }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Secondary 2B</p>
                        <p className="text-sm font-medium">89%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: '89%' }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Nursery 3</p>
                        <p className="text-sm font-medium">85%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: '85%' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Fee Collection Status
                    </h3>
                    <div className="flex items-center justify-center h-32">
                      <div className="relative inline-flex">
                        <div className="w-24 h-24 rounded-full border-8 border-indigo-200"></div>
                        <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-indigo-600 border-t-transparent transform rotate-45"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-800">
                            75%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Total Expected: ₦1,200,000
                      </p>
                      <p className="text-sm text-gray-600">
                        Collected: ₦900,000
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Upcoming Events
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start">
                          <div className="p-2 bg-indigo-100 rounded mr-3 text-center">
                            <p className="text-xs text-indigo-800 font-bold">
                              MAY
                            </p>
                            <p className="text-lg text-indigo-800 font-bold">
                              15
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              Parent-Teacher Meeting
                            </p>
                            <p className="text-xs text-gray-500">
                              3:00 PM - 5:00 PM
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-start">
                          <div className="p-2 bg-indigo-100 rounded mr-3 text-center">
                            <p className="text-xs text-indigo-800 font-bold">
                              MAY
                            </p>
                            <p className="text-lg text-indigo-800 font-bold">
                              20
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              Inter-School Sports
                            </p>
                            <p className="text-xs text-gray-500">
                              9:00 AM - 3:00 PM
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-start">
                          <div className="p-2 bg-indigo-100 rounded mr-3 text-center">
                            <p className="text-xs text-indigo-800 font-bold">
                              MAY
                            </p>
                            <p className="text-lg text-indigo-800 font-bold">
                              25
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              Cultural Day
                            </p>
                            <p className="text-xs text-gray-500">
                              10:00 AM - 1:00 PM
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <Footer />

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border-l-4 ${
            snackbar.severity === 'success'
              ? 'border-green-500'
              : 'border-red-500'
          } transition-all duration-300 z-50`}
        >
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full mr-3 ${
                snackbar.severity === 'success'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {snackbar.severity === 'success' ? '✓' : '✕'}
            </div>
            <p className="text-sm text-gray-800">{snackbar.message}</p>
          </div>
          <button
            onClick={() => setSnackbar((s) => ({ ...s, open: false }))}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
