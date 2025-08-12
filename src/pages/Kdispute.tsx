import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import KidsHeader from '../components/KidsHeader';
import RaiseDispute from '../components/RaiseDispute';
import { useAuth } from '../context/AuthContext';

// Icons
import { 
  User, 
  CreditCard, 
  History, 
  GraduationCap, 
  Settings,
  MessageSquare
} from 'lucide-react';

// Define types to match KidsHeader expectations and API response
interface Profile {
  _id: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  profilePic?: string;
  qrCodeId?: string;
  accountNumber?: string;
  pin?: string;
  role?: string;
  qrcode?: string; // Base64 QR code from database
  schoolName?: string;
  schoolAddress?: string;
  schoolType?: string;
  ownership?: string;
  registrationDate?: string;
  schoolId?: string;
  store_id?: string;
  schoolRegistrationLink?: string;
  isFirstLogin?: boolean;
  isPinSet?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  Link?: string;
  // Add other profile fields as needed
}

interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
  type?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  // Add other wallet fields as needed
}

const Kdispute: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token;
  
  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(5); // Dispute tab active (assuming it's the 6th tab)
  
  // API URL - adjust this to match your environment
  const API_URL = import.meta.env.VITE_API_BASE_UR;

  // Define navigation items
  const navItems = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
    { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];

  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error') => {
    console.log(`${type}: ${message}`);
    // You can integrate with your notification system here
  };

  // Fetch user profile using /api/users/getuserone
  const fetchUserProfile = async () => {
    if (!token) {
      setError("Authentication required");
      setIsLoading(false);
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data); // Debug log

      let userData: Profile;
      // Handle different response structures
      if (response.data.user) {
        userData = response.data.user.data || response.data.user;
      } else {
        userData = response.data.data || response.data;
      }

      // Extract wallet data if it exists in the same response
      if (response.data.user && response.data.user.wallet) {
        const walletData = response.data.user.wallet;
        setWallet(walletData);
        console.log('Wallet data from user response:', walletData);
      }

      // Ensure we have the proper name structure for KidsHeader
      if (userData.firstName && userData.lastName && !userData.fullName) {
        userData.fullName = `${userData.firstName} ${userData.lastName}`;
      }
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      console.log('Processed user data:', userData);
      setProfile(userData);
      
      // Only fetch wallet separately if not already included in the response
      if (!response.data.user?.wallet) {
        await fetchUserWallet();
      } else {
        setIsLoading(false);
      }
      
    } catch (err: unknown) {
      console.error('Error fetching profile:', err);
      let errorMessage = "Failed to load profile data";
      if (err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "message" in err.response.data) {
        errorMessage = (err.response as { data?: { message?: string } }).data?.message || errorMessage;
      }
      setError(errorMessage);
      setIsLoading(false);
      showNotification("Error fetching profile", "error");
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
      console.log('Wallet data:', walletData);
      setWallet(walletData);
      setIsLoading(false);
    } catch (err: unknown) {
      console.error('Error fetching wallet:', err);
      let errorMessage = "Failed to load wallet data";
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        errorMessage = (err.response as { data?: { message?: string } }).data?.message || errorMessage;
      }
      setError(errorMessage);
      setIsLoading(false);
      showNotification("Error fetching wallet data", "error");
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserProfile();
  }, [API_URL, token, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile || !wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Data</h2>
          <p className="text-gray-600 mb-4">{error || "Failed to load profile or wallet information"}</p>
          <button 
            onClick={fetchUserProfile}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl px-4 flex flex-col min-h-screen">
        {/* Using imported KidsHeader component with real data */}
        <KidsHeader 
          profile={profile}
          wallet={wallet}
        />

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-md">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item, index) => (
              <Link 
                key={item.label} 
                to={item.route}
                className={`flex-shrink-0 flex flex-col md:flex-row items-center px-4 md:px-6 py-4 md:py-3 min-w-[80px] md:min-w-[120px] gap-2 border-b-2 transition-all ${
                  index === activeTab 
                    ? "border-indigo-600 text-indigo-600 font-semibold" 
                    : "border-transparent text-gray-600 hover:bg-indigo-50"
                }`}
                onClick={() => setActiveTab(index)}
              >
                <div className="text-center md:text-left">
                  {item.icon}
                </div>
                <span className="text-xs md:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
         
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Content Container */}
          <div className="flex flex-col min-h-full">
            {/* Main Content */}
            <main className="flex-1">
              <RaiseDispute />
            </main>
             
            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kdispute;