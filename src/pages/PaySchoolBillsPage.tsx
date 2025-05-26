import React, { useState, useEffect, useCallback } from 'react';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

// Define TypeScript interfaces
interface Class {
  _id: string;
  className: string;  
  schoolId: string;
  students: string[];
  __v?: number;
  createdAt?: string;
  updatedAt?: string;
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
  status: 'Paid' | 'Unpaid';
  paymentDate: string;
  __v: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  children?: string[];
  [key: string]: unknown;
}

interface Bill {
  id: string;
  description: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
  term: string;
  session: string;
  transactionId: string;
}

interface BillsData {
  [className: string]: Bill[];
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

const PaySchoolBillsPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [bills, setBills] = useState<BillsData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Enhanced token retrieval with error handling
  const getAuthToken = useCallback((): string => {
    try {
      // First try to get from localStorage
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        return storedToken;
      }
      
      // If no token found, throw error
      throw new Error('No authentication token found');
    } catch (error) {
      console.error('Token retrieval error:', error);
      setSnackbar({
        open: true,
        message: 'Authentication token not found. Please login again.',
        severity: 'error'
      });
      return '';
    }
  }, []);

  // Enhanced user details fetching
  const fetchUserDetails = useCallback(async (authToken: string): Promise<User | null> => {
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
      
      // Handle different response structures with more robust checks
      let profile: User | null = null;
      
      if (data?.user?.data) {
        profile = data.user.data;
      } else if (data?.data) {
        profile = data.data;
      } else if (data?.user) {
        profile = data.user;
      } else if (data) {
        profile = data;
      }

      if (!profile?._id) {
        throw new Error('Invalid user data structure received');
      }

      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch user details. Please try again.',
        severity: 'error'
      });
      return null;
    }
  }, []);

  // Enhanced classes fetching
  const fetchClasses = useCallback(async (authToken: string, userId?: string): Promise<Class[]> => {
    try {
      // If we have a user with children, we might want to fetch only their classes
      const endpoint = userId 
        ? `${API_BASE_URL}/api/users/getclasse`
        : `${API_BASE_URL}/api/users/getclasse`;

      const response = await fetch(endpoint, {
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
      return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch classes. Please try again.',
        severity: 'error'
      });
      return [];
    }
  }, []);

  // Enhanced school fees fetching
  const fetchSchoolFees = useCallback(async (authToken: string, userId?: string): Promise<SchoolFee[]> => {
    try {
      // Include user ID in query if available to get only relevant fees
      const endpoint = userId
        ? `${API_BASE_URL}/api/fee/getchoolFees`
        : `${API_BASE_URL}/api/fee/getchoolFees`;

      const response = await fetch(endpoint, {
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
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching school fees:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch fees. Please try again.',
        severity: 'error'
      });
      return [];
    }
  }, []);

  // Transform fees to bills format grouped by class
  const transformFeesToBills = useCallback((fees: SchoolFee[]): BillsData => {
    const billsData: BillsData = {};

    fees.forEach((fee) => {
      if (!fee.className) return;

      const className = fee.className;
      
      if (!billsData[className]) {
        billsData[className] = [];
      }

      const bill: Bill = {
        id: fee._id,
        description: fee.feeType || 'School Fee',
        amount: fee.amount || 0,
        amountPaid: fee.amountPaid || 0,
        dueDate: fee.paymentDate ? new Date(fee.paymentDate).toISOString().split('T')[0] : 'N/A',
        status: fee.status?.toLowerCase() === 'paid' ? 'paid' : 'unpaid',
        term: fee.term || 'N/A',
        session: fee.session || 'N/A',
        transactionId: fee.transactionId || 'N/A'
      };

      billsData[className].push(bill);
    });

    return billsData;
  }, []);

  // Initialize data with proper authentication flow
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        const authToken = getAuthToken();
        if (!authToken) {
          return;
        }

        // First fetch user details
        const userDetails = await fetchUserDetails(authToken);
        
        // Then fetch classes and fees in parallel, passing user ID if available
        const [classesData, feesData] = await Promise.all([
          fetchClasses(authToken, userDetails?._id),
          fetchSchoolFees(authToken, userDetails?._id)
        ]);

        setClasses(classesData);
        
        // Transform fees to bills format
        const billsData = transformFeesToBills(feesData);
        setBills(billsData);

      } catch (error) {
        console.error('Error initializing data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data. Please refresh the page.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [getAuthToken, fetchUserDetails, fetchClasses, fetchSchoolFees, transformFeesToBills]);

  // Payment handler with mock implementation
  const handlePay = async (billId: string) => {
    if (!selectedClass) return;
    
    try {
      // In a real implementation, this would call your payment API
      // For now, we'll simulate a successful payment
      setBills((prevBills) => {
        const updatedBills = { ...prevBills };
        updatedBills[selectedClass] = updatedBills[selectedClass].map((bill) => {
          if (bill.id === billId) {
            return { 
              ...bill, 
              status: 'paid', 
              amountPaid: bill.amount,
              transactionId: `mock-${Date.now()}` 
            };
          }
          return bill;
        });
        return updatedBills;
      });
      
      setSnackbar({ 
        open: true, 
        message: 'Payment simulated successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Payment error:', error);
      setSnackbar({
        open: true,
        message: 'Payment failed. Please try again.',
        severity: 'error'
      });
    }
  };

  // Calculate summary for selected class
  const calculateSummary = (): Summary => {
    if (!selectedClass || !bills[selectedClass]) {
      return { total: 0, paid: 0, remaining: 0 };
    }
    
    const classBills = bills[selectedClass];
    const total = classBills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = classBills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    
    return {
      total,
      paid,
      remaining: total - paid
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school fees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex flex-grow gap-6">
          <Psidebar />
          
          <div className="flex-grow md:ml-64">
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-indigo-600">
                Pay School Bills
              </h1>
              <p className="text-center text-gray-600 mb-8">
                {user?.firstName ? `${user.firstName}'s` : 'Your'} school fees payment portal
              </p>

              <div className="mb-8">
                <label htmlFor="select-class" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <AcademicCapIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    id="select-class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="pl-10 block w-full rounded-lg border-gray-300 border py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a class</option>
                    {classes.map((classItem) => (
                      <option key={classItem._id} value={classItem.className}>
                        {classItem.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClass && bills[selectedClass] && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <p className="text-sm text-gray-500 mb-1">Total Bills</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ₦{summary.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Current Session
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                      <p className="text-sm text-gray-500 mb-1">Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₦{summary.paid.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {summary.total > 0 ? ((summary.paid / summary.total) * 100).toFixed(0) : 0}% of total
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
                    {selectedClass} Bills
                  </h2>
                  <hr className="mb-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bills[selectedClass].map((bill) => (
                      <div 
                        key={bill.id} 
                        className={`bg-white rounded-xl shadow-sm p-6 
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
                                Due: {bill.dueDate}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {bill.term} - {bill.session}
                            </p>
                          </div>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                            ${bill.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}
                          `}>
                            {bill.status === 'paid' 
                              ? <><CheckCircleIcon className="h-3 w-3" /> Paid</> 
                              : <><ExclamationCircleIcon className="h-3 w-3" /> Unpaid</>
                            }
                          </span>
                        </div>
                        <hr className="my-4" />
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-800">
                              ₦{bill.amount.toLocaleString()}
                            </p>
                            {bill.amountPaid > 0 && bill.status === 'unpaid' && (
                              <p className="text-sm text-green-600">
                                ₦{bill.amountPaid.toLocaleString()} paid
                              </p>
                            )}
                          </div>
                          {bill.status === 'unpaid' ? (
                            <button 
                              onClick={() => handlePay(bill.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg shadow-sm transition duration-150"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="border border-green-500 text-green-600 py-2 px-6 rounded-lg opacity-75 cursor-not-allowed"
                            >
                              Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!selectedClass && (
                <div className="flex flex-col items-center justify-center py-16">
                  <AcademicCapIcon className="h-16 w-16 text-indigo-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    Please select a class to view bills
                  </p>
                </div>
              )}

              {selectedClass && (!bills[selectedClass] || bills[selectedClass].length === 0) && (
                <div className="flex flex-col items-center justify-center py-16">
                  <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    No bills found for {selectedClass}
                  </p>
                </div>
              )}
            </div>
            
            {snackbar.open && (
              <div className={`fixed bottom-4 right-4 rounded-lg shadow-lg px-6 py-4 z-50
                ${snackbar.severity === 'success' ? 'bg-green-500' : 
                  snackbar.severity === 'error' ? 'bg-red-500' : 
                  snackbar.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} 
                text-white flex items-center gap-2`}
              >
                {snackbar.severity === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5" />
                )}
                <p>{snackbar.message}</p>
                <button 
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PaySchoolBillsPage;