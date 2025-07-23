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
  MessageSquare,
  Key
} from 'lucide-react';

interface UserData {
  _id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  profilePicture: string;
  qrCodeId?: string;
  createdAt?: string;
  isPinSet?: boolean;
  wallet?: {
    balance: number;
    currency: string;
    walletId: string;
  };
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
  walletId?: string;
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
  email?: string;
  phone?: string;
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

type PinData = {
  currentPin: string;
  newPin: string;
  confirmPin: string;
};

type PinErrors = {
  currentPin?: string;
  newPin?: string;
  confirmPin?: string;
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => {
  const re = /^\+?[\d\s-]{10,15}$/;
  return re.test(phone);
};

const validatePasswordStrength = (password: string): {valid: boolean, message?: string} => {
  if (password.length < 8) return {valid: false, message: 'Password must be at least 8 characters'};
  if (!/[A-Z]/.test(password)) return {valid: false, message: 'Password must contain at least one uppercase letter'};
  if (!/[a-z]/.test(password)) return {valid: false, message: 'Password must contain at least one lowercase letter'};
  if (!/[0-9]/.test(password)) return {valid: false, message: 'Password must contain at least one number'};
  if (!/[^A-Za-z0-9]/.test(password)) return {valid: false, message: 'Password must contain at least one special character'};
  return {valid: true};
};

const KidsSettingsPage: React.FC = () => {
  const auth = useAuth();
  const token = auth?.token;
  
  const [profile, setProfile] = useState<UserData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageActions, setShowImageActions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: ''
  });
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [notifications, setNotifications] = useState<Notifications>({
    transactionNotifications: true,
    lowBalanceAlert: true,
    monthlyReports: true
  });

  const [pinData, setPinData] = useState<PinData>({ 
    currentPin: '', 
    newPin: '', 
    confirmPin: '' 
  });
  
  const [pinErrors, setPinErrors] = useState<PinErrors>({});
  const [showPin, setShowPin] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';
  
  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
    { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];
  
