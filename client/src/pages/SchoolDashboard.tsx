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
  _id?: string;
  date: string;
  createdAt?: string;
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

interface Student {
  _id: string;
  classLevel: string;
  createdAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth?.user || null);
  // Removed unused token state
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    walletBalance: 0,
    totalStudents: 0,
    totalStores: 0,
  });

  const [pieData, setPieData] = useState<PieDataEntry[]>([]);
  const [barData, setBarData] = useState<BarDataEntry[]>([]);
  const [attendanceData, setAttendanceData] = useState<LineDataEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topPayingClasses, setTopPayingClasses] = useState<{name: string, percentage: number}[]>([]);
  const [feeCollectionStatus, setFeeCollectionStatus] = useState({
    collected: 0,
    expected: 0,
    percentage: 0
  });

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
      // setToken(null); // Removed unused token state
    },
    [auth]
  );

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
        // setToken(authToken); // Removed unused token state
        auth?.login?.(profile, authToken);
        return profile;
      } catch (error) {
        console.error('Error fetching user details:', error);
        throw error;
      }
    },
    [auth]
  );

  // Fetch students data for distribution
  const fetchStudentsData = useCallback(async (userId: string, authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getstudentbyid?id=${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      
      // Process students data for pie chart (class distribution)
      if (data.data && Array.isArray(data.data)) {
        const classDistribution: Record<string, number> = {};
        
        data.data.forEach((student: Student) => {
          const classLevel = student.classLevel || 'Unknown';
          classDistribution[classLevel] = (classDistribution[classLevel] || 0) + 1;
        });
        
        // Convert to pie data format
        const pieColors = ['#42a5f5', '#66bb6a', '#ffca28', '#ef5350', '#ab47bc', '#26c6da'];
        const pieData = Object.entries(classDistribution).map(([name, value], index) => ({
          name,
          value,
          color: pieColors[index % pieColors.length]
        }));
        
        setPieData(pieData);
        setStats(prev => ({...prev, totalStudents: data.data.length}));
        
        // Calculate registration rate (last 5 days)
        const today = new Date();
        const last5Days = Array.from({length: 5}, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();
        
        const registrationRate = last5Days.map((date, idx) => {
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          // Calculate percentage of total (simplified for demo)
          const percentage = Math.min(100, Math.max(80, 90 - idx * 2 + Math.random() * 5));
          
          return {
            name: dayNames[idx],
            attendance: percentage
          };
        });
        
        setAttendanceData(registrationRate);
      }
    } catch (error) {
      console.error('Error fetching students data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load student data',
        severity: 'error'
      });
    }
  }, []);

  // Fetch transactions data
  const fetchTransactionsData = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Process recent transactions
        const recentTransactions = data.data
          .slice(0, 4)
          .map((tx: Transaction) => ({
            id: tx.id || tx._id,
            date: tx.date || tx.createdAt,
            description: tx.description || 'Transaction',
            amount: tx.amount,
            type: tx.type === 'credit' ? 'credit' : 'debit'
          }));
        
        setTransactions(recentTransactions);
        
        // Process fee collection trend (last 6 months)
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const last6Months = Array.from({length: 6}, (_, i) => {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          return {
            month: monthNames[date.getMonth()],
            year: date.getFullYear()
          };
        }).reverse();
        
        const feeData = last6Months.map(({month, year}) => {
          const monthlyTotal = data.data
            .filter((tx: Transaction) => 
              new Date(tx.createdAt ?? tx.date).getMonth() === monthNames.indexOf(month) &&
              new Date(tx.createdAt ?? tx.date).getFullYear() === year &&
              tx.type === 'credit'
            )
            .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
          
          return {
            month,
            fees: monthlyTotal
          };
        });
        
        setBarData(feeData);
        
        // Calculate top paying classes (mock data based on transactions)
        const mockTopPaying = [
          { name: 'Primary 5A', percentage: 92 },
          { name: 'Secondary 2B', percentage: 89 },
          { name: 'Nursery 3', percentage: 85 }
        ];
        setTopPayingClasses(mockTopPaying);
        
        // Calculate fee collection status
        const totalExpected = 1200000; // Mock expected amount
        const totalCollected = feeData.reduce((sum, month) => sum + month.fees, 0);
        const collectionPercentage = Math.round((totalCollected / totalExpected) * 100);
        
        setFeeCollectionStatus({
          collected: totalCollected,
          expected: totalExpected,
          percentage: collectionPercentage
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load transaction data',
        severity: 'error'
      });
    }
  }, []);

  // initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Already in context?
        if (auth?.user?._id && auth?.token) {
          setUser(auth.user);
          setToken(auth.token);
          setLoading(false);
          return;
        }

        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }

        // Always fetch user from API to ensure fresh data
        const profile = await fetchUserDetails(storedToken);
        
        // After successful auth, fetch all data
        if (profile._id) {
          await Promise.all([
            fetchStudentsData(profile._id, storedToken),
            fetchTransactionsData(storedToken)
          ]);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthError('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth, fetchUserDetails, fetchStudentsData, fetchTransactionsData, handleAuthError]);

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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-grow">
          <div className="z-[100] hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow z-10">
            <Asidebar />
          </div>
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
          <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
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
                    {pieData.length > 0 ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No student data available</p>
                      </div>
                    )}
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
                    {barData.length > 0 ? (
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
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No fee data available</p>
                      </div>
                    )}
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

                {/* More detailed stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Top Paying Class
                    </h3>
                    <div className="space-y-3">
                      {topPayingClasses.map((cls, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex justify-between">
                            <p className="text-sm text-gray-600">{cls.name}</p>
                            <p className="text-sm font-medium">{cls.percentage}%</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${cls.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Fee Collection Status
                    </h3>
                    <div className="flex items-center justify-center h-32">
                      <div className="relative inline-flex">
                        <div className="w-24 h-24 rounded-full border-8 border-indigo-200"></div>
                        <div 
                          className="absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-indigo-600 border-t-transparent transform rotate-45"
                          style={{
                            transform: `rotate(${feeCollectionStatus.percentage * 3.6}deg)`
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-800">
                            {feeCollectionStatus.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Total Expected: ₦{feeCollectionStatus.expected.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Collected: ₦{feeCollectionStatus.collected.toLocaleString()}
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

function setToken(token: string) {
  localStorage.setItem('token', token);
}

export default Dashboard;

