import React, { useState, useEffect } from 'react';
import { FaWallet, FaStar, FaRegStar, FaHistory, FaPaperPlane, FaUserPlus, FaMoneyBillWave } from 'react-icons/fa';
import { HiSearch } from 'react-icons/hi';
import { IoPersonSharp } from 'react-icons/io5';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

interface Kid {
  id: number;
  name: string;
  email: string;
  isBeneficiary: boolean;
  avatar: string;
  _id: string;
}

interface Transfer {
  id: number;
  kidName: string;
  amount: number;
  date: string;
  note: string;
  _id: string;
  recipient: string;
  status: string;
  createdAt: string;
}

interface UserData {
  username: string;
  balance: number;
  recentTransfers: Transfer[];
}

const TransferToKidsPage: React.FC = () => {
  const auth = useAuth();
  const user = auth?.user;
  const token = auth?.token;
  const navigate = useNavigate();
  
  // User data
  const [userData, setUserData] = useState<UserData>({
    username: user?.name || "Parent",
    balance: Number(user?.walletBalance) || 0,
    recentTransfers: []
  });

  // Kids data
  const [allKids, setAllKids] = useState<Kid[]>([]);

  // Form state
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [beneficiaryDialogOpen, setBeneficiaryDialogOpen] = useState<boolean>(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Kid | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [pin, setPin] = useState<string>('');
  const [pinDialogOpen, setPinDialogOpen] = useState<boolean>(false);

  // Filtered kids based on search query and tab selection
  const [filteredKids, setFilteredKids] = useState<Kid[]>([]);

  // Fetch kids list
  const fetchKids = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/getallsudent`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Transform the API response to match our Kid interface
      type ApiKid = {
        _id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email: string;
      };

      const kidsData = response.data.data.map((kid: ApiKid) => ({
        id: kid._id,
        _id: kid._id,
        name: kid.name || `${kid.firstName ?? ''} ${kid.lastName ?? ''}`.trim(),
        email: kid.email,
        isBeneficiary: false, // You might want to fetch this from API if available
        avatar: (kid.name ?? kid.firstName ?? 'K').charAt(0)
      }));
      
      setAllKids(kidsData);
    } catch (error) {
      console.error('Error fetching kids:', error);
      setSnackbarMessage('Failed to fetch kids list');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transaction/getusertransaction`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Transform the API response to match our Transfer interface
      type ApiTransaction = {
        _id: string;
        recipientName?: string;
        amount: number;
        createdAt: string;
        note?: string;
        status: string;
      };

      const transactions = response.data.data.map((txn: ApiTransaction, index: number) => ({
        id: index + 1,
        _id: txn._id,
        kidName: txn.recipientName || 'Recipient',
        amount: txn.amount,
        date: new Date(txn.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        note: txn.note || 'Transfer',
        status: txn.status,
        createdAt: txn.createdAt
      }));
      
      setUserData(prev => ({
        ...prev,
        recentTransfers: transactions
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setSnackbarMessage('Failed to fetch recent transactions');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  // Fetch user balance
  const fetchUserBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = response.data.data || response.data.user;
      setUserData(prev => ({
        ...prev,
        balance: userData.wallet.balance || 0,
        username: userData.name || "Parent"
      }));
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  // Effect to filter kids based on search and tab
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    let filtered = allKids.filter(kid => 
      kid.name.toLowerCase().includes(lowerCaseQuery) || 
      kid.email.toLowerCase().includes(lowerCaseQuery)
    );
    
    // If on beneficiaries tab, only show beneficiaries
    if (tabValue === 1) {
      filtered = filtered.filter(kid => kid.isBeneficiary);
    }
    
    setFilteredKids(filtered);
  }, [searchQuery, allKids, tabValue]);

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchKids();
      fetchRecentTransactions();
      fetchUserBalance();
    }
  }, [token]);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddBeneficiary = (kid: Kid) => {
    setSelectedBeneficiary(kid);
    setBeneficiaryDialogOpen(true);
  };

  const confirmAddBeneficiary = () => {
    if (selectedBeneficiary) {
      setAllKids(allKids.map(kid => 
        kid.id === selectedBeneficiary.id 
          ? { ...kid, isBeneficiary: true } 
          : kid
      ));
      
      setSnackbarMessage(`${selectedBeneficiary.name} added to beneficiaries!`);
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      
      setTimeout(() => {
        setShowSnackbar(false);
      }, 3000);
    }
    setBeneficiaryDialogOpen(false);
  };

  const handleToggleBeneficiary = (kidId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setAllKids(allKids.map(kid => 
      kid.id === kidId 
        ? { ...kid, isBeneficiary: !kid.isBeneficiary } 
        : kid
    ));
  };

  const handleConfirmTransfer = async () => {
    if (!validateForm()) return;
    
    setPinDialogOpen(true);
  };

  const handleSubmitTransfer = async () => {
    if (!selectedKid || !pin) return;
    
    setLoading(true);
    
    try {
      // Make the transfer with PIN included
      const response = await axios.post(
        `${API_BASE_URL}/api/transaction/transfer`,
        {
          receiverEmail: selectedKid.email,
          amount: Number(amount),
          description: note || "Transfer",
          pin: pin
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.message === "Transfer successful") {
        // Update local state
        const newTransfer = {
          id: userData.recentTransfers.length + 1,
          _id: response.data.transaction.senderTransactionRef,
          kidName: selectedKid.name,
          amount: Number(amount),
          date: new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          note: note || "Transfer",
          status: 'completed',
          createdAt: new Date().toISOString(),
          recipient: selectedKid._id
        };
        
        setUserData({
          ...userData,
          balance: userData.balance - Number(amount),
          recentTransfers: [newTransfer, ...userData.recentTransfers]
        });
        
        setSnackbarMessage(`₦${Number(amount).toLocaleString()} successfully transferred to ${selectedKid.name}!`);
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        
        // Clear form
        setSelectedKid(null);
        setAmount('');
        setNote('');
        setPin('');
      } else {
        throw new Error(response.data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      if (axios.isAxiosError(error)) {
        setSnackbarMessage(error.response?.data?.message || 'Transfer failed. Please try again.');
      } else {
        setSnackbarMessage('Transfer failed. Please try again.');
      }
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
      setPinDialogOpen(false);
      
      // Refresh data
      fetchUserBalance();
      fetchRecentTransactions();
    }
  };

  const validateForm = () => {
    return selectedKid && Number(amount) > 0 && Number(amount) <= userData.balance;
  };

  const getCommonTransferAmounts = () => {
    return [500, 1000, 2000, 5000];
  };

  // Navigation to fund wallet
  const navigateToFundWallet = () => {
    navigate('/fundwallet');
  };

  // Navigation to transaction history
  const navigateToTransactionHistory = () => {
    navigate('/ptransactionhistory');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Psidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Transfer Form Section */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                  <h2 className="text-2xl font-bold text-indigo-900 mb-2">Transfer to Kids</h2>
                  <p className="text-gray-600 mb-6">
                    Send money directly to your child's account for school expenses, allowance, or savings.
                  </p>
                  
                  {/* Tabs */}
                  <div className="flex border-b mb-6">
                    <button 
                      className={`flex items-center px-4 py-2 mr-2 ${tabValue === 0 
                        ? 'text-indigo-700 border-b-2 border-indigo-700 font-medium' 
                        : 'text-gray-500 hover:text-indigo-500'}`}
                      onClick={() => handleTabChange(0)}
                    >
                      <IoPersonSharp className="mr-2" />
                      All Kids
                    </button>
                    <button 
                      className={`flex items-center px-4 py-2 ${tabValue === 1 
                        ? 'text-indigo-700 border-b-2 border-indigo-700 font-medium' 
                        : 'text-gray-500 hover:text-indigo-500'}`}
                      onClick={() => handleTabChange(1)}
                    >
                      <FaStar className="mr-2" />
                      Beneficiaries
                    </button>
                  </div>
                  
                  {/* Search Box */}
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black"
                      placeholder="Search for a kid"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Kids List */}
                  {filteredKids.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto mb-6 border rounded-lg">
                      {filteredKids.map((kid) => (
                        <div 
                          key={kid.id} 
                          className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                            selectedKid?.id === kid.id ? 'bg-indigo-50' : ''
                          }`}
                          onClick={() => setSelectedKid(kid)}
                        >
                          <div className="flex items-center">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-medium ${kid.isBeneficiary ? 'bg-indigo-600' : 'bg-gray-500'}`}>
                              {kid.avatar}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-black">{kid.name}</p>
                              <p className="text-sm text-gray-500">{kid.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleToggleBeneficiary(kid.id, e)}
                            className="text-gray-500 hover:text-yellow-500"
                          >
                            {kid.isBeneficiary ? (
                              <FaStar className="text-yellow-500" />
                            ) : (
                              <FaRegStar />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
                      <p className="text-gray-500">No kids found matching your search</p>
                    </div>
                  )}
                  
                  {/* Selected Kid */}
                  {selectedKid && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-medium ${selectedKid.isBeneficiary ? 'bg-indigo-600' : 'bg-gray-500'}`}>
                          {selectedKid.avatar}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-black">{selectedKid.name}</p>
                          <p className="text-sm text-gray-500">{selectedKid.email}</p>
                        </div>
                        {!selectedKid.isBeneficiary && (
                          <button 
                            className="flex items-center text-sm px-3 py-1 border border-indigo-500 text-indigo-600 rounded-md hover:bg-indigo-50"
                            onClick={() => handleAddBeneficiary(selectedKid)}
                          >
                            <FaStar className="mr-1" />
                            Add as Beneficiary
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Amount and Note Fields */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter Amount</label>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {getCommonTransferAmounts().map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          onClick={() => setAmount(quickAmount.toString())}
                          className={`px-3 py-1 rounded-md text-sm ${
                            Number(amount) === quickAmount 
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          ₦{quickAmount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">₦</span>
                        </div>
                        <input
                          type="number"
                          className={`pl-8 block w-full rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-black ${
                            Number(amount) > userData.balance 
                              ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300'
                          }`}
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      {Number(amount) > userData.balance && (
                        <p className="mt-1 text-sm text-red-600">
                          Amount exceeds your available balance
                        </p>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                        Note (optional)
                      </label>
                      <textarea
                        id="note"
                        rows={2}
                        className="block w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        placeholder="What's this transfer for?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex justify-center">
                      <button 
                        onClick={handleConfirmTransfer}
                        disabled={!validateForm()}
                        className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium ${
                          validateForm()
                            ? 'bg-gradient-to-r from-indigo-900 to-indigo-700 text-white hover:from-indigo-800 hover:to-indigo-600 shadow-md'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <FaPaperPlane className="mr-2" />
                        Transfer Funds
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Panel (Recent Transfers & Beneficiaries) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Recent Transfers Section */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                      <FaHistory className="mr-2" />
                      Recent Transfers
                    </h3>
                    <button 
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                      onClick={navigateToTransactionHistory}
                    >
                      View All
                    </button>
                  </div>
                  
                  {userData.recentTransfers.length > 0 ? (
                    <div className="space-y-1">
                      {userData.recentTransfers.slice(0, 3).map((transfer) => (
                        <div key={transfer.id} className="py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-start">
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white font-medium flex-shrink-0">
                              {transfer.kidName.charAt(0)}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-black">{transfer.kidName}</span>
                                <span className="font-bold text-indigo-700">₦{transfer.amount.toLocaleString()}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                <p>{transfer.date}</p>
                                {transfer.note && <p className="mt-1">Note: {transfer.note}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500">
                      No recent transfers
                    </div>
                  )}
                </div>
                
                {/* Beneficiaries Section */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                      <FaStar className="mr-2" />
                      Beneficiaries
                    </h3>
                    <button className="flex items-center text-sm text-indigo-600 hover:text-indigo-800">
                      <FaUserPlus className="mr-1" />
                      Manage
                    </button>
                  </div>
                  
                  {allKids.filter(kid => kid.isBeneficiary).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {allKids
                        .filter(kid => kid.isBeneficiary)
                        .map((kid) => (
                          <div 
                            key={kid.id}
                            className="border rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => setSelectedKid(kid)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white font-medium">
                                {kid.avatar}
                              </div>
                              <span className="font-medium text-sm truncate text-black">{kid.name}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500">
                      No beneficiaries added yet
                    </div>
                  )}
                </div>
                
                {/* Quick Actions Section */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition backdrop-blur-sm"
                      onClick={navigateToFundWallet}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <FaWallet className="text-white" />
                        </div>
                        <span className="ml-2 font-medium">Check Balance</span>
                      </div>
                    </button>
                    <button 
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition backdrop-blur-sm"
                      onClick={navigateToFundWallet}
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <FaMoneyBillWave className="text-white" />
                        </div>
                        <span className="ml-2 font-medium">Add Funds</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PIN Dialog */}
      {pinDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Transfer</h3>
              
              {/* Receiver Details */}
              {selectedKid && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white font-medium`}>
                      {selectedKid.avatar}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-black">{selectedKid.name}</p>
                      <p className="text-sm text-gray-500">{selectedKid.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-2xl font-bold text-indigo-700">
                      ₦{Number(amount).toLocaleString()}
                    </p>
                    {note && <p className="text-sm text-gray-500 mt-1">Note: {note}</p>}
                  </div>
                </div>
              )}
              
              <p className="text-gray-600 mb-4">
                Please enter your 4-digit PIN to authorize this transfer
              </p>
              
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className="block w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest text-black"
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) {
                    setPin(e.target.value);
                  }
                }}
              />
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setPinDialogOpen(false);
                    setPin('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className={`flex items-center px-4 py-2 rounded-lg text-white ${
                    loading 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  onClick={handleSubmitTransfer}
                  disabled={loading || pin.length !== 4}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaMoneyBillWave className="mr-2" />
                      Authorize Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Beneficiary Dialog */}
      {beneficiaryDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Beneficiary</h3>
              <p className="text-gray-600 mb-2">
                Add {selectedBeneficiary?.name} to your beneficiaries for quick access?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Beneficiaries appear in your quick selection list for faster transfers.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => setBeneficiaryDialogOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={confirmAddBeneficiary}
                >
                  <FaStar className="mr-2" />
                  Add Beneficiary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Snackbar/Toast Notification */}
      {showSnackbar && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg shadow-lg p-4 flex items-center ${
            snackbarSeverity === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            <span>{snackbarMessage}</span>
            <button 
              className="ml-4 text-white hover:text-gray-200"
              onClick={() => setShowSnackbar(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default TransferToKidsPage;