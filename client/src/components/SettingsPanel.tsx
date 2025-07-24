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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const userRes = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.data?.user?.data) {
          const userData = userRes.data.user.data;
          const walletData = userRes.data.user.wallet;
          
          const fullProfilePictureUrl = userData.profilePicture 
            ? `${API_BASE_URL}${userData.profilePicture}`
            : '';

          setUser({
            ...userData,
            name: userData.name || `${userData.firstName} ${userData.lastName}`,
            profilePicture: fullProfilePictureUrl,
            isPinSet: userData.isPinSet,
            wallet: walletData
          });
          
          setProfile({
            name: userData.name || `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            phone: userData.phone,
            profilePicture: fullProfilePictureUrl,
            createdAt: userData.createdAt || userData.registrationDate || '',
          });

          // Clear any existing image selection when user data loads
          setSelectedImage(null);
          setImagePreview(null);
          setShowImageActions(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [token, API_BASE_URL]);

  // Profile Update Handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/update-user/${user?._id}`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state with the response
      if (response.data) {
        setUser(prev => prev ? { ...prev, ...response.data } : null);
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
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users/updatePassword`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
    
    // Validation
    if (pinData.pin !== pinData. newPin) {
      alert('PINs do not match. Please ensure both PIN fields are identical.');
      return;
    }
    
    if (pinData.pin.length !== 4) {
      alert('PIN must be exactly 4 digits long.');
      return;
    }
    
    // Check if PIN contains only numbers
    if (!/^\d{4}$/.test(pinData.pin)) {
      alert('PIN must contain only numbers (0-9).');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (user?.isPinSet) {
        // Update existing PIN
        if (!pinData.currentPin || pinData.currentPin.length !== 4) {
          alert('Please enter your current 4-digit PIN.');
          setIsLoading(false);
          return;
        }
        
        if (!/^\d{4}$/.test(pinData.currentPin)) {
          alert('Current PIN must be 4 digits.');
          setIsLoading(false);
          return;
        }
        
        await axios.post(`${API_BASE_URL}/api/pin/update`, { 
          currentPin: pinData.currentPin,
           newPin: pinData. newPin 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('PIN updated successfully! Your new PIN is now active.');
      } else {
        // Set new PIN
        await axios.post(`${API_BASE_URL}/api/pin/set`, { 
          pin: pinData.pin 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('PIN set successfully! Your account is now more secure.');
        setUser(prev => prev ? { ...prev, isPinSet: true } : null);
      }
      
      // Clear form data
      setPinData({ currentPin: '', pin: '',  newPin: '' });
      
    } catch (error: unknown) {
      console.error('PIN operation failed:', error);

      // More specific error messages
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response === 'object'
      ) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 401) {
          alert('Current PIN is incorrect. Please try again.');
        } else if (response?.status === 400) {
          alert('Invalid PIN format. Please ensure your PIN is 4 digits.');
        } else {
          alert(`Failed to ${user?.isPinSet ? 'update' : 'set'} PIN. Please try again.`);
        }
      } else {
        alert(`Failed to ${user?.isPinSet ? 'update' : 'set'} PIN. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Profile Picture Upload Handler
    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
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
      
      const response = await axios.post(`${API_BASE_URL}/api/users/upload-profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.profilePicture) {
        const newProfilePic = `${API_BASE_URL}${response.data.profilePicture}`;
        
        // Update both profile and user states
        setProfile(prev => ({
          ...prev,
          profilePicture: newProfilePic
        }));
        
        setUser(prev => prev ? { 
          ...prev, 
          profilePicture: newProfilePic 
        } : null);
        
        // Clear the selected image and preview
        setSelectedImage(null);
        setImagePreview(null);
        setShowImageActions(false);
        
        alert('Profile picture updated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          alert('Image file is too large. Please choose a smaller image.');
        } else if (error.response?.status === 400) {
          alert('Invalid image format. Please choose a valid image file.');
        } else {
          alert('Failed to upload profile picture. Please try again.');
        }
      } else {
        alert('Failed to upload profile picture. Please try again.');
      }
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

  // Notification Preferences Update Handler
  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users/update-notifications/${user?._id}`, notifications, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
                  className={`flex items-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors ${
                    activeTab === index
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
                          profile.profilePicture || 
                          '/default-avatar.png'
                        }
                        alt="Profile"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
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
                      
                      <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
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
                            value={pinData. newPin}
                            onChange={(e) => {
                              // Only allow numeric input and limit to 4 digits
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setPinData({ ...pinData,  newPin: value });
                            }}
                            className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Confirm new 4-digit PIN"
                            maxLength={4}
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading || pinData.currentPin.length !== 4 || pinData.pin.length !== 4 || pinData. newPin.length !== 4}
                          className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Updating PIN...' : 'Update PIN'}
                        </button>
                      </div>
                    </>
                  ) : (
                    // SET NEW PIN FORM (when user doesn't have PIN)
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
                            value={pinData. newPin}
                            onChange={(e) => {
                              // Only allow numeric input and limit to 4 digits
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setPinData({ ...pinData,  newPin: value });
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
                          disabled={isLoading || pinData.pin.length !== 4 || pinData. newPin.length !== 4}
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
    </div>
  );
};

export default SettingsPanel;