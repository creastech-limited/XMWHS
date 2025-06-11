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
} from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  createdAt?: string;
}

// Tabs without the Payment option
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

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profilePic: '',
    createdAt: '',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // PIN State
  const [pinData, setPinData] = useState({ pin: '', confirmPin: '' });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transactions: true,
    marketing: false,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/getuserone`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.user?.data) {
          setUser(res.data.user.data);
          setProfile({
            name: res.data.user.data.name,
            email: res.data.user.data.email,
            phone: res.data.user.data.phone,
            profilePic: res.data.user.data.profilePic,
            createdAt: res.data.user.data.createdAt || '',
          });
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
      await axios.put(`${API_BASE_URL}/api/users/update-user/${user?._id}`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Password Update Handler (Dummy)
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully!');
    }, 1200);
  };

  // PIN Update Handler
  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinData.pin !== pinData.confirmPin) {
      alert('PINs do not match');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/pin/set`, { pin: pinData.pin }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('PIN updated successfully');
      setPinData({ pin: '', confirmPin: '' });
    } catch (error) {
      console.error('PIN update failed:', error);
      alert('Failed to update PIN');
    } finally {
      setIsLoading(false);
    }
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

  // Profile Picture Upload Handler
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile(prev => ({
        ...prev,
        profilePic: URL.createObjectURL(file)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-6 sm:mb-8">Account Settings</h1>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation - Responsive */}
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
                  <div className="relative group">
                    <img
                      className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-lg border-4 border-indigo-100"
                      src={profile.profilePic || '/default-avatar.png'}
                      alt="Profile"
                    />
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 sm:p-3 rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition-colors">
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicChange}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-sm sm:text-xl text-gray-600 mt-1">{profile.email}</p>
                    {profile.createdAt && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        Member since {new Date(profile.createdAt).toLocaleDateString()}
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
                  Set Security PIN
                </h3>
                <form className="space-y-6 sm:space-y-8" onSubmit={handlePinUpdate}>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">PIN</label>
                      <input
                        type="password"
                        value={pinData.pin}
                        onChange={(e) => setPinData({ ...pinData, pin: e.target.value })}
                        className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="4-digit PIN"
                        maxLength={6}
                        disabled={isLoading}
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter a 4-digit security PIN</p>
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Confirm PIN</label>
                      <input
                        type="password"
                        value={pinData.confirmPin}
                        onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value })}
                        className="w-full px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Confirm PIN"
                        maxLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Set PIN'}
                    </button>
                  </div>
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