import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import KidsHeader from '../components/KidsHeader';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { 
  User, 
  CreditCard, 
  History, 
  GraduationCap, 
  Settings,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  Edit,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';

// Types to match KidsHeader expectations
interface Profile {
  _id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  profilePic?: string;
  qrCodeId?: string;
  createdAt?: string;
  settings?: {
    transactionNotifications: boolean;
    lowBalanceAlert: boolean;
    monthlyReports: boolean;
  };
}

interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
}

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type Notifications = {
  transactionNotifications: boolean;
  lowBalanceAlert: boolean;
  monthlyReports: boolean;
};

type NavItem = {
  label: string;
  icon: React.ReactNode;
  route: string;
};

const KidsSettingsPage: React.FC = () => {
  // Auth context for token management
  const auth = useAuth();
  const token = auth?.token;
  
  // State for user profile and wallet
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  
  // Local form data for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: ''
  });
  
  // Password data state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Password errors state
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState<Notifications>({
    transactionNotifications: true,
    lowBalanceAlert: true,
    monthlyReports: true
  });
  
  // API Base URL
  const API_URL = process.env.REACT_APP_API_URL || 'https://nodes-staging-xp.up.railway.app';
  
  // Navigation items with Lucide icons
  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
    { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];
  
  const [activeTab, setActiveTab] = useState<number>(4); // Settings tab is index 4

  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity: type });
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let userData: Profile;
      if (response.data.user) {
        userData = response.data.user.data || response.data.user;
      } else {
        userData = response.data.data || response.data;
      }

      // Ensure we have the proper name structure for KidsHeader
      if (userData.firstName && userData.lastName && !userData.fullName) {
        userData.fullName = `${userData.firstName} ${userData.lastName}`;
      }
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      setProfile(userData);
      
      // Update form data
      setFormData({
        name: userData.name || userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || userData.phoneNumber || '',
        joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'
      });

      // Update notifications
      setNotifications({
        transactionNotifications: userData.settings?.transactionNotifications ?? true,
        lowBalanceAlert: userData.settings?.lowBalanceAlert ?? true,
        monthlyReports: userData.settings?.monthlyReports ?? true
      });

      return userData;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError("Failed to load profile data");
      showNotification("Error fetching profile", "error");
      throw err;
    }
  };

  // Fetch user wallet
  const fetchUserWallet = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/getuserwallet`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const walletData = response.data.data || response.data;
      setWallet(walletData);
      return walletData;
    } catch (err) {
      console.error('Error fetching wallet:', err);
      showNotification("Error fetching wallet data", "error");
      // Don't throw here as wallet is not critical for settings page functionality
      setWallet({ balance: 0 });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile first
        await fetchUserProfile();
        
        // Fetch wallet (non-blocking)
        await fetchUserWallet();
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [token, API_URL]);
  
  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPassword) => () => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  // Handle form change
  const handleFormChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  // Handle notification change
  const handleNotificationChange = (field: keyof Notifications) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({ ...prev, [field]: e.target.checked }));
  };
  
  // Handle password change
  const handlePasswordChange = (field: keyof PasswordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  // Validate password form
  const validatePasswordForm = (): boolean => {
    const errors: PasswordErrors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Required';
    if (!passwordData.newPassword) errors.newPassword = 'Required';
    else if (passwordData.newPassword.length < 8) errors.newPassword = 'Minimum 8 characters required';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle profile update
  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    
    try {
      const userid = profile?._id;
      if (!userid) throw new Error("User ID not found");
      
      await axios.put(`${API_URL}/api/users/update-user/${userid}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        settings: notifications
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      showNotification('Profile updated successfully!', 'success');
      setEditMode(false);
      
      // Refresh user data after update
      await fetchUserProfile();
    } catch (err: unknown) {
      let errorMessage = 'Profile update failed';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (err as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      showNotification(errorMessage, 'error');
      console.error(errorMessage, err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/users/updatePassword`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      showNotification('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      let errorMessage = 'Password update failed';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (err as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle forgot password
  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_URL}/api/users/forgotpassword`, { email: formData.email });
      showNotification('Reset link sent to email', 'success');
    } catch (err: unknown) {
      let errorMessage = 'Request failed';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (err as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      showNotification(errorMessage, 'error');
    }
  };

  // Navigation tab handler
  const handleNavTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Snackbar close handler
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-800 font-semibold">Loading your settings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Unable to Load Settings</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-indigo-50 min-h-screen py-4 md:py-6">
      <div className="container mx-auto px-4 flex flex-col min-h-screen">
        {/* Header Section - Using imported KidsHeader with real data */}
        <KidsHeader 
          profile={profile}
          wallet={wallet || { balance: 0 }}
        />
  
        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex overflow-x-auto">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.route}
                className={`flex flex-col md:flex-row items-center justify-center px-4 py-3 md:py-4 min-w-[80px] md:min-w-[100px] text-sm md:text-base transition-colors ${activeTab === index ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                onClick={() => handleNavTabChange(index)}
              >
                <span className="mb-1 md:mb-0 md:mr-2">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
  
        {/* Main Settings Content */}
        <div className="flex-1 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" /> Profile Information
                </h2>
                {editMode ? (
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    onClick={handleProfileSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                ) : (
                  <button 
                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-4 py-2 rounded-lg border ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={formData.name}
                      onChange={handleFormChange('name')}
                      disabled={!editMode}
                        placeholder="Enter your full name"
                        title="Full Name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-4 py-2 rounded-lg border ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={formData.email}
                      onChange={handleFormChange('email')}
                      disabled={!editMode}
                      placeholder="Enter your email"
                      title="Email"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-4 py-2 rounded-lg border ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={formData.phone}
                      onChange={handleFormChange('phone')}
                      disabled={!editMode}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Join Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block text-gray-700 mb-2 w-full px-4 py-2 rounded-lg border bg-gray-100 border-transparent"
                      value={formData.joinDate}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Password Settings */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-blue-500" /> Change Password
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-10 py-2 rounded-lg border ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      placeholder="Enter current password"
                      title="Current Password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility('current')}
                      title={showPassword.current ? "Hide password" : "Show password"}
                    >
                      {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-10 py-2 rounded-lg border ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      placeholder="Enter new password"
                      title="New Password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility('new')}
                      title={showPassword.new ? "Hide password" : "Show password"}
                    >
                      {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-10 py-2 rounded-lg border ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      placeholder="Confirm new password"
                      title="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility('confirm')}
                      title={showPassword.confirm ? "Hide password" : "Show password"}
                    >
                      {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Updating...
                    </span>
                  ) : 'Update Password'}
                </button>
                
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 mt-2 text-sm"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </form>
            </div>
            
            {/* Notification Settings */}
            <div className="bg-white p-6 rounded-xl shadow-lg col-span-1 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" /> Notification Preferences
                </h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  onClick={handleProfileSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving...
                    </span>
                  ) : 'Save Preferences'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.transactionNotifications}
                      onChange={handleNotificationChange('transactionNotifications')}
                      title="Transaction Notifications"
                      placeholder="Transaction Notifications"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-gray-700">Transaction Notifications</span>
                  </label>
                  <p className="ml-11 text-sm text-gray-500 mt-1">Receive alerts for all transactions</p>
                </div>
                
                <div className="flex items-start">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.lowBalanceAlert}
                      onChange={handleNotificationChange('lowBalanceAlert')}
                      title="Low Balance Alerts"
                      placeholder="Low Balance Alerts"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-gray-700">Low Balance Alerts</span>
                  </label>
                  <p className="ml-11 text-sm text-gray-500 mt-1">Get notified when balance is low</p>
                </div>
                
                <div className="flex items-start">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.monthlyReports}
                      onChange={handleNotificationChange('monthlyReports')}
                      title="Monthly Reports"
                      placeholder="Monthly Reports"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-gray-700">Monthly Reports</span>
                  </label>
                  <p className="ml-11 text-sm text-gray-500 mt-1">Receive monthly spending summaries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
      
      {/* Snackbar Notification */}
      {snackbar.open && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg max-w-md w-full ${snackbar.severity === 'success' ? 'bg-green-100 text-green-800' : snackbar.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          <div className="flex justify-between items-center">
            <span>{snackbar.message}</span>
            <button onClick={handleSnackbarClose} className="ml-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsSettingsPage;