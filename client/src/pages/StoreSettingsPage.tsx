import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  Phone, 
  Shield, 
  User, 
  Bell, 
  Mail, 
  Edit2, 
  Save, 
  CreditCard, 
  Settings as SettingsIcon, 
  Lock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import StoreHeader from "../components/StoreHeader";
import StoreSidebar from "../components/StoreSidebar";
import Footer from "../components/Footer";
import axios from "axios";
import { useAuth } from '../context/AuthContext';

type UserData = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  createdAt?: string;
  [key: string]: string | undefined | unknown;
};

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  joinDate: string;
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
  email: boolean;
  push: boolean;
  transactions: boolean;
  marketing: boolean;
};

type ShowPassword = {
  current: boolean;
  new: boolean;
  confirm: boolean;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
};

type TabPanelProps = {
  children: React.ReactNode;
  value: number;
  index: number;
};

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <div className="pt-4">{children}</div>}
    </div>
  );
}

const StoreSettingsPage = () => {
  const auth = useAuth();
  const ctxToken = auth?.token;
  
  const [token] = useState(ctxToken || localStorage.getItem('token'));
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData>({ 
    name: '', 
    email: '', 
    phone: '', 
    profilePic: '',
    joinDate: 'N/A'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [notifications, setNotifications] = useState<Notifications>({ 
    email: true, 
    push: true, 
    transactions: true, 
    marketing: false 
  });
  const [showPassword, setShowPassword] = useState<ShowPassword>({ 
    current: false, 
    new: false, 
    confirm: false 
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [tabIndex, setTabIndex] = useState(0);

  const API_BASE_URL = 'https://nodes-staging.up.railway.app';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setSnackbar({ open: true, message: 'No authentication token found.', severity: 'error' });
        return;
      }
      
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/getuserone`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (res.data?.user?.data) {
          setUser(res.data.user.data);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setSnackbar({ 
          open: true, 
          message: 'Authentication error. Please login again.', 
          severity: 'error' 
        });
      }
    };

    fetchUserData();
  }, [token]);

  useEffect(() => {
    if (!user) return;
    
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      profilePic: user.profilePic || '',
      joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
    });
  }, [user]);


  const handleProfileChange = (field: keyof ProfileData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfile(prev => ({ ...prev, profilePic: URL.createObjectURL(file) }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userid = user?._id;
      if (!userid) throw new Error("User ID not found");
      
      await axios.put(`${API_BASE_URL}/api/users/update-user/${userid}`, {
        name: profile.name, 
        email: profile.email, 
        phone: profile.phone
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setSnackbar({ open: true, message: 'Profile updated!', severity: 'success' });
      setIsEditing(false);
      
      const res = await axios.get(`${API_BASE_URL}/api/users/getuserone`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data?.user?.data) {
        setUser(res.data.user.data);
      }
    } catch (err) {
      const error = err as unknown;
      let errorMessage = 'Update failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
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

  const handlePasswordChange = (field: keyof PasswordData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
    };

  const togglePasswordVisibility = (field: keyof ShowPassword) => () => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = (): boolean => {
    const errs: PasswordErrors = {};
    if (!passwordData.currentPassword) errs.currentPassword = 'Required';
    if (!passwordData.newPassword) errs.newPassword = 'Required';
    else if (passwordData.newPassword.length < 8) errs.newPassword = 'Min 8 chars';
    if (passwordData.newPassword !== passwordData.confirmPassword) errs.confirmPassword = 'No match';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    try {
      await axios.post(`${API_BASE_URL}/api/users/updatePassword`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSnackbar({ open: true, message: 'Password updated!', severity: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const error = err as unknown;
      let errorMessage = 'Password update failed';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (error as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    }
  };

  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/forgotpasword`, { email: profile.email });
      setSnackbar({ open: true, message: 'Reset link sent to email', severity: 'success' });
    } catch (err) {
      const error = err as unknown;
      let errorMessage = 'Request failed';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (error as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    }
  };

  const handleNotificationChange = (key: keyof Notifications) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNotifications(prev => ({ ...prev, [key]: e.target.checked }));
    };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePinChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPin = formData.get('currentPin') as string;
    const newPin = formData.get('newPin') as string;
    const confirmPin = formData.get('confirmPin') as string;
    
    if (newPin !== confirmPin) { 
      setSnackbar({ open: true, message: 'PINs do not match', severity: 'error'}); 
      return; 
    }
    
    try {
      const res = await axios.post(`${API_BASE_URL}/api/users/changepin`, 
        { currentPin, newPin }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ 
        open: true, 
        message: res.data.message || 'PIN changed', 
        severity: 'success' 
      });
    } catch (err) {
      const error = err as unknown;
      let errorMessage = 'Failed to change PIN';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (error as { response?: { data?: { message?: string } } }).response!.data!.message!;
      }
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    }
  };

  if (!user && token) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <StoreHeader />
        <div className="flex flex-1">
          <StoreSidebar />
          <div className="flex-1 p-4 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading user data...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="text-gray-600 flex flex-col min-h-screen bg-gray-100">
      <StoreHeader />
      <div className="flex flex-1">
        <StoreSidebar />
        <div className="flex-1 p-4">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-6 gap-3">
              <SettingsIcon className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setTabIndex(0)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    tabIndex === 0 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => setTabIndex(1)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    tabIndex === 1 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Password
                </button>
                <button
                  onClick={() => setTabIndex(2)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    tabIndex === 2 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </button>
                <button
                  onClick={() => setTabIndex(3)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    tabIndex === 3 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Pin
                </button>
              </nav>
            </div>

            <TabPanel value={tabIndex} index={0}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 text-center">
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mx-auto">
                        {profile.profilePic ? (
                          <img 
                            src={profile.profilePic} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100">
                            <User className="w-16 h-16 text-blue-500" />
                          </div>
                        )}
                      </div>
                      
                      <input
                        accept="image/*"
                        className="hidden"
                        id="profile-pic-upload"
                        type="file"
                        onChange={handleProfilePicChange}
                      />
                      <label 
                        htmlFor="profile-pic-upload"
                        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4 text-gray-700" />
                      </label>
                    </div>
                    
                    <label htmlFor="profile-pic-upload" className="mt-3 inline-block">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        Change Photo
                      </button>
                    </label>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member since</h3>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {profile.joinDate}
                    </p>
                  </div>
                </div>
                
                <div className="md:col-span-3">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Profile Information</h2>
                    <button
                      type={isEditing ? "submit" : "button"}
                      onClick={!isEditing ? () => setIsEditing(true) : undefined}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium ${
                        isEditing 
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      form={isEditing ? undefined : undefined} // keep for clarity, but not needed
                    >
                      {isEditing ? (
                        <>
                          {isLoading ? (
                            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          Edit Profile
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 mb-6"></div>
                  
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="name"
                            className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                              isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                            } focus:ring-blue-500 focus:border-blue-500`}
                            value={profile.name}
                            onChange={handleProfileChange('name')}
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="email"
                              id="email"
                              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              } focus:ring-blue-500 focus:border-blue-500`}
                              value={profile.email}
                              onChange={handleProfileChange('email')}
                              readOnly={!isEditing}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              id="phone"
                              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                                isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                              } focus:ring-blue-500 focus:border-blue-500`}
                              value={profile.phone}
                              onChange={handleProfileChange('phone')}
                              readOnly={!isEditing}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="mt-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm flex justify-center items-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </TabPanel>

            <TabPanel value={tabIndex} index={1}>
              <div className="max-w-lg mx-auto">
                <h2 className="text-lg font-medium mb-4">Change Your Password</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword.current ? "text" : "password"}
                        id="currentPassword"
                        className={`block w-full pl-10 pr-10 py-2 rounded-md border ${
                          passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-blue-500 focus:border-blue-500`}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange('currentPassword')}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={togglePasswordVisibility('current')}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          {showPassword.current ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        id="newPassword"
                        className={`block w-full px-3 py-2 rounded-md border ${
                          passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-blue-500 focus:border-blue-500`}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange('newPassword')}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={togglePasswordVisibility('new')}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          {showPassword.new ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        id="confirmPassword"
                        className={`block w-full px-3 py-2 rounded-md border ${
                          passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-blue-500 focus:border-blue-500`}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange('confirmPassword')}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={togglePasswordVisibility('confirm')}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          {showPassword.confirm ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot Password?
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </TabPanel>

            <TabPanel value={tabIndex} index={2}>
              <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
              <p className="text-sm text-gray-500 mb-6">
                Customize how and when we contact you. You can always change these settings later.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-base font-medium mb-3">Notification Channels</h3>
                <div className="border-t border-gray-200 mb-4"></div>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label htmlFor="email-notifications" className="block text-sm font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Receive updates and alerts via email
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={notifications.email}
                      onChange={handleNotificationChange('email')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="email-notifications"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        notifications.email ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
                          notifications.email ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="push-notifications" className="block text-sm font-medium text-gray-700">
                      Push Notifications
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Receive updates and alerts on your device
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="push-notifications"
                      checked={notifications.push}
                      onChange={handleNotificationChange('push')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="push-notifications"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        notifications.push ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
                          notifications.push ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-base font-medium mb-3">Types of Notifications</h3>
                <div className="border-t border-gray-200 mb-4"></div>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label htmlFor="transaction-alerts" className="block text-sm font-medium text-gray-700">
                      Transaction Alerts
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Get notified about any changes to your account balance
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="transaction-alerts"
                      checked={notifications.transactions}
                      onChange={handleNotificationChange('transactions')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="transaction-alerts"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        notifications.transactions ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
                          notifications.transactions ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="marketing-communications" className="block text-sm font-medium text-gray-700">
                      Marketing Communications
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="marketing-communications"
                      checked={notifications.marketing}
                      onChange={handleNotificationChange('marketing')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="marketing-communications"
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                        notifications.marketing ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
                          notifications.marketing ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setSnackbar({ 
                      open: true, 
                      message: 'Notification preferences updated!', 
                      severity: 'success' 
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
                >
                  Save Preferences
                </button>
              </div>
            </TabPanel>

            <TabPanel value={tabIndex} index={3}>
              <h2 className="text-lg font-medium mb-4">Change PIN</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <form onSubmit={handlePinChange}>
                  <div className="mb-4">
                    <label htmlFor="currentPin" className="block text-sm font-medium text-gray-700 mb-1">
                      Current PIN
                    </label>
                    <input
                      type="password"
                      id="currentPin"
                      name="currentPin"
                      className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-1">
                      New PIN
                    </label>
                    <input
                      type="password"
                      id="newPin"
                      name="newPin"
                      className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      id="confirmPin"
                      name="confirmPin"
                      className="block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="text-right">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
                    >
                      Update PIN
                    </button>
                  </div>
                </form>
              </div>
            </TabPanel>
          </div>
          
          {snackbar.open && (
            <div
              className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-md shadow-lg ${
                snackbar.severity === 'success' ? 'bg-green-600' :
                snackbar.severity === 'error' ? 'bg-red-600' :
                snackbar.severity === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
              } text-white`}
            >
              <div className="flex items-center">
                {snackbar.severity === 'success' && (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                {snackbar.severity === 'error' && (
                  <AlertCircle className="mr-2 h-5 w-5" />
                )}
                <span>{snackbar.message}</span>
                <button
                  onClick={handleSnackbarClose}
                  className="ml-4"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StoreSettingsPage;