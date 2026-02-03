import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Send,
  ArrowLeft,
  User,
  AlertCircle,
  Check,
  X,
  DollarSign,
  Users,
  School
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Sidebar as Asidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { getAllCharges, getAllSchoolUsers, getUserDetails, transferFunds } from '../../services';
import type { Charge, SchoolUser } from '../../types';


interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  balance: number;
  schoolCanTransfer: boolean;
  role: string;
  schoolId?: string;
  schoolName?: string;
  wallet?: {
    balance?: number | string;
  };
  [key: string]: unknown;
}


const SchoolTransferPage: React.FC = () => {
  const { user: authUser, token, login } = useAuth();

  // State management
  const [user, setUser] = useState<User | null>(null);
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SchoolUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SchoolUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [fetchingUserDetails, setFetchingUserDetails] = useState(true);
  const [showPinDialog, setPinDialogOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [transactionFee, setTransactionFee] = useState(0);

  // Check if user has permission to access this page
  const hasPermission = user?.role === 'school' && user?.schoolCanTransfer === true;

  // Fetch transaction charges
// Fetch transaction charges
const fetchTransactionCharges = useCallback(async () => {
  if (!token) return;

  try {
    const data = await getAllCharges();
    
    if (data && Array.isArray(data)) {
      const transferCharge = data.find((charge: Charge) =>
        charge.name.toLowerCase().includes('transfer') && charge.status === 'Active'
      );

      if (transferCharge) {
        setTransactionFee(transferCharge.amount);
      }
    }
  } catch (error: unknown) {
    console.error('Error fetching transaction charges:', error);
    setTransactionFee(0);
  }
}, [token]);

  // Fetch user details from API
  const fetchUserDetails = useCallback(
  async (authToken: string): Promise<User | null> => {
    try {
      const data = await getUserDetails();
      console.log('User API Response:', data);

      // Extract user data from different possible response structures
      let userData: Partial<User> | null = null;
      let balance = 0;

      if (data.user?.data) {
        userData = data.user.data;
      } else if (data.data) {
        userData = data.data;
      } else if (data.user) {
        userData = data.user;
      } else {
        userData = data;
      }

      // Extract balance from different possible locations
      if (data.user?.wallet?.balance !== undefined) {
        balance = data.user.wallet.balance;
      } else if (data.wallet?.balance !== undefined) {
        balance = data.wallet.balance;
      } else if (userData?.wallet?.balance !== undefined) {
        balance = typeof userData.wallet.balance === 'string' ? parseFloat(userData.wallet.balance) || 0 : userData.wallet.balance;
      } else if (userData?.balance !== undefined) {
        balance = userData.balance;
      }

      // Convert balance to number if it's a string
      if (typeof balance === 'string') {
        balance = parseFloat(balance) || 0;
      }

      // Create the user object with all required properties
      if (!userData) {
        throw new Error('User data is missing in response');
      }
      
      const userProfile: User = {
        _id: userData._id ?? '',
        firstName: userData.firstName ?? '',
        lastName: userData.lastName ?? '',
        name: userData?.name ?? `${userData?.firstName ?? ''} ${userData?.lastName ?? ''}`,
        email: userData.email ?? '',
        balance: balance,
        schoolCanTransfer: userData.schoolCanTransfer === true,
        role: userData.role ?? '',
        schoolId: userData.schoolId,
        schoolName: userData.schoolName
      };

      console.log('Processed user profile:', userProfile);

      // Update user state
      setUser(userProfile);

      // Update auth context if login function is available
      if (login) {
        login(userProfile, authToken);
      }

      return userProfile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSnackbarMessage('Failed to load user details. Please try again.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return null;
    }
  },
  [login]
);
  // Fetch school users
const fetchSchoolUsers = useCallback(async () => {
  if (!token || !hasPermission) return;

  try {
    setFetchingUsers(true);
    const data = await getAllSchoolUsers();

    console.log('School users response:', data);

    let users: SchoolUser[] = [];
    if (data.users) {
      users = data.users;
    } else if (data.data) {
      users = data.data;
    } else if (Array.isArray(data)) {
      users = data;
    }

    const filteredUsers = users.filter(u => u._id !== user?._id);

    setSchoolUsers(filteredUsers);
    setFilteredUsers(filteredUsers);
  } catch (error: unknown) {
    console.error('Error fetching school users:', error);
    
    let errorMessage = 'Failed to load school users. Please try again.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      errorMessage = err.response?.data?.message || errorMessage;
    }
    
    setSnackbarMessage(errorMessage);
    setSnackbarSeverity('error');
    setShowSnackbar(true);
  } finally {
    setFetchingUsers(false);
  }
}, [token, hasPermission, user?._id]);

// Filter users based on search term
useEffect(() => {
  if (!searchTerm.trim()) {
    setFilteredUsers(schoolUsers);
    return;
  }

  const filtered = schoolUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  setFilteredUsers(filtered);
}, [searchTerm, schoolUsers]);

  // Load user details and school users on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (!token) {
        setSnackbarMessage('Authentication required. Please log in again.');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
        return;
      }

      try {
        setFetchingUserDetails(true);

        // First check if we already have user data in auth context
        if (authUser && typeof authUser === 'object') {
          // Try to extract the required properties from authUser
          const authUserData = authUser as unknown as User;
          const userProfile: User = {
            _id: authUserData._id,
            firstName: authUserData.firstName,
            lastName: authUserData.lastName,
            name: authUserData.name || `${authUserData.firstName} ${authUserData.lastName}`,
            email: authUserData.email,
            balance: typeof authUserData.balance === 'number' ? authUserData.balance : 0,
            schoolCanTransfer: authUserData.schoolCanTransfer === true,
            role: authUserData.role,
            schoolId: authUserData.schoolId,
            schoolName: authUserData.schoolName
          };

          setUser(userProfile);
        } else {
          // Fetch user details from API if not available in auth context
          await fetchUserDetails(token);
        }

        // Then fetch transaction charges
        await fetchTransactionCharges();
      } catch (error) {
        console.error('Error initializing user data:', error);
        setSnackbarMessage('Failed to load user details. Please try again.');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      } finally {
        setFetchingUserDetails(false);
      }
    };

    initializeData();
  }, [token, authUser, fetchUserDetails, fetchTransactionCharges]);

  // Load school users when user has permission
  useEffect(() => {
    if (hasPermission && !fetchingUserDetails) {
      fetchSchoolUsers();
    }
  }, [hasPermission, fetchSchoolUsers, fetchingUserDetails]);

 // Handle transfer submission
const handleSubmitTransfer = async () => {
  if (!selectedUser || !pin) return;

  setTransferLoading(true);

  try {
    const data = await transferFunds({
      receiverEmail: selectedUser.email,
      amount: Number(amount),
      pin: pin
    });

    if (data.message === "Transfer successful") {
      setSnackbarMessage(`₦${Number(amount).toLocaleString()} successfully transferred to ${selectedUser.email}!`);
      setSnackbarSeverity('success');
      setShowSnackbar(true);

      // Clear form
      setSelectedUser(null);
      setAmount('');
      setNote('');
      setPin('');
    } else {
      throw new Error(data.message || 'Transfer failed');
    }
  } catch (error: unknown) {
    console.error('Transfer error:', error);
    
    let errorMessage = 'Transfer failed. Please try again.';
    let message = '';
    
    if (error instanceof Error) {
      message = error.message?.toLowerCase() || '';
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      message = err.response?.data?.message?.toLowerCase() || '';
    }

    if (message.includes('pin')) {
      errorMessage = 'Invalid PIN. Please check your PIN and try again.';
    } else if (message.includes('balance') || message.includes('insufficient')) {
      errorMessage = 'Insufficient balance. Please fund your wallet first.';
    } else if (message.includes('user') || message.includes('recipient')) {
      errorMessage = 'Recipient not found. Please verify the recipient details.';
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    setSnackbarMessage(errorMessage);
    setSnackbarSeverity('error');
    setShowSnackbar(true);
  } finally {
    setTransferLoading(false);
    setPinDialogOpen(false);
  }
};
  const handleTransferClick = () => {
    if (!selectedUser || !amount || Number(amount) <= 0) return;

    const totalAmount = Number(amount) + transactionFee;
    const userBalance = typeof user?.balance === 'number' ? user.balance : 0;
    if (userBalance < totalAmount) {
      setSnackbarMessage(`Insufficient balance. You need ₦${totalAmount.toLocaleString()} (including ₦${transactionFee} fee)`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    setPinDialogOpen(true);
  };

  // Loading state for initial page load
  if (fetchingUserDetails) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings" />
        <div className="flex flex-grow">
          <div className=" hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-white shadow z-10">
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
  }

  // If user doesn't have permission, show appropriate message
  if (user?.role !== 'school') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings" />
        <div className="flex flex-grow">
          <div className=" hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-white shadow z-10">
            <Asidebar />
          </div>
          <main className="flex-1 p-4">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">
                  This feature is only available for school accounts. Your account role is: {user?.role || 'unknown'}
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // If user is a school but doesn't have transfer permission
  if (user?.role === 'school' && !user?.schoolCanTransfer) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/settings" />
        <div className="flex flex-grow">
          <div className=" hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-white shadow z-10">
            <Asidebar />
          </div>
          <main className="flex-1 p-4">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <School className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Feature Not Available</h2>
                <p className="text-gray-600 mb-4">
                  School transfer feature is not enabled for your account. Please contact your administrator to enable this feature for your school.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>School:</strong> {user?.schoolName || 'Your School'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Transfer permissions are currently disabled
                  </p>
                </div>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Main page rendering
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header profilePath="/settings" />
      <div className="flex flex-grow">
        <div className=" hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-white shadow z-10">
          <Asidebar />
        </div>
        <main className="flex-1 p-4 md:ml-64">
          <div className="bg-white shadow-sm border-b mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => window.history.back()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{user?.schoolName || 'School'}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ₦{typeof user?.balance === 'number' ? user.balance.toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Select Recipient</h2>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {fetchingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading school users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No users found matching your search.' : 'No school users available.'}
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedUser?._id === user._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {user.role}
                              </span>
                            </div>
                          </div>
                          {selectedUser?._id === user._id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Transfer Form */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Transfer Details</h2>
                </div>

                {selectedUser ? (
                  <div className="space-y-4">
                    {/* Selected User Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {selectedUser.profilePicture ? (
                            <img
                              src={selectedUser.profilePicture}
                              alt={selectedUser.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedUser.name}</p>
                          <p className="text-sm text-gray-500">{selectedUser.email}</p>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            {selectedUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>

                    {/* Note Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note (Optional)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note for this transfer..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        rows={3}
                      />
                    </div>

                    {/* Fee Info */}
                    {amount && Number(amount) > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span>Transfer Amount:</span>
                          <span>₦{Number(amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-black">
                          <span>Transaction Fee:</span>
                          <span>₦{transactionFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium text-sm border-t border-yellow-200 pt-2 mt-2 text-black">
                          <span>Total Debit:</span>
                          <span>₦{(Number(amount) + transactionFee).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Transfer Button */}
                    <button
                      onClick={handleTransferClick}
                      disabled={!amount || Number(amount) <= 0 || transferLoading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <Send className="w-5 h-5" />
                      <span>Transfer ₦{Number(amount || 0).toLocaleString()}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a recipient to start transfer</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PIN Dialog */}
          {showPinDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter PIN to Confirm Transfer</h3>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Transfer ₦{Number(amount).toLocaleString()} to {selectedUser?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total debit: ₦{(Number(amount) + transactionFee).toLocaleString()} (including ₦{transactionFee.toLocaleString()} fee)
                  </p>
                </div>

                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your 4-digit PIN"
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-black"
                  autoFocus
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setPinDialogOpen(false);
                      setPin('');
                    }}
                    disabled={transferLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTransfer}
                    disabled={!pin || pin.length !== 4 || transferLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {transferLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Confirm Transfer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Snackbar */}
          {showSnackbar && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 ${snackbarSeverity === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                }`}>
                {snackbarSeverity === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{snackbarMessage}</span>
                <button
                  onClick={() => setShowSnackbar(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SchoolTransferPage;