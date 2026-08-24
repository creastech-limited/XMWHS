// src/hooks/useViewStudentTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentById, getFeesForStudent } from '../services';
import type { Student, SchoolFee, Bill, TransactionSummary } from '../types/student';

interface ViewStudentTransactionsState {
  student: (Student & { fullName?: string }) | null;
  bills: Bill[];
  loading: boolean;
  loadingFees: boolean;
  error: string | null;
}

export const useViewStudentTransactions = () => {
  const { _id: studentIdFromUrl } = useParams<{ _id: string }>();
  const auth = useAuth();

  const [state, setState] = useState<ViewStudentTransactionsState>({
    student: null,
    bills: [],
    loading: true,
    loadingFees: false,
    error: null,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      setSnackbar({ open: true, message, severity });
      setTimeout(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 5000);
    },
    []
  );

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const getAuthToken = useCallback((): string | null => {
    try {
      if (auth?.token) {
        return auth.token;
      }
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        return storedToken;
      }
      return null;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }, [auth?.token]);

  const transformFeesToBills = useCallback((fees: SchoolFee[]): Bill[] => {
    return fees.map((fee) => {
      const amount = fee.amount || 0;
      const amountPaid = fee.amountPaid || 0;

      return {
        id: fee._id,
        _id: fee._id,
        feeId: fee.feeId,
        description: fee.feeType || 'School Fee',
        amount: amount,
        amountPaid: amountPaid,
        remainingAmount: amount - amountPaid,
        dueDate: fee.paymentDate
          ? new Date(fee.paymentDate).toLocaleDateString()
          : 'N/A',
        status: fee.status?.toLowerCase() === 'paid' ? 'paid' : 'unpaid',
        term: fee.term || 'N/A',
        session: fee.session || 'N/A',
        transactionId: fee.transactionId || 'N/A',
      };
    });
  }, []);

  const loadStudentFees = useCallback(
    async (studentData: Student) => {
      try {
        if (!studentData.email) {
          showSnackbar('Student email not found. Cannot fetch fees.', 'error');
          return;
        }

        setState(prev => ({ ...prev, loadingFees: true }));

        const studentFees = await getFeesForStudent(studentData.email);
        const transformedBills = transformFeesToBills(studentFees);

        setState(prev => ({ ...prev, bills: transformedBills }));

        if (transformedBills.length === 0) {
          showSnackbar(`No fees found for ${studentData.firstName} ${studentData.lastName}`, 'info');
        }
      } catch (error) {
        console.error('Error loading student fees:', error);
        showSnackbar('Failed to load student transactions', 'error');
        setState(prev => ({ ...prev, error: 'Failed to load transactions' }));
      } finally {
        setState(prev => ({ ...prev, loadingFees: false }));
      }
    },
    [transformFeesToBills, showSnackbar]
  );

  const initializeData = useCallback(async () => {
    if (!studentIdFromUrl) {
      setState(prev => ({ ...prev, loading: false, error: 'No student ID provided' }));
      showSnackbar('No student ID provided', 'error');
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const studentData = await getStudentById(studentIdFromUrl);

      if (studentData) {
        const processedStudent: Student & { fullName: string } = {
          _id: studentData._id,
          name: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          fullName: studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          email: studentData.email || '',
          phone: studentData.phone || '',
          status: (studentData.status as 'Active' | 'Inactive' | 'Pending') || 'Pending',
          student_id: studentData._id,
          schoolId: '',
          Class: studentData.class || '',
          classAdmittedTo: studentData.academicDetails?.classAdmittedTo || studentData.class || '',
          academicDetails: studentData.academicDetails || { classAdmittedTo: '' },
          createdAt: studentData.createdAt || '',
          updatedAt: '',
          registrationDate: '',
          isPinSet: false,
          isFirstLogin: false,
          studentCanTopup: false,
          studentCanTransfer: false,
          studentCanWithdraw: false,
          studentCanPayBill: false,
        };

        setState(prev => ({ ...prev, student: processedStudent }));
        await loadStudentFees(processedStudent);
      } else {
        setState(prev => ({ ...prev, error: 'Student not found' }));
        showSnackbar('Student not found', 'error');
      }
    } catch (error) {
      console.error('Data initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setState(prev => ({ ...prev, error: errorMessage }));
      showSnackbar('Failed to load data. Please login again.', 'error');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [studentIdFromUrl, getAuthToken, loadStudentFees, showSnackbar]);

  // Calculate summary
  const calculateSummary = useCallback((): TransactionSummary => {
    const total = state.bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = state.bills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    return { total, paid, remaining: total - paid };
  }, [state.bills]);

  // Auto-hide snackbar
  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 5000);
    return () => clearTimeout(timer);
  }, [snackbar.open]);

  // Initialize
  useEffect(() => {
    if (studentIdFromUrl) {
      initializeData();
    }
  }, [initializeData, studentIdFromUrl]);

  return {
    ...state,
    snackbar,
    summary: calculateSummary(),
    studentIdFromUrl,
    closeSnackbar,
    showSnackbar,
    initializeData,
  };
};