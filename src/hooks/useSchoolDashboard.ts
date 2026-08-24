// src/hooks/useSchoolDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserDetails,
  getStoreCount,
  getClasses,
  getUserTransactions,
  getStudentsBySchoolId,
} from '../services';
import type {
  User,
  UserResponse,
  StoreCountResponse,
  ClassesResponse,
  TransactionsResponse,
  Transaction as TransactionType,
  ClassItem
} from '../types/user';
import type {
  Stats,
  PieDataEntry,
  BarDataEntry,
  Transaction,
  SnackbarState
} from '../types/dashboard';

export const useSchoolDashboard = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth?.user || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    balance: 0,
    totalStudents: 0,
    totalStores: 0,
  });
  const [pieData, setPieData] = useState<PieDataEntry[]>([]);
  const [barData, setBarData] = useState<BarDataEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleAuthError = useCallback((message: string) => {
    setAuthError(message);
    showSnackbar(message, 'error');
    auth?.logout?.();
    setUser(null);
  }, [auth, showSnackbar]);

  const fetchUserDetails = useCallback(async (): Promise<User> => {
    try {
      const data: UserResponse = await getUserDetails();

      let profile: User | undefined;
      let userBalance: number = 0;

      if (data.user?.data) {
        profile = data.user.data;
        if (data.user.wallet?.balance !== undefined) userBalance = data.user.wallet.balance;
      } else if (data.data) {
        profile = data.data;
        if (data.wallet?.balance !== undefined) userBalance = data.wallet.balance;
      } else if (data.user) {
        profile = data.user as User;
        if (data.user.wallet?.balance !== undefined) userBalance = data.user.wallet.balance;
      } else {
        profile = data as User;
        if (data.wallet?.balance !== undefined) userBalance = data.wallet.balance;
      }

      if (typeof userBalance === 'string') userBalance = parseFloat(userBalance) || 0;
      if (!profile?._id) throw new Error('Invalid user payload');

      const updatedProfile = { ...profile, balance: userBalance };
      setUser(updatedProfile);

      const extractedSchoolId = profile._id || '';
      if (extractedSchoolId) {
        setSchoolId(extractedSchoolId);
      }

      setStats(prevStats => ({ ...prevStats, balance: userBalance }));
      return updatedProfile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }, []);

  const fetchStoreCount = useCallback(async () => {
    try {
      const data: StoreCountResponse = await getStoreCount();

      let storeCount = 0;
      if (typeof data.data === 'number') {
        storeCount = data.data;
      } else if (data.count !== undefined) {
        storeCount = data.count;
      } else if (data.totalStores !== undefined) {
        storeCount = data.totalStores;
      }

      setStats(prev => ({ ...prev, totalStores: storeCount }));
    } catch (error) {
      console.error('Error fetching store count:', error);
      showSnackbar('Failed to load store count', 'error');
    }
  }, [showSnackbar]);

  const fetchStudentsData = useCallback(async (id: string) => {
    if (!id) return;

    try {
      const studentsData = await getStudentsBySchoolId(id);

      if (studentsData?.data && Array.isArray(studentsData.data)) {
        setStats(prev => ({ ...prev, totalStudents: (studentsData.data?.length ?? 0) }));
        
        const classesData: ClassesResponse = await getClasses();

        if (classesData?.data && Array.isArray(classesData.data)) {
          const pieColors = ['#42a5f5', '#66bb6a', '#ffca28', '#ef5350', '#ab47bc', '#26c6da'];

          const schoolClasses = (classesData.data as ClassItem[]).filter(
            (classItem: ClassItem) => classItem.schoolId === id
          );

          const pieChartData: PieDataEntry[] = schoolClasses
            .filter((classItem: ClassItem) => classItem.className)
            .map((classItem: ClassItem, index: number): PieDataEntry => ({
              name: classItem.className,
              value: classItem.students?.length || 0,
              color: pieColors[index % pieColors.length],
            }));

          setPieData(pieChartData);
        }
      }
    } catch (error) {
      console.error('Error fetching students data:', error);
      showSnackbar('Failed to load student data', 'error');
    }
  }, [showSnackbar]);

  const fetchTransactionsData = useCallback(async () => {
    try {
      const data: TransactionsResponse = await getUserTransactions();

      if (data.data && Array.isArray(data.data)) {
        const recentTransactions = data.data
          .slice(0, 4)
          .map((tx: TransactionType) => {
            let transactionType: 'credit' | 'debit' | 'pending' = 'debit';

            if (tx.status === 'pending') {
              transactionType = 'pending';
            } else if (tx.category === 'credit') {
              transactionType = 'credit';
            } else if (tx.category === 'debit') {
              transactionType = 'debit';
            }

            return {
              id: tx._id,
              date: tx.createdAt,
              description: tx.description || tx.category || 'Transaction',
              category: tx.category || 'Transaction',
              amount: tx.amount,
              type: transactionType,
              status: tx.status,
            };
          });

        setTransactions(recentTransactions);

        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          return {
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
          };
        }).reverse();

        const feeData = last6Months.map(({ month, year, monthIndex }) => {
          const monthlyTotal = (data.data ?? [])
            .filter((tx: TransactionType) => {
              const txDate = new Date(tx.createdAt ?? '');
              const isCredit = tx.category === 'credit';
              return txDate.getMonth() === monthIndex && txDate.getFullYear() === year && isCredit;
            })
            .reduce((sum: number, tx: TransactionType) => sum + (tx.amount || 0), 0);

          return { month, fees: monthlyTotal };
        });

        setBarData(feeData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showSnackbar('Failed to load transaction data', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        const storedToken = localStorage.getItem('token');
        if (!storedToken && !auth?.token) {
          throw new Error('No authentication token found');
        }

        const profile = await fetchUserDetails();
        const id = profile._id || '';

        if (profile._id) {
          await Promise.all([
            fetchStudentsData(id),
            fetchTransactionsData(),
            fetchStoreCount(),
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
  }, [auth?.token, fetchUserDetails, fetchStudentsData, fetchTransactionsData, fetchStoreCount, handleAuthError]);

  // Auto-hide snackbar
  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 6000);
    return () => clearTimeout(timer);
  }, [snackbar.open]);

  return {
    user,
    loading,
    authError,
    schoolId,
    stats,
    pieData,
    barData,
    transactions,
    calendarDate,
    snackbar,
    setCalendarDate,
    closeSnackbar,
  };
};