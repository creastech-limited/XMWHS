import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import KidsHeader from '../components/KidsHeader';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// Icons
import { 
  ArrowLeft, 
  Download, 
  RefreshCcw, 
  User, 
  CreditCard, 
  History, 
  GraduationCap, 
  Settings
} from 'lucide-react';

// Define types to match KidsHeader expectations
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
  // Add other profile fields as needed
}

interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
  // Add other wallet fields as needed
}

const KidPayAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token;
  
  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [qrAnimating, setQrAnimating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(1); // Pay Agent tab active by default
  
  // Ref for the QR code element
  const qrRef = useRef<HTMLDivElement>(null);
  
  // API URL - adjust this to match your environment
  const API_URL = process.env.REACT_APP_API_URL || 'https://nodes-staging.up.railway.app';

  // Define navigation items
  const navItems = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
  ];

  // Notification helper function
  const showNotification = (message: string, type: 'success' | 'error') => {
    console.log(`${type}: ${message}`);
    // You can integrate with your notification system here
  };

  // Fetch user profile
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
      fetchUserWallet();
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError("Failed to load profile data");
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
      setWallet(walletData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError("Failed to load wallet data");
      setIsLoading(false);
      showNotification("Error fetching wallet data", "error");
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserProfile();
  }, [API_URL, token, navigate]);

  // Generate unique QR code ID based on user data
  const generateQRCodeId = (): string => {
    if (!profile || !wallet) return '';
    
    const timestamp = Date.now();
    const userId = profile._id || profile.qrCodeId || 'unknown';
    const userName = profile.name || profile.fullName || 'user';
    return `kid-${userId}-${userName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;
  };

  const handleDownloadQRCode = () => {
    if (qrRef.current && profile) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        const fileName = profile.name || profile.fullName || 'user';
        downloadLink.download = `${fileName}-qr-code.png`.toLowerCase().replace(/\s+/g, '-');
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setSnackbarOpen(true);
        
        // Auto-hide snackbar after 3 seconds
        setTimeout(() => setSnackbarOpen(false), 3000);
      }
    }
  };

  const refreshQRCode = () => {
    setQrAnimating(true);
    // Simulate refreshing the QR code (in production, you might want to regenerate the timestamp)
    setTimeout(() => setQrAnimating(false), 1000);
  };

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

  const qrCodeId = generateQRCodeId();

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

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 text-center relative overflow-hidden">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 inline-block relative mb-6">
            Pay to Agent
            <div className="absolute h-1 w-1/3 bg-gradient-to-r from-indigo-600 to-transparent bottom-[-8px] left-1/3 rounded-full"></div>
          </h1>
          
          <p className="text-gray-600 max-w-xl mx-auto mb-8 text-lg">
            Present this QR Code to the agent. The agent will scan your unique QR Code to process your payment safely.
          </p>
          
          <div 
            ref={qrRef}
            className={`flex flex-col items-center my-8 p-6 rounded-xl bg-gradient-to-br from-white to-indigo-50 shadow-md max-w-sm mx-auto relative transition-all duration-300 ${
              qrAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
            }`}
          >
            <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
              <QRCodeCanvas 
                value={qrCodeId} 
                size={240} 
                level="H" 
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#4338ca" 
              />
            </div>
            
            <p className="text-sm text-gray-500 mt-2 break-all">
              Unique ID: <span className="font-bold text-indigo-700">{qrCodeId}</span>
            </p>
            
            <button 
              onClick={refreshQRCode}
              className="absolute top-3 right-3 p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
              title="Refresh QR Code"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={handleDownloadQRCode}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-700 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="text-center mt-2 mb-12">
          <Link 
            to="/kidswallet"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Toast notification for download success */}
        {snackbarOpen && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg bg-green-600 text-white shadow-lg flex items-center gap-2 animate-fade-in-up z-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>QR Code downloaded successfully!</span>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default KidPayAgentPage;