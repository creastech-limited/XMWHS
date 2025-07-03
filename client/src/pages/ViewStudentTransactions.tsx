import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://nodes-staging-xp.up.railway.app';

// Define TypeScript interfaces
interface Student {
  _id: string;
  student_id?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  className?: string;
  schoolId?: string;
  parentId?: string;
  role?: string;
  phone?: string;
}

interface SchoolFee {
  _id: string;
  studentId: string;
  feeId: string;
  amount: number;
  feeType: string;
  term: string;
  session: string;
  className: string;
  schoolId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionId: string;
  status: 'Paid' | 'Unpaid' | 'partial';
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface Bill {
  id: string;
  _id: string;
  feeId: string;
  description: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
  term: string;
  session: string;
  transactionId: string;
}

interface Summary {
  total: number;
  paid: number;
  remaining: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Fetch fees for a student by email
const fetchFeesForStudent = async (
  authToken: string,
  email: string
): Promise<SchoolFee[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/fee/getFeeForStudent/${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // The API may return { success, data: [...] } or just an array
    if (Array.isArray(data)) {
      return data as SchoolFee[];
    } else if (Array.isArray(data?.data)) {
      return data.data as SchoolFee[];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching fees for student:', error);
    return [];
  }
};

const ViewStudentTransactions: React.FC = () => {
  const { _id: studentIdFromUrl } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingFees, setLoadingFees] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const auth = useAuth();

  // Show snackbar message
  const showSnackbar = useCallback(
    (message: string, severity: SnackbarState['severity'] = 'info') => {
      setSnackbar({ open: true, message, severity });
      setTimeout(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 5000);
    },
    []
  );

  // Get authentication token
  const getAuthToken = useCallback((): string => {
    try {
      if (auth?.token) {
        return auth.token;
      }

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        return storedToken;
      }

      throw new Error('No authentication token found');
    } catch (error) {
      console.error('Token retrieval error:', error);
      showSnackbar(
        'Authentication token not found. Please login again.',
        'error'
      );
      return '';
    }
  }, [auth?.token, showSnackbar]);