  const [activeTab, setActiveTab] = useState<number>(4);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity: type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 5000);
  };

  useEffect(() => {
    if (!editMode) {
      setPasswordErrors({});
    }
  }, [editMode]);

  const fetchUserProfile = async () => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return null;
    }

    try {
      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let userData: UserData;
      if (response.data?.user?.data) {
        userData = response.data.user.data;
        const walletData = response.data.user.wallet;
        
        const fullProfilePictureUrl = userData.profilePicture 
          ? `${API_URL}${userData.profilePicture}`
          : '';

        // Set the complete user data
        setUser({
          ...userData,
          name: userData.name || `${userData.firstName} ${userData.lastName}`,
          profilePicture: fullProfilePictureUrl,
          isPinSet: userData.isPinSet,
          wallet: walletData
        });

        // Set profile data for the form
        setProfile({
          ...userData,
          name: userData.name || `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          phone: userData.phone || userData.phoneNumber || '',
          profilePicture: fullProfilePictureUrl,
          createdAt: userData.createdAt || '',
          isPinSet: userData.isPinSet,
          wallet: walletData
        });

        // Update form data
        setFormData({
          name: userData.name || `${userData.firstName} ${userData.lastName}` || '',
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
      } else {
        throw new Error("Invalid user data structure");
      }
    } catch (err: unknown) {
      console.error('Error fetching profile:', err);
      let errorMessage = 'Failed to load profile data';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
      showNotification("Error fetching profile", "error");
      throw err;
    }
  };

  // ... rest of your component logic and return statement ...
const fetchUserWallet = async () => {
  if (!token) return;
  
  try {
    // If we already have wallet data from the user response, use that
    if (user?.wallet) {
      setWallet(user.wallet);
      return user.wallet;
    }

    // Otherwise fall back to API call
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
    setWallet({ balance: 0, currency: 'USD', walletId: '' });
  }
};

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await fetchUserProfile();
        await fetchUserWallet();
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [token, API_URL]);
  
  const togglePasswordVisibility = (field: keyof typeof showPassword) => () => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const handleFormChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (field === 'email' && passwordErrors.email) {
      setPasswordErrors(prev => ({ ...prev, email: undefined }));
    }
    if (field === 'phone' && passwordErrors.phone) {
      setPasswordErrors(prev => ({ ...prev, phone: undefined }));
    }
  };
  
  const handleNotificationChange = (field: keyof Notifications) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({ ...prev, [field]: e.target.checked }));
  };
  
  const handlePasswordChange = (field: keyof PasswordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
    if (field === 'newPassword' && passwordErrors.newPassword) {
      setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
    }
    if (field === 'confirmPassword' && passwordErrors.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };
  
  const validatePasswordForm = (): boolean => {
    const errors: PasswordErrors = {};
    let isValid = true;

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else {
      const strengthCheck = validatePasswordStrength(passwordData.newPassword);
      if (!strengthCheck.valid) {
        errors.newPassword = strengthCheck.message;
        isValid = false;
      }
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };
  
  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate form fields
    const errors: PasswordErrors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g., +1234567890)';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      showNotification('Please fix the errors in the form', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        ...(formData.phone && { phone: formData.phone }),
        settings: notifications
      };
      
      const response = await axios.put(
        `${API_URL}/api/users/update-user/${profile?._id}`, 
        updateData, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Update local state with the response
      if (response.data.user) {
        const updatedUser = response.data.user;
        setProfile(updatedUser);
        setUser(updatedUser);
        
        // Update form data to ensure consistency
        setFormData({
          name: updatedUser.name || updatedUser.fullName || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || updatedUser.phoneNumber || '',
          joinDate: updatedUser.createdAt ? new Date(updatedUser.createdAt).toLocaleDateString() : 'N/A'
        });

        showNotification('Profile updated successfully!', 'success');
        setEditMode(false);
      } else {
        throw new Error("Invalid response structure");
      }
      
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      let errorMessage = 'Profile update failed';
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/users/updatePassword`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      showNotification('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      
    } catch (error) {
      console.error('Password update error:', error);
      
      let errorMessage = 'Failed to update password';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMessage = 'Current password is incorrect';
          setPasswordData(prev => ({ ...prev, currentPassword: '' }));
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await axios.post(`${API_URL}/api/users/forgotpassword`, { email: formData.email });
      showNotification('Reset link sent to your email', 'success');
    } catch (err: unknown) {
      let errorMessage = 'Failed to send reset link';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || errorMessage;
      }
      showNotification(errorMessage, 'error');
    }
  };

  const togglePinVisibility = (field: keyof typeof showPin) => () => {
    setShowPin(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePinChange = (field: keyof PinData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPinData(prev => ({ ...prev, [field]: value }));
    
    if (pinErrors[field]) {
      setPinErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isSettingNewPin = !user?.isPinSet;
    
    // Validate PINs
    const errors: PinErrors = {};
    let isValid = true;

    if (isSettingNewPin) {
      if (pinData.newPin.length !== 4) {
        errors.newPin = 'PIN must be exactly 4 digits';
        isValid = false;
      }
    } else {
      if (pinData.currentPin.length !== 4) {
        errors.currentPin = 'Current PIN must be 4 digits';
        isValid = false;
      }
      
      if (pinData.newPin.length !== 4) {
        errors.newPin = 'New PIN must be exactly 4 digits';
        isValid = false;
      }
    }

    if (pinData.newPin !== pinData.confirmPin) {
      errors.confirmPin = 'PINs do not match';
      isValid = false;
    }

    if (!isValid) {
      setPinErrors(errors);
      showNotification('Please fix the PIN errors', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const endpoint = isSettingNewPin ? 'set' : 'update';
      const payload = isSettingNewPin 
        ? { pin: pinData.newPin }
        : { currentPin: pinData.currentPin, newPin: pinData.newPin };

      await axios.post(
        `${API_URL}/api/pin/${endpoint}`,
        payload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      showNotification(
        isSettingNewPin 
          ? 'PIN set successfully! Your account is now more secure.' 
          : 'PIN updated successfully! Your new PIN is now active.',
        'success'
      );
      
      // Clear form and update user state
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      setPinErrors({});
      setUser(prev => prev ? { ...prev, isPinSet: true } : null);
      
    } catch (error) {
      console.error('PIN operation failed:', error);
      
      let errorMessage = `Failed to ${isSettingNewPin ? 'set' : 'update'} PIN`;
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Current PIN is incorrect. Please try again.';
          setPinData(prev => ({ ...prev, currentPin: '' }));
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid PIN format. Please ensure your PIN is 4 digits.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file (JPEG, PNG, etc.)', 'error');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image size should be less than 5MB', 'error');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setSelectedImage(file);
    setShowImageActions(true);
  };

  const handleProfilePicUpload = async () => {
    if (!selectedImage || !token) return;

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('profile', selectedImage);
      
      const response = await axios.post(`${API_URL}/api/users/upload-profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data?.profilePicture) {
        const newProfilePic = `${API_URL}${response.data.profilePicture}`;
        
        // Update both profile and user states
        setProfile(prev => ({
          ...prev!,
          profilePicture: newProfilePic
        }));
        
        setUser(prev => prev ? { 
          ...prev, 
          profilePicture: newProfilePic 
        } : null);
        
        // Clear the selected image and preview
        setSelectedImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setShowImageActions(false);
        
        showNotification('Profile picture updated successfully!', 'success');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      let errorMessage = 'Failed to upload profile picture';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          errorMessage = 'Image file is too large (max 5MB)';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid image format';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelProfilePicUpload = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setShowImageActions(false);
  };

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
        <KidsHeader 
          profile={profile}
          wallet={wallet || { balance: 0 }}
        />
  
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
  
        <div className="flex-1 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" /> Profile Information
                </h2>
                {editMode ? (
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleProfileSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
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

              {/* Profile Picture Upload Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-200">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={profile?.profilePicture || '/default-profile.png'} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <label className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-center">
                  Change Photo
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    disabled={uploadingImage}
                  />
                </label>
                
                {showImageActions && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleProfilePicUpload}
                      disabled={uploadingImage}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {uploadingImage ? (
                        <>
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelProfilePicUpload}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                    >
                      <span className="text-xs">Cancel</span>
                    </button>
                  </div>
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
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Email*</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-4 py-2 rounded-lg border ${passwordErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={formData.email}
                      onChange={handleFormChange('email')}
                      disabled={!editMode}
                      placeholder="Enter your email"
                      title="Email"
                      required
                    />
                  </div>
                  {passwordErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      className={`block text-gray-700 mb-2 w-full pl-10 pr-4 py-2 rounded-lg border ${passwordErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-transparent'}`}
                      value={formData.phone}
                      onChange={handleFormChange('phone')}
                      disabled={!editMode}
                      placeholder="e.g. +1234567890"
                    />
                  </div>
                  {passwordErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.phone}</p>
                  )}
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
            
            {/* Password Change Section */}
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

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium">Password Requirements:</p>
                  <ul className="list-disc pl-5 text-blue-800 text-sm mt-1">
                    <li className={passwordData.newPassword.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>One lowercase letter</li>
                    <li className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>One number</li>
                    <li className={/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>One special character</li>
                  </ul>
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

            {/* PIN Settings Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-500" /> 
                  {user?.isPinSet ? 'Change Security PIN' : 'Set Security PIN'}
                </h2>
                {user?.isPinSet && (
                  <button
                    type="button"
                    onClick={() => setUser(prev => prev ? { ...prev, isPinSet: false } : null)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Set New PIN Instead
                  </button>
                )}
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {user?.isPinSet 
                    ? 'You can update your existing PIN by entering your current PIN and setting a new one.'
                    : 'Set a 4-digit security PIN for your account. This will be required for sensitive operations.'
                  }
                </p>
              </div>

              <form onSubmit={handlePinUpdate} className="space-y-4">
                {user?.isPinSet && (
                  <div>
                    <label className="block text-gray-700 mb-1">Current PIN</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPin.current ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-2 rounded-lg border ${
                          pinErrors.currentPin ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black'
                        }`}
                        value={pinData.currentPin}
                        onChange={handlePinChange('currentPin')}
                        placeholder="Enter current PIN"
                        inputMode="numeric"
                        maxLength={4}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        onClick={togglePinVisibility('current')}
                        title={showPin.current ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pinErrors.currentPin && (
                      <p className="mt-1 text-sm text-red-600">{pinErrors.currentPin}</p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">{user?.isPinSet ? 'New PIN' : 'Set PIN'}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPin.new ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-2 rounded-lg border ${
                          pinErrors.newPin ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black'
                        }`}
                        value={pinData.newPin}
                        onChange={handlePinChange('newPin')}
                        placeholder="Enter 4-digit PIN"
                        inputMode="numeric"
                        maxLength={4}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        onClick={togglePinVisibility('new')}
                        title={showPin.new ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pinErrors.newPin && (
                      <p className="mt-1 text-sm text-red-600">{pinErrors.newPin}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1">Confirm {user?.isPinSet ? 'New PIN' : 'PIN'}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPin.confirm ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-2 rounded-lg border ${
                          pinErrors.confirmPin ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black'
                        }`}
                        value={pinData.confirmPin}
                        onChange={handlePinChange('confirmPin')}
                        placeholder="Confirm 4-digit PIN"
                        inputMode="numeric"
                        maxLength={4}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        onClick={togglePinVisibility('confirm')}
                        title={showPin.confirm ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pinErrors.confirmPin && (
                      <p className="mt-1 text-sm text-red-600">{pinErrors.confirmPin}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        {user?.isPinSet ? 'Updating...' : 'Setting...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {user?.isPinSet ? 'Update PIN' : 'Set PIN'}
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Your PIN must be exactly 4 digits and will be used to authorize transactions.
                </p>
              </div>
            </div>
            
            {/* Notification Preferences Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg col-span-1 lg:col-span-3">
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