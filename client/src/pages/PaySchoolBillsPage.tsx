import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Header } from '../components/Header';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

// Define TypeScript interfaces
interface Student {
  _id: string;
  student_id?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  className: string;
  class?: string;
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
  status: 'Paid' | 'Unpaid';
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
  children?: string[];
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

interface BillsData {
  [studentId: string]: {
    student: Student;
    bills: Bill[];
  };
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
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [bills, setBills] = useState<BillsData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingFees, setLoadingFees] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [paymentPin, setPaymentPin] = useState<string>('');
const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
const [currentBill, setCurrentBill] = useState<Bill | null>(null);
const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const auth = useAuth();

  // Show snackbar message
  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'info') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 5000);
  }, []);

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
      showSnackbar('Authentication token not found. Please login again.', 'error');
      return '';
    }
  }, [auth?.token, showSnackbar]);

  // Fetch user details
  const fetchUserDetails = useCallback(async (authToken: string): Promise<User | null> => {
    try {
      if (auth?.user?._id) {
        setUser(auth.user);
        return auth.user;
      }

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
      showSnackbar('Failed to fetch user details. Please try again.', 'error');
      return null;
    }
  }, [auth, showSnackbar]);

  // Fetch all students
  const fetchStudents = useCallback(async (authToken: string): Promise<Student[]> => {
    try {
      console.log('Fetching students...');
      
      const response = await fetch(`${API_BASE_URL}/api/users/getallsudent`, {
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
      console.log('Raw students API response:', data);
      
      let studentsData: Student[] = [];
      
      // Handle the actual response structure based on your API
      if (data?.success && Array.isArray(data.data)) {
        studentsData = data.data;
      } else if (Array.isArray(data.data)) {
        studentsData = data.data;
      } else if (Array.isArray(data)) {
        studentsData = data;
      } else {
        console.log('Unexpected students response structure:', data);
        throw new Error('Invalid response structure');
      }
      
      // Process each student to ensure consistent structure
      const processedStudents: Student[] = studentsData.map(student => ({
        _id: student.student_id || student._id || `student-${Date.now()}-${Math.random()}`,
        student_id: student.student_id,
        firstName: student.firstName || 'Unknown',
        lastName: student.lastName || '',
        fullName: student.fullName || `${student.firstName || 'Unknown'} ${student.lastName || ''}`.trim(),
        email: student.email || '',
        className: student.class || student.className || 'No Class',
        class: student.class,
        schoolId: student.schoolId,
        parentId: student.parentId,
        role: student.role,
        phone: student.phone
      }));
      
      console.log('Processed students:', processedStudents);
      
      if (processedStudents.length === 0) {
        showSnackbar('No students found', 'warning');
      } else {
        showSnackbar(`Loaded ${processedStudents.length} students`, 'success');
      }
      
      return processedStudents;
    } catch (error) {
      console.error('Error fetching students:', error);
      showSnackbar('Failed to fetch students. Please try again.', 'error');
      return [];
    }
  }, [showSnackbar]);

 // Fetch fees for a specific student using GET request with query parameters
const fetchFeesForStudent = useCallback(async (authToken: string, studentEmail: string): Promise<SchoolFee[]> => {
  try {
    console.log(`Fetching fees for student email: ${studentEmail}`);
    
    // Encode the email to handle special characters in URLs
    const encodedEmail = encodeURIComponent(studentEmail);
    
    const response = await fetch(`${API_BASE_URL}/api/fee/getFeeForStudent/${encodedEmail}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw fees API response:', data);
    
    let feesData: SchoolFee[] = [];
    
    // Handle the response structure based on the API response you provided
    if (data?.data && Array.isArray(data.data)) {
      feesData = data.data;
    } else if (Array.isArray(data)) {
      feesData = data;
    } else if (data?.fees && Array.isArray(data.fees)) {
      feesData = data.fees;
    } else {
      console.log('Unexpected fees response structure:', data);
      return [];
    }
    
    console.log('Processed fees for student:', feesData);
    return feesData;
  } catch (error) {
    console.error('Error fetching student fees:', error);
    showSnackbar('Failed to fetch student fees. Please try again.', 'error');
    return [];
  }
}, [showSnackbar]);

  // Transform fees to bills format
  const transformFeesToBills = useCallback((fees: SchoolFee[]): Bill[] => {
    return fees.map((fee) => ({
      id: fee._id,
  _id: fee._id,
  feeId: fee.feeId,
      description: fee.feeType || 'School Fee',
      amount: fee.amount || 0,
      amountPaid: fee.amountPaid || 0,
      dueDate: fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A',
      status: fee.status?.toLowerCase() === 'paid' ? 'paid' : 'unpaid',
      term: fee.term || 'N/A',
      session: fee.session || 'N/A',
      transactionId: fee.transactionId || 'N/A'
    }));
  }, []);

  // Load fees for selected student
  const loadStudentFees = useCallback(async (studentId: string) => {
    try {
      console.log(`Loading fees for student: ${studentId}`);
      
      const student = students.find(s => s._id === studentId || s.student_id === studentId);
      if (!student) {
        console.error('Student not found in students array');
        showSnackbar('Student not found', 'error');
        return;
      }

      if (!student.email) {
        console.error('Student email not found');
        showSnackbar('Student email not found. Cannot fetch fees.', 'error');
        return;
      }

      console.log('Found student:', student);
      setLoadingFees(true);

      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      // Fetch fees for this specific student using their email
      const studentFees = await fetchFeesForStudent(authToken, student.email);
      console.log('Fetched fees for student:', studentFees);
      
      const transformedBills = transformFeesToBills(studentFees);
      console.log('Transformed bills:', transformedBills);

      setBills(prevBills => ({
        ...prevBills,
        [studentId]: {
          student,
          bills: transformedBills
        }
      }));

      if (transformedBills.length === 0) {
        showSnackbar(`No fees found for ${student.fullName}`, 'info');
      } else {
        showSnackbar(`Loaded ${transformedBills.length} bills for ${student.fullName}`, 'success');
      }

    } catch (error) {
      console.error('Error loading student fees:', error);
      showSnackbar('Failed to load student fees', 'error');
    } finally {
      setLoadingFees(false);
    }
  }, [students, fetchFeesForStudent, transformFeesToBills, showSnackbar, getAuthToken]);

  // Handle student selection
  const handleStudentSelect = useCallback(async (studentId: string) => {
    setSelectedStudent(studentId);
    
    if (studentId) {
      await loadStudentFees(studentId);
    }
  }, [loadStudentFees]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('Starting data initialization...');
        
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token found');
        }
        
        // Fetch user details and students
        const [, studentsData] = await Promise.all([
          fetchUserDetails(authToken),
          fetchStudents(authToken)
        ]);
        
        setStudents(studentsData);
        
        console.log('Data initialization complete:', {
          students: studentsData.length
        });
        
      } catch (error) {
        console.error('Data initialization error:', error);
        showSnackbar('Failed to load data. Please login again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [getAuthToken, fetchUserDetails, fetchStudents, showSnackbar]);

  // Payment handler 
const handlePay = async (billId: string, amount?: number, pin?: string) => {
  if (!selectedStudent || !selectedStudentData) return;

  // If amount and pin aren't provided, show the payment modal
  if (amount === undefined || pin === undefined) {
    const bill = selectedStudentData.bills.find(b => b.id === billId);
    if (bill) {
      setCurrentBill(bill);
      // Set default amount to remaining balance
      const remainingBalance = bill.amount - bill.amountPaid;
      setPaymentAmount(remainingBalance.toString());
      setShowPaymentModal(true);
    }
    return;
  }

  try {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error('No authentication token found');
    }

    const studentEmail = selectedStudentData.student.email;
    if (!studentEmail) {
      throw new Error('Student email not found');
    }

    const bill = selectedStudentData.bills.find(b => b._id === billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const response = await fetch(`${API_BASE_URL}/api/fee/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentEmail,
        amount,
        feeId: bill.feeId, 
        pin
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment failed');
    }

    const data = await response.json();
    showSnackbar(data.message || 'Payment successful', 'success');

    // Refresh the student's fees after successful payment
    await loadStudentFees(selectedStudent);

    // Close the payment modal and reset states
    setShowPaymentModal(false);
    setPaymentPin('');
    setPaymentAmount('');
    setCurrentBill(null);

  } catch (error) {
    console.error('Payment error:', error);
    showSnackbar(error instanceof Error ? error.message : 'Payment failed. Please try again.', 'error');
  }
};


  // Calculate summary for selected student
  const calculateSummary = (): Summary => {
    if (!selectedStudent || !bills[selectedStudent]) {
      return { total: 0, paid: 0, remaining: 0 };
    }
    
    const studentBills = bills[selectedStudent].bills;
    const total = studentBills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = studentBills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    
    return {
      total,
      paid,
      remaining: total - paid
    };
  };

  const summary = calculateSummary();
  const selectedStudentData = selectedStudent ? bills[selectedStudent] : null;

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
        <div className="z-[100] flex flex-grow gap-6">
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
                <label htmlFor="select-student" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student ({students.length} students found)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    id="select-student"
                    value={selectedStudent}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="pl-10 block w-full rounded-lg border-gray-300 border py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={students.length === 0}
                  >
                    <option value="">
                      {students.length === 0 ? 'No students available' : 'Select a student'}
                    </option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName} - {student.className}
                        {student.email && ` (${student.email})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingFees && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading fees...</p>
                </div>
              )}

              {selectedStudentData && !loadingFees && (
                <>
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-900">
                          {selectedStudentData.student.fullName}
                        </h3>
                        <p className="text-sm text-indigo-600">
                          Class: {selectedStudentData.student.className}
                        </p>
                        {selectedStudentData.student.email && (
                          <p className="text-xs text-indigo-500">
                            {selectedStudentData.student.email}
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
                        {selectedStudentData.bills.length} bill(s)
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
                    {selectedStudentData.student.fullName}'s Bills
                  </h2>
                  <hr className="mb-6" />

                  {selectedStudentData.bills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedStudentData.bills.map((bill) => (
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
                              {bill.status === 'paid' && bill.transactionId !== 'N/A' && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ID: {bill.transactionId}
                                </p>
                              )}
                            </div>
                            {bill.status === 'unpaid' ? (
                             <button 
  onClick={() => handlePay(bill.id)}
  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg shadow-sm transition duration-150 font-medium"
>
  Pay Now
</button>
                            ) : (
                              <button 
                                disabled
                                className="border border-green-500 text-green-600 py-2 px-6 rounded-lg opacity-75 cursor-not-allowed font-medium"
                              >
                                Paid ✓
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">
                        No bills found for {selectedStudentData.student.fullName}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Bills will appear here when they are created by the school
                      </p>
                    </div>
                  )}
                </>
              )}

              {!selectedStudent && !loadingFees && (
                <div className="flex flex-col items-center justify-center py-16">
                  <UserIcon className="h-16 w-16 text-indigo-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    Please select a student to view bills
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {students.length === 0 
                      ? 'No students found in your account'
                      : `Choose from ${students.length} available students`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      {showPaymentModal && currentBill && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-black mb-4">Confirm Payment</h3>
      
      <div className="mb-4">
        <p className="text-black mb-2">Bill Details:</p>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="font-bold text-black">{currentBill.description}</p>
          <p className="text-sm text-black mt-1">Student: {selectedStudentData?.student.fullName}</p>
          <p className="text-sm text-black mt-1">Total Amount: ₦{currentBill.amount.toLocaleString()}</p>
          <p className="text-sm text-black mt-1">Already Paid: ₦{currentBill.amountPaid.toLocaleString()}</p>
          <p className="text-sm text-black font-medium mt-1">
            Remaining Balance: ₦{(currentBill.amount - currentBill.amountPaid).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="payment-amount" className="block text-sm font-medium text-black mb-1">
          Enter Amount to Pay (₦)
        </label>
        <input
          type="number"
          id="payment-amount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          placeholder="Enter amount"
          min="1"
          max={currentBill.amount - currentBill.amountPaid}
        />
        <p className="text-xs text-black mt-1">
          Maximum: ₦{(currentBill.amount - currentBill.amountPaid).toLocaleString()}
        </p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="payment-pin" className="block text-sm font-medium text-black mb-1">
          Enter Payment PIN
        </label>
        <input
          type="password"
          id="payment-pin"
          value={paymentPin}
          onChange={(e) => setPaymentPin(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          placeholder="Enter your 4-digit PIN"
          maxLength={4}
        />
      </div>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowPaymentModal(false);
            setPaymentPin('');
            setPaymentAmount('');
            setCurrentBill(null);
          }}
          className="px-4 py-2 text-black hover:bg-gray-100 rounded-md border border-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const amount = parseFloat(paymentAmount);
            if (amount > 0 && amount <= (currentBill.amount - currentBill.amountPaid)) {
              handlePay(currentBill.id, amount, paymentPin);
            }
          }}
          disabled={
            paymentPin.length !== 4 || 
            !paymentAmount || 
            parseFloat(paymentAmount) <= 0 || 
            parseFloat(paymentAmount) > (currentBill.amount - currentBill.amountPaid)
          }
          className={`px-4 py-2 rounded-md text-white ${
            paymentPin.length === 4 && 
            paymentAmount && 
            parseFloat(paymentAmount) > 0 && 
            parseFloat(paymentAmount) <= (currentBill.amount - currentBill.amountPaid)
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-indigo-300 cursor-not-allowed'
          }`}
        >
          Pay ₦{paymentAmount ? parseFloat(paymentAmount).toLocaleString() : '0'}
        </button>
      </div>
    </div>
  </div>
)}
        <Footer />
      </div>
      
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 rounded-lg shadow-lg px-6 py-4 z-50 max-w-md
          ${snackbar.severity === 'success' ? 'bg-green-500' : 
            snackbar.severity === 'error' ? 'bg-red-500' : 
            snackbar.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} 
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

export default PaySchoolBillsPage;