  // Fetch single student by ID
  const fetchStudentById = useCallback(
    async (authToken: string, _Id: string): Promise<Student | null> => {
      try {
        console.log(`Fetching student with ID: ${_Id}`);

        const response = await fetch(
          `${API_BASE_URL}/api/users/getuser/${_Id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw student API response:', data);

        let studentData: Student | null = null;

        if (data?.data) {
          studentData = data.data;
        } else if (data?.user) {
          studentData = data.user;
        } else if (data) {
          studentData = data;
        }

        if (!studentData?._id) {
          throw new Error('Invalid student data structure received');
        }

        // Process the student data
        const processedStudent: Student = {
          _id: studentData.student_id || studentData._id,
          student_id: studentData.student_id,
          firstName: studentData.firstName || 'Unknown',
          lastName: studentData.lastName || '',
          fullName:
            studentData.fullName ||
            `${studentData.firstName || 'Unknown'} ${studentData.lastName || ''}`.trim(),
          email: studentData.email || '',
          className: studentData.className || 'No Class', // Updated this line
          schoolId: studentData.schoolId,
          parentId: studentData.parentId,
          role: studentData.role,
          phone: studentData.phone,
        };

        console.log('Processed student:', processedStudent);
        return processedStudent;
      } catch (error) {
        console.error('Error fetching student:', error);
        showSnackbar('Failed to fetch student. Please try again.', 'error');
        return null;
      }
    },
    [showSnackbar]
  );

  // Transform fees to bills format
  const transformFeesToBills = useCallback((fees: SchoolFee[]): Bill[] => {
    return fees.map((fee) => ({
      id: fee._id,
      _id: fee._id,
      feeId: fee.feeId,
      description: fee.feeType || 'School Fee',
      amount: fee.amount || 0,
      amountPaid: fee.amountPaid || 0,
      dueDate: fee.paymentDate
        ? new Date(fee.paymentDate).toLocaleDateString()
        : 'N/A',
      status: fee.status?.toLowerCase() === 'paid' ? 'paid' : 'unpaid',
      term: fee.term || 'N/A',
      session: fee.session || 'N/A',
      transactionId: fee.transactionId || 'N/A',
    }));
  }, []);

  // Load fees for student
  const loadStudentFees = useCallback(
    async (studentData: Student) => {
      try {
        console.log(`Loading fees for student:`, studentData);

        if (!studentData.email) {
          console.error('Student email not found');
          showSnackbar('Student email not found. Cannot fetch fees.', 'error');
          return;
        }

        setLoadingFees(true);

        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token found');
        }

        const studentFees = await fetchFeesForStudent(
          authToken,
          studentData.email
        );
        console.log('Fetched fees for student:', studentFees);

        const transformedBills = transformFeesToBills(studentFees);
        console.log('Transformed bills:', transformedBills);

        setBills(transformedBills);

        if (transformedBills.length === 0) {
          showSnackbar(`No fees found for ${studentData.fullName}`, 'info');
        } else {
          showSnackbar(
            `Loaded ${transformedBills.length} transactions for ${studentData.fullName}`,
            'success'
          );
        }
      } catch (error) {
        console.error('Error loading student fees:', error);
        showSnackbar('Failed to load student transactions', 'error');
      } finally {
        setLoadingFees(false);
      }
    },
    [transformFeesToBills, showSnackbar, getAuthToken]
  );

  // Initialize data - Only run once when component mounts
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('Starting data initialization...');

        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token found');
        }

        // Only fetch if we have a student ID in the URL
        if (studentIdFromUrl) {
          const studentData = await fetchStudentById(
            authToken,
            studentIdFromUrl
          );
          if (studentData) {
            setStudent(studentData);
            await loadStudentFees(studentData);
          } else {
            showSnackbar('Student not found', 'error');
          }
        } else {
          showSnackbar('No student ID provided', 'error');
        }
      } catch (error) {
        console.error('Data initialization error:', error);
        showSnackbar('Failed to load data. Please login again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Only initialize if we haven't already loaded the student
    if (!student && studentIdFromUrl) {
      initializeData();
    }
  }, [studentIdFromUrl]); // Only depend on studentIdFromUrl

  // Calculate summary
  const calculateSummary = (): Summary => {
    const total = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = bills.reduce((sum, bill) => sum + bill.amountPaid, 0);

    return {
      total,
      paid,
      remaining: total - paid,
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student transactions...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header profilePath="/settings"/>

          <div className="flex flex-grow overflow-hidden">
            <Sidebar />

            <div className="flex-grow md:ml-64 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
                <div className="flex flex-col items-center justify-center py-16">
                  <UserIcon className="h-16 w-16 text-red-300 mb-4" />
                  <p className="text-gray-500 text-lg">Student not found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Please check the student ID and try again
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header profilePath="/settings"/>
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-none">
          <Sidebar />
        </aside>
        <main className="flex-1 p-4 md:p-6 overflow-hidden md:ml-64">
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-indigo-600">
              Student Transactions
            </h1>
            <p className="text-center text-gray-600 mb-8">
              View and manage student fee transactions
            </p>

            {loadingFees && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            )}

            {student && !loadingFees && (
              <>
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-900">
                        {student.fullName}
                      </h3>
                      <p className="text-sm text-indigo-600">
                        Class: {student.className}
                      </p>
                      {student.email && (
                        <p className="text-xs text-indigo-500">
                          {student.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Bills</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ₦{summary.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {bills.length} transaction(s)
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm text-gray-500 mb-1">Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{summary.paid.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {summary.total > 0
                        ? ((summary.paid / summary.total) * 100).toFixed(0)
                        : 0}
                      % of total
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm text-gray-500 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₦{summary.remaining.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Outstanding balance
                    </p>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {student.fullName}'s Transactions
                </h2>
                <hr className="mb-6" />

                {bills.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {bills.map((bill) => (
                      <div
                        key={bill.id}
                        className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md
                            ${bill.status === 'paid' ? 'border-2 border-green-500' : 'border border-gray-100'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-800">
                                {bill.description}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                              <p className="text-sm text-gray-500">
                                {bill.status === 'paid' ? 'Paid on' : 'Due'}:{' '}
                                {bill.dueDate}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {bill.term} - {bill.session}
                            </p>
                          </div>
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                              ${
                                bill.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            `}
                          >
                            {bill.status === 'paid' ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3" /> Paid
                              </>
                            ) : (
                              <>
                                <ExclamationCircleIcon className="h-3 w-3" />{' '}
                                Unpaid
                              </>
                            )}
                          </span>
                        </div>
                        <hr className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Total Amount
                            </p>
                            <p className="text-lg font-semibold text-gray-800">
                              ₦{bill.amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount Paid</p>
                            <p className="text-lg font-semibold text-green-600">
                              ₦{bill.amountPaid.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-lg font-semibold">
                              {bill.status === 'paid' ? (
                                <span className="text-green-600">Paid</span>
                              ) : (
                                <span className="text-red-600">Unpaid</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {bill.transactionId !== 'N/A' && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500">
                              Transaction ID
                            </p>
                            <p className="text-sm font-mono text-gray-700">
                              {bill.transactionId}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">
                      No transactions found for {student.fullName}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Transactions will appear here when payments are made
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />

      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg shadow-lg px-6 py-4 z-50 max-w-md
          ${
            snackbar.severity === 'success'
              ? 'bg-green-500'
              : snackbar.severity === 'error'
                ? 'bg-red-500'
                : snackbar.severity === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
          } 
          text-white flex items-center gap-2 animate-slide-in`}
        >
          <div className="flex items-center gap-2 flex-1">
            {snackbar.severity === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm">{snackbar.message}</p>
          </div>
          <button
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            className="ml-2 text-white hover:text-gray-200 flex-shrink-0 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewStudentTransactions;
