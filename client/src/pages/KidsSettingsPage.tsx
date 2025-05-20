import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import KidsHeader from '../components/KidsHeader';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

// Types for our component
type Profile = {
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  profilePic: string;
  joinDate: string;
  _id?: string;
  createdAt?: string;
  settings?: {
    transactionNotifications: boolean;
    lowBalanceAlert: boolean;
    monthlyReports: boolean;
  };
};

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
  const ctxToken = auth?.token;
  const [token] = useState<string>(ctxToken || localStorage.getItem('token') || '');
  
  // State for user profile
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    walletBalance: 0,
    profilePic: '',
    joinDate: ''
  });
  
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
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
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nodes-staging.up.railway.app';
  
  // Navigation items
  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <i className="fas fa-user"></i>, route: "/kidswallet" },
    { label: "Pay Agent", icon: <i className="fas fa-money-bill-transfer"></i>, route: "/kidpayagent" },
    { label: "History", icon: <i className="fas fa-history"></i>, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <i className="fas fa-school"></i>, route: "/schoolbills" },
    { label: "Settings", icon: <i className="fas fa-cog"></i>, route: "/settings" }
  ];
  
  const [activeTab, setActiveTab] = useState<number>(4); // Settings tab is index 4

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setSnackbar({ open: true, message: 'No authentication token found.', severity: 'error' });
        return;
      }
      
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/users/getuserone`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (res.data?.user?.data) {
          setUser(res.data.user.data);
        }
      } catch (err: unknown) {
        console.error('Auth error:', err);
        let errorMessage = 'Authentication error. Please login again.';
        type AxiosError = {
          response?: {
            data?: {
              message?: string;
            };
          };
        };
        if (
          err &&
          typeof err === 'object' &&
          'response' in err &&
          (err as AxiosError).response?.data?.message
        ) {
          errorMessage = (err as AxiosError).response!.data!.message!;
        }
        setSnackbar({ 
          open: true, 
          message: errorMessage, 
          severity: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, API_BASE_URL]);

  // Update profile state when user data changes
  useEffect(() => {
    if (!user) return;
    
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      walletBalance: user.walletBalance || 0,
      profilePic: user.profilePic || '',
      joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
    });
    
    setNotifications({
      transactionNotifications: user.settings?.transactionNotifications ?? true,
      lowBalanceAlert: user.settings?.lowBalanceAlert ?? true,
      monthlyReports: user.settings?.monthlyReports ?? true
    });
  }, [user]);
  
  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPassword) => () => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  // Handle profile change
  const handleProfileChange = (field: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
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
      const userid = user?._id;
      if (!userid) throw new Error("User ID not found");
      
      await axios.put(`${API_BASE_URL}/api/users/update-user/${userid}`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        settings: notifications
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setEditMode(false);
      
      // Refresh user data after update
      const res = await axios.get(`${API_BASE_URL}/api/users/getuserone`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data?.user?.data) {
        setUser(res.data.user.data);
      }
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
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
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
      await axios.post(`${API_BASE_URL}/api/users/updatePassword`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setSnackbar({ open: true, message: 'Password updated successfully!', severity: 'success' });
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
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle forgot password
  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/forgotpassword`, { email: profile.email });
      setSnackbar({ open: true, message: 'Reset link sent to email', severity: 'success' });
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
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
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

  // Show loading indicator while fetching initial data
  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-indigo-50 min-h-screen py-4 md:py-6">
      <div className="container mx-auto px-4 flex flex-col min-h-screen">
        {/* Header Section - Using imported KidsHeader */}
        <KidsHeader 
          profile={profile}
          wallet={null}
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
                  <i className="fas fa-user text-blue-500"></i> Profile Information
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
                      <i className="fas fa-save"></i>
                    )}
                    Save Changes
                  </button>
                ) : (
                  <button 
                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    onClick={() => setEditMode(true)}
                  >
                    <i className="fas fa-edit"></i> Edit Profile
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <i className="fas fa-user"></i>
                    </span>
                    <input
                      type="text"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={profile.name}
                      onChange={handleProfileChange('name')}
                      disabled={!editMode}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <i className="fas fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={profile.email}
                      onChange={handleProfileChange('email')}
                      disabled={!editMode}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <i className="fas fa-phone"></i>
                    </span>
                    <input
                      type="tel"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={profile.phone}
                      onChange={handleProfileChange('phone')}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Password Settings */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <i className="fas fa-lock text-blue-500"></i> Change Password
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility('current')}
                    >
                      <i className={`fas ${showPassword.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
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
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility('new')}
                    >
                      <i className={`fas ${showPassword.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
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
                      <i className="fas fa-lock"></i>
                    </span>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={togglePasswordVisibility('confirm')}
                    >
                      <i className={`fas ${showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
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
                  <i className="fas fa-bell text-blue-500"></i> Notification Preferences
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
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsSettingsPage;