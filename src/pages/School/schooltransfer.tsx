import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Send,
  ArrowLeft,
  User as UserIcon,
  AlertCircle,
  Check,
  X,
  DollarSign,
  Users,
  School
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllCharges, getAllSchoolUsers, getUserDetails, transferFunds } from '../../services';
import type { Charge, SchoolUser, User } from '../../types';

/**
 * Shared wrapper for every state of this page.
 * SchoolLayout already provides: min-h-screen, header, fixed sidebar and footer,
 * so the page only needs to (1) fill the remaining width, (2) clear the 16rem sidebar,
 * and (3) center its content in one consistent max-width container.
 */
const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="flex-1 min-w-0 p-4 sm:p-6 md:ml-64">
    <div className="w-full max-w-6xl mx-auto">{children}</div>
  </main>
);

/** Centered message card used by loading / access-denied / feature-disabled states */
const CenteredState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageShell>
    <div className="flex items-center justify-center min-h-[60vh]">{children}</div>
  </PageShell>
);

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

        // Extract user data from response structure
        let userData: Partial<User> | null = null;
        let walletBalance = 0;

        // The response has user.data containing the actual user
        if (data.user?.data) {
          userData = data.user.data;

          // Get wallet balance from the wallet object
          if (data.user?.wallet?.balance !== undefined) {
            walletBalance = data.user.wallet.balance;
          }
        } else if (data.data) {
          userData = data.data;
        } else if (data.user) {
          userData = data.user;
        } else {
          userData = data;
        }

        if (!userData) {
          throw new Error('User data is missing in response');
        }

        // Create user object that matches the imported User type
        const userProfile: User = {
          // Core required fields (all present in API)
          _id: userData._id ?? '',
          name: userData.name ??
            (userData.firstName && userData.lastName
              ? `${userData.firstName} ${userData.lastName}`.trim()
              : (userData.firstName ?? userData.lastName ?? 'User')),
          email: userData.email ?? '',
          role: userData.role ?? '',
          status: userData.status || 'Active',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),

          // Personal info - ensure these are strings, not undefined
          firstName: userData.firstName ?? '',
          lastName: userData.lastName ?? '',
          phone: userData.phone,

          // School info
          schoolId: userData.schoolId,
          schoolName: userData.schoolName,
          schoolType: userData.schoolType,
          schoolAddress: userData.schoolAddress,
          ownership: userData.ownership,
          schoolCanTransfer: userData.schoolCanTransfer === true,

          // Wallet & balance
          balance: walletBalance,
          wallet: {
            balance: walletBalance,
          },
          accountNumber: userData.accountNumber,

          // Other fields
          isPinSet: userData.isPinSet,
          profilePicture: userData.profilePicture,
          qrcode: userData.qrcode,

          // Permission flags
          agentCanTopup: userData.agentCanTopup,
          agentCanTransfer: userData.agentCanTransfer,
          agentCanWithdraw: userData.agentCanWithdraw,
          schoolCanTopup: userData.schoolCanTopup,
          storeCanTopup: userData.storeCanTopup,
          storeCanTransfer: userData.storeCanTransfer,
          storeCanWithdraw: userData.storeCanWithdraw,
          studentCanTopup: userData.studentCanTopup,
          studentCanTransfer: userData.studentCanTransfer,
          studentCanWithdraw: userData.studentCanWithdraw,
          studentCanPayBill: userData.studentCanPayBill,

          // Bank details
          bankDetails: userData.bankDetails
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

      const otherUsers = users.filter(u => u._id !== user?._id);

      setSchoolUsers(otherUsers);
      setFilteredUsers(otherUsers);
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

    const term = searchTerm.toLowerCase();
    const filtered = schoolUsers.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
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
          setUser(authUser as User);
        } else {
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
      <CenteredState>
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-r-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-indigo-800">Loading...</p>
        </div>
      </CenteredState>
    );
  }

  // Not a school account
  if (user?.role !== 'school') {
    return (
      <CenteredState>
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
      </CenteredState>
    );
  }

  // School account without transfer permission
  if (!user?.schoolCanTransfer) {
    return (
      <CenteredState>
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
      </CenteredState>
    );
  }

  // Main page rendering
  return (
    <PageShell>
      {/* Top bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 sm:px-6 h-16 mb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="text-right min-w-0">
          <p className="text-sm text-gray-600 truncate">{user?.schoolName || 'School'}</p>
          <p className="text-lg font-semibold text-blue-600">
            ₦{typeof user?.balance === 'number' ? user.balance.toLocaleString() : '0'}
          </p>
        </div>
      </div>

      {/* Two equal-height columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <section className="bg-white rounded-lg shadow-sm p-6 min-w-0">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Select Recipient</h2>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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
              filteredUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedUser?._id === u._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 shrink-0 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {u.profilePicture ? (
                        <img
                          src={u.profilePicture}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1">
                        {u.role}
                      </span>
                    </div>
                    {selectedUser?._id === u._id && (
                      <Check className="w-5 h-5 shrink-0 text-blue-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Transfer Form */}
        <section className="bg-white rounded-lg shadow-sm p-6 min-w-0">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Transfer Details</h2>
          </div>

          {selectedUser ? (
            <div className="space-y-4">
              {/* Selected User Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 shrink-0 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedUser.profilePicture ? (
                      <img
                        src={selectedUser.profilePicture}
                        alt={selectedUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500 truncate">{selectedUser.email}</p>
                    <span className="inline-block text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded mt-1">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black resize-none"
                  rows={3}
                />
              </div>

              {/* Fee Info */}
              {amount && Number(amount) > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-black">
                  <div className="flex justify-between text-sm">
                    <span>Transfer Amount:</span>
                    <span>₦{Number(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transaction Fee:</span>
                    <span>₦{transactionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-sm border-t border-yellow-200 pt-2 mt-2">
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
              <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a recipient to start transfer</p>
            </div>
          )}
        </section>
      </div>

      {/* PIN Dialog */}
      {showPinDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
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
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[200]">
          <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 text-white ${snackbarSeverity === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {snackbarSeverity === 'success' ? (
              <Check className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1">{snackbarMessage}</span>
            <button
              onClick={() => setShowSnackbar(false)}
              className="text-white hover:text-gray-200"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default SchoolTransferPage;