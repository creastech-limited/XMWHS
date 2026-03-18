import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  Bell,
  Camera,
  ShieldCheck,
  KeyRound,
  Mail,
  Smartphone,
  DollarSign,
  Megaphone,
  Check,
  X,
} from 'lucide-react';
import { getUserDetails, requestPinReset, setAccountPin, updateAccountPin, updateNotificationPreferences, updateUserPassword, updateUserProfile, uploadProfileImage, verifyPinOtp, } from '../services';
import type { UpdateUserPayload } from '../types';


interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture: string;
  createdAt?: string;
  isPinSet?: boolean;
  wallet?: {
    balance: number;
    currency: string;
    walletId: string;
  };
}

const TABS = [
  { label: 'Profile', icon: <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> },
  { label: 'Security', icon: <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> },
  { label: 'Notifications', icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> },
];

// Generate initials-based avatar to avoid loading non-existent default-avatar.png
const generateInitialsAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background color based on name hash
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const hue = Math.abs(hash) % 360;

    ctx.fillStyle = `hsl(${hue}, 60%, 60%)`;
    ctx.fillRect(0, 0, 100, 100);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 50, 50);
  }

  return canvas.toDataURL();
};

const SettingsPanel = () => {
  const authContext = useAuth();
  const token = authContext?.token;
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageActions, setShowImageActions] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'pin' | 'otp'>('pin');


  const [otpValue, setOtpValue] = useState('');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });


  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: '',
    createdAt: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [pinData, setPinData] = useState({
    currentPin: '',
    pin: '',
    newPin: ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transactions: true,
    marketing: false,
  });


  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Function to get avatar with fallback to initials
  const getAvatarUrl = (profilePictureUrl: string, userName: string): string => {
    if (avatarError || !profilePictureUrl) {
      return generateInitialsAvatar(userName || 'User');
    }
    return profilePictureUrl;
  };

  // Handle avatar error by switching to initials
  const handleAvatarError = () => {
    setAvatarError(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const response = await getUserDetails();

        if (response.user?.data) {
          const userData = response.user.data;
          const walletData = response.user.wallet;

          const fullProfilePictureUrl = userData.profilePicture
            ? `${API_BASE_URL}${userData.profilePicture}`
            : (userData.profilePic ? `${API_BASE_URL}${userData.profilePic}` : '');

          const displayName = (userData.name || `${userData.firstName ?? ''} ${userData.lastName ?? ''}`).trim() || 'User';

          // We manually construct the object to satisfy the 'UserData' interface
          setUser({
            ...userData, // Spread existing properties
            name: displayName,
            profilePicture: fullProfilePictureUrl, // Fix: Explicitly assign to match UserData
            isPinSet: !!userData.isPinSet,
            wallet: walletData ? {
              balance: walletData.balance,
              currency: walletData.currency ?? 'NGN',
              walletId: walletData.walletId ?? ''
            } : undefined,
            phone: typeof userData.phone === 'string' ? userData.phone : ''
          });

          setProfile({
            name: displayName,
            email: userData.email,
            phone: typeof userData.phone === 'string' ? userData.phone : '',
            profilePicture: fullProfilePictureUrl,
            createdAt: String(userData.createdAt || userData.registrationDate || ''),
          });

          setSelectedImage(null);
          setImagePreview(null);
          setShowImageActions(false);
          setAvatarError(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [token, API_BASE_URL]); // Removed logout from dependencies

  // Profile Update Handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?._id || !token) return;

    setIsLoading(true);
    try {
      // 1. Prepare payload matching your UpdateUserPayload interface
      const payload: UpdateUserPayload = {
        name: profile.name,
        email: profile.email,
        phone: typeof profile.phone === 'string' ? profile.phone : ''
      };

      // 2. Call the decoupled service
      const updatedData = await updateUserProfile(user._id, payload);

      // 3. Update local state with the returned data
      if (updatedData) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            name: typeof updatedData.name === 'string' ? updatedData.name : prev.name,
            email: typeof updatedData.email === 'string' ? updatedData.email : prev.email,
            phone: typeof updatedData.phone === 'string' ? updatedData.phone : prev.phone,
            profilePicture: typeof updatedData.profilePicture === 'string' ? updatedData.profilePicture : prev.profilePicture,
            wallet: updatedData.wallet ? {
              balance: updatedData.wallet.balance,
              currency: updatedData.wallet.currency ?? prev.wallet?.currency ?? 'NGN',
              walletId: updatedData.wallet.walletId ?? prev.wallet?.walletId ?? ''
            } : prev.wallet
          };
        });
        alert('Profile updated successfully!');
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Update Handler
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation Logic (Remains in component)
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Call the decoupled service
      await updateUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // 3. Reset state on success
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Password update failed:', error);
      alert('Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  // PIN Update Handler
  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pinData.pin !== pinData.newPin) {
      alert('PINs do not match. Please ensure both PIN fields are identical.');
      return;
    }

    if (pinData.pin.length !== 4 || !/^\d{4}$/.test(pinData.pin)) {
      alert('PIN must be exactly 4 digits (0-9).');
      return;
    }

    setIsLoading(true);

    try {
      if (user?.isPinSet) {

        if (!pinData.currentPin || pinData.currentPin.length !== 4 || !/^\d{4}$/.test(pinData.currentPin)) {
          alert('Please enter your current 4-digit PIN.');
          setIsLoading(false);
          return;
        }

        await updateAccountPin({
          currentPin: pinData.currentPin,
          newPin: pinData.newPin
        });

        alert('PIN updated successfully! Your new PIN is now active.');
      } else {

        await setAccountPin({ pin: pinData.pin });

        alert('PIN set successfully! Your account is now more secure.');
        setUser(prev => prev ? { ...prev, isPinSet: true } : null);
      }

      setPinData({ currentPin: '', pin: '', newPin: '' });

    } catch (error) {
      console.error('PIN operation failed:', error);

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401) {
        alert('Current PIN is incorrect. Please try again.');
      } else if (status === 400) {
        alert('Invalid PIN format. Please ensure your PIN is 4 digits.');
      } else {
        alert(`Failed to ${user?.isPinSet ? 'update' : 'set'} PIN. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleOpenResetModal = () => {
    setPinData({ currentPin: '', pin: '', newPin: '' }); // Reset the input
    setResetStep('pin');     // Ensure we start at the PIN step
    setIsModalOpen(true);    // Open the modal
  };

  // STEP 1: Request Reset (Backend sends OTP to email)
 const handleRequestOtp = async () => {
  if (pinData.pin.length < 4) {
    setSnackbar({ open: true, message: "Please enter a 4-digit PIN", severity: 'error' });
    return;
  }

  setIsLoading(true);
  try {
    await requestPinReset(pinData.pin);
    setResetStep('otp');
    setSnackbar({ open: true, message: "OTP sent to your email!", severity: 'success' });
  } catch (error: unknown) {
    let msg = "Failed to send OTP";
    
    if (axios.isAxiosError(error)) {
      msg = error.response?.data?.error || error.response?.data?.message || msg;
    } else if (error instanceof Error) {
      msg = error.message;
    }

    setSnackbar({ open: true, message: msg, severity: 'error' });
  } finally {
    setIsLoading(false);
  }
};

  // STEP 2: Verify OTP and Finalize Reset
  const handleFinalReset = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (otpValue.length < 6) {
    setSnackbar({ open: true, message: "Please enter the 6-digit OTP", severity: 'error' });
    return;
  }

  setIsLoading(true);
  try {
    await verifyPinOtp(otpValue, pinData.pin);

    setSnackbar({ open: true, message: "PIN reset successfully!", severity: 'success' });
    setIsModalOpen(false);
    setResetStep('pin');
    setPinData({ ...pinData, pin: '' });
    setOtpValue('');
    setUser(prev => prev ? { ...prev, isPinSet: true } : null);
  } catch (error: unknown) {
    let msg = "Verification failed";

    if (axios.isAxiosError(error)) {
      msg = error.response?.data?.error || error.response?.data?.message || msg;
    } else if (error instanceof Error) {
      msg = error.message;
    }

    setSnackbar({ open: true, message: msg, severity: 'error' });
  } finally {
    setIsLoading(false);
  }
};

  // Profile Picture Upload Handler
  const handleProfilePicUpload = async () => {
    if (!selectedImage || !token) return;

    setUploadingImage(true);

    try {
      const data = await uploadProfileImage(selectedImage);

      if (data && data.profilePicture) {
        const newProfilePic = `${API_BASE_URL}${data.profilePicture}`;

        setProfile(prev => ({
          ...prev,
          profilePicture: newProfilePic
        }));

        setUser(prev => prev ? {
          ...prev,
          profilePicture: newProfilePic
        } : null);

        setSelectedImage(null);
        setImagePreview(null);
        setShowImageActions(false);
        setAvatarError(false);

        alert('Profile picture updated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: unknown) {
      console.error('Profile picture upload failed:', error);

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 413) {
        alert('Image file is too large. Please choose a smaller image.');
      } else if (status === 400) {
        alert('Invalid image format. Please choose a valid image file.');
      } else {
        alert('Failed to upload profile picture. Please try again.');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // Profile Picture Change Handler
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setShowImageActions(true);
      setAvatarError(false);
    }
  };

  // Cancel Profile Picture Upload Handler
  const cancelProfilePicUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setShowImageActions(false);
    setAvatarError(false);
  };

  // Notification Preferences Update Handler
  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?._id) return;

    setIsLoading(true);
    try {

      await updateNotificationPreferences(user._id, notifications);

      alert('Notification preferences updated successfully');
    } catch (error) {
      console.error('Notification update failed:', error);
      alert('Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-6 sm:mb-8">Account Settings</h1>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {TABS.map((tab, index) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors ${activeTab === index
                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 0 && (
            <div className="p-4 sm:p-10">
              <form onSubmit={handleProfileUpdate} className="space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-8 space-y-6 sm:space-y-0 mb-6 sm:mb-10">
                  <div className="relative group flex flex-col items-center">
                    <div className="relative">
                      <img
                        className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-lg border-4 border-indigo-100"
                        src={
                          imagePreview ||
                          getAvatarUrl(profile.profilePicture, profile.name)
                        }
                        alt="Profile"
                        onError={handleAvatarError}
                      />
                      <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 sm:p-3 rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition-colors">
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePicChange}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>

                    {/* Profile picture upload controls */}
                    {showImageActions && (
                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleProfilePicUpload}
                          disabled={uploadingImage}
                          className="flex items-center justify-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {uploadingImage ? (
                            <span className="loading loading-spinner loading-xs mr-1"></span>
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelProfilePicUpload}
                          disabled={uploadingImage}
                          className="flex items-center justify-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center sm:text-left">
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-sm sm:text-xl text-gray-600 mt-1">{profile.email}</p>
                    {profile.createdAt && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        Member since {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    {user?.wallet && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        Wallet Balance: {user.wallet.currency} {user.wallet.balance.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Full Name"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Email Address"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Phone Number"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 sm:space-x-4 mt-6 sm:mt-10">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 1 && (
            <div className="p-4 sm:p-10 space-y-8 sm:space-y-12">
              {/* Password Update Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center mb-4 sm:mb-6">
                  <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-indigo-500" />
                  Change Password
                </h3>
                <form className="space-y-6 sm:space-y-8" onSubmit={handlePasswordUpdate}>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Current Password"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="New Password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Confirm Password"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* PIN Management Section */}
              <div className="pt-8 sm:pt-10 border-t border-gray-200">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center mb-4 sm:mb-6">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-indigo-500" />
                  {user?.isPinSet ? 'Update Security PIN' : 'Set Up Security PIN'}
                </h3>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {user?.isPinSet
                      ? 'You have a security PIN set. Enter your current PIN and create a new 4-digit PIN to update it.'
                      : 'Enhance your account security by setting up a 4-digit PIN. This PIN will be required for sensitive operations.'
                    }
                  </p>
                </div>

                <form className="space-y-6 sm:space-y-8" onSubmit={handlePinUpdate}>
                  {user?.isPinSet ? (
                    // UPDATE PIN FORM (when user has existing PIN)
                    <>
                      <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                          Current PIN *
                        </label>
                        <input
                          type="password"
                          value={pinData.currentPin}
                          onChange={(e) => {
                            // Only allow numeric input and limit to 4 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPinData({ ...pinData, currentPin: value });
                          }}
                          className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your current 4-digit PIN"
                          maxLength={4}
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                          New PIN *
                        </label>
                        <input
                          type="password"
                          value={pinData.pin}
                          onChange={(e) => {
                            // Only allow numeric input and limit to 4 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPinData({ ...pinData, pin: value });
                          }}
                          className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter new 4-digit PIN"
                          maxLength={4}
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                          Confirm New PIN *
                        </label>
                        <input
                          type="password"
                          value={pinData.newPin}
                          onChange={(e) => {
                            // Only allow numeric input and limit to 4 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPinData({ ...pinData, newPin: value });
                          }}
                          className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Confirm new 4-digit PIN"
                          maxLength={4}
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        {user?.isPinSet && (
                          <button
                            type="button"
                            onClick={handleOpenResetModal}
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-600 font-medium underline underline-offset-4 justify-end"
                          >
                            Forgot PIN?
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading || pinData.currentPin.length !== 4 || pinData.pin.length !== 4 || pinData.newPin.length !== 4}
                          className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Updating PIN...' : 'Update PIN'}
                        </button>
                      </div>

                    </>
                  ) : (
                    // SET NEW PIN FORM (when user doesn't have PIN) - keep this as is
                    <>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Create PIN *
                          </label>
                          <input
                            type="password"
                            value={pinData.pin}
                            onChange={(e) => {
                              // Only allow numeric input and limit to 4 digits
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setPinData({ ...pinData, pin: value });
                            }}
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Create 4-digit PIN"
                            maxLength={4}
                            disabled={isLoading}
                            required
                          />
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">Choose a secure 4-digit PIN</p>
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Confirm PIN *
                          </label>
                          <input
                            type="password"
                            value={pinData.newPin}
                            onChange={(e) => {
                              // Only allow numeric input and limit to 4 digits
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setPinData({ ...pinData, newPin: value });
                            }}
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Confirm 4-digit PIN"
                            maxLength={4}
                            disabled={isLoading}
                            required
                          />
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">Re-enter your PIN to confirm</p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading || pinData.pin.length !== 4 || pinData.newPin.length !== 4}
                          className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Setting PIN...' : 'Set PIN'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 2 && (
            <div className="p-4 sm:p-10">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center mb-4 sm:mb-6">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-indigo-500" />
                Notification Preferences
              </h3>
              <form className="space-y-6 sm:space-y-8" onSubmit={handleNotificationUpdate}>
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mr-3 sm:mr-4" />
                    <div className="flex-1">
                      <label htmlFor="emailNotifications" className="text-sm sm:text-base font-medium text-gray-800">
                        Email Notifications
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Receive notifications via email</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <input
                        id="emailNotifications"
                        name="emailNotifications"
                        type="checkbox"
                        checked={notifications.email}
                        onChange={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mr-3 sm:mr-4" />
                    <div className="flex-1">
                      <label htmlFor="pushNotifications" className="text-sm sm:text-base font-medium text-gray-800">
                        Push Notifications
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Receive notifications on your device</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <input
                        id="pushNotifications"
                        name="pushNotifications"
                        type="checkbox"
                        checked={notifications.push}
                        onChange={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mr-3 sm:mr-4" />
                    <div className="flex-1">
                      <label htmlFor="transactionNotifications" className="text-sm sm:text-base font-medium text-gray-800">
                        Transaction Notifications
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Get notified about transactions and activity</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <input
                        id="transactionNotifications"
                        name="transactionNotifications"
                        type="checkbox"
                        checked={notifications.transactions}
                        onChange={() => setNotifications(prev => ({ ...prev, transactions: !prev.transactions }))}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mr-3 sm:mr-4" />
                    <div className="flex-1">
                      <label htmlFor="marketingNotifications" className="text-sm sm:text-base font-medium text-gray-800">
                        Marketing Notifications
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Receive updates, news and special offers</p>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <input
                        id="marketingNotifications"
                        name="marketingNotifications"
                        type="checkbox"
                        checked={notifications.marketing}
                        onChange={() => setNotifications(prev => ({ ...prev, marketing: !prev.marketing }))}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 sm:pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-white/20">

            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-800">
                {resetStep === 'pin' ? 'Set New PIN' : 'Verify OTP'}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {resetStep === 'pin'
                  ? 'Enter 4 digits to secure your account'
                  : `Enter the code sent to ${profile?.email}`}
              </p>
            </div>

            {resetStep === 'pin' ? (
              <div className="space-y-8">
                {/* PIN GRID - Added onClick to focus the hidden input */}
                <div
                  className="flex justify-between gap-3 cursor-pointer"
                  onClick={() => document.getElementById('hidden-pin-input')?.focus()}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold transition-all duration-150
                ${pinData.pin.length === i ? 'border-indigo-600 bg-indigo-50 scale-105' : 'border-slate-100 bg-slate-50'}
                ${pinData.pin[i] ? 'border-slate-800 bg-white text-slate-800' : 'text-slate-300'}`}
                    >
                      {pinData.pin[i] ? '●' : ''} {/* Use dots for security or pinData.pin[i] for visibility */}
                    </div>
                  ))}
                </div>

                <input
                  id="hidden-pin-input"
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  className="absolute opacity-0 h-0 w-0"
                  value={pinData.pin}
                  onChange={(e) => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                />

                <button
                  onClick={handleRequestOtp}
                  disabled={isLoading || pinData.pin.length < 4}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:bg-slate-200 transition-all shadow-lg"
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <input
                  type="text"
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-black text-4xl font-black tracking-widest focus:border-indigo-600 focus:bg-white outline-none transition-all"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => { setResetStep('pin'); setOtpValue(''); }}
                    className="flex-1 py-4 font-bold text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalReset}
                    disabled={isLoading || otpValue.length < 6}
                    className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 shadow-lg disabled:bg-slate-200"
                  >
                    {isLoading ? 'Verifying...' : 'Reset PIN'}
                  </button>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setResetStep('pin');
                setPinData({ ...pinData, pin: '' });
                setOtpValue('');
              }}
              className="mt-8 w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* CUSTOM SNACKBAR - THIS CLEARS THE "SNACKBAR NEVER READ" ERROR */}
      {snackbar.open && (
        <div className={`fixed bottom-5 right-5 z-[110] px-6 py-3 rounded-lg shadow-xl text-white ${snackbar.severity === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          <div className="flex items-center gap-3">
            <span>{snackbar.message}</span>
            <button onClick={() => setSnackbar({ ...snackbar, open: false })}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;