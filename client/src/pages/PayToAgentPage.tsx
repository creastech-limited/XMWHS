import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Psidebar from '../components/Psidebar';
import Footer from '../components/Footer';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

// Define interfaces for type safety
interface User {
  [key: string]: unknown;
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  accountNumber: string;
  role: string;
  pin: string;
  qrcode?: string;
  wallet?: {
    id: string;
    balance: number;
    currency: string;
    type: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ApiResponse {
  message: string;
  user: {
    data: User;
    pin: string;
    Link: string;
    wallet: User['wallet'];
  };
}

const PayToAgentPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string>('');
  
  // Create a ref for the QRCodeCanvas element
  const qrRef = useRef<HTMLDivElement>(null);

  // Get auth context
  const auth = useAuth();

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';

  // Get token from auth context or localStorage
  const getAuthToken = (): string | null => {
    // First try to get from auth context
    if (auth?.token) return auth.token;
    
    // Fallback to localStorage
    return localStorage.getItem('token');
  };

  // Fetch user details from API
  const fetchUserDetails = async (token: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log('API Response:', data);

      // Handle different response structures as per your analysis
      let profile: User;
      if (data.user?.data) {
        profile = {
          ...data.user.data,
          pin: data.user.pin,
          wallet: data.user.wallet
        };
      } else if (data.user) {
        // Fallback: try to extract user data from data.user if possible
        if ('data' in data.user && typeof data.user.data === 'object') {
          profile = {
            ...data.user.data,
            pin: (data.user as { pin: string }).pin,
            wallet: (data.user as { wallet: User['wallet'] }).wallet
          };
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        throw new Error('Invalid response structure');
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  // Generate QR code data with user payment information
  const generateQRCodeData = (userData: User): string => {
    const paymentData = {
      userId: userData._id,
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      accountNumber: userData.accountNumber,
      role: userData.role,
      pin: userData.pin, // Include pin for transaction verification
      wallet: {
        id: userData.wallet?.id,
        balance: userData.wallet?.balance,
        currency: userData.wallet?.currency || 'NGN'
      },
      timestamp: new Date().toISOString(),
      type: 'payment_request'
    };

    // Convert to JSON string for QR code
    return JSON.stringify(paymentData);
  };

  // Initialize user data and QR code
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting auth initialization...');
        
        // Check if user is already in auth context
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          // Ensure all required User fields are present
          const mergedUser: User = {
            _id: auth.user._id,
            firstName: typeof auth.user.firstName === 'string' ? auth.user.firstName : '',
            lastName: typeof auth.user.lastName === 'string' ? auth.user.lastName : '',
            name: auth.user.name || `${auth.user.firstName || ''} ${auth.user.lastName || ''}`,
            email: auth.user.email || '',
            accountNumber: typeof auth.user.accountNumber === 'string' ? auth.user.accountNumber : '',
            role: auth.user.role || '',
            pin: typeof auth.user.pin === 'string' ? auth.user.pin : (auth.user.pin ? String(auth.user.pin) : ''),
            qrcode: typeof auth.user.qrcode === 'string' ? auth.user.qrcode : undefined,
            wallet: (typeof auth.user.wallet === 'object' && auth.user.wallet !== null
              && 'id' in auth.user.wallet
              && 'balance' in auth.user.wallet
              && 'currency' in auth.user.wallet
              && 'type' in auth.user.wallet
              && 'email' in auth.user.wallet
              && 'firstName' in auth.user.wallet
              && 'lastName' in auth.user.wallet
            )
              ? auth.user.wallet as User['wallet']
              : undefined
          };
          setUser(mergedUser);
          // Generate QR code data with existing user data
          const qrCodeData = generateQRCodeData(mergedUser);
          setQrData(qrCodeData);
          setLoading(false);
          return;
        }

        // Try to get token
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }

        console.log('Found token, fetching user details...');
        const userData = await fetchUserDetails(token);
        
        console.log('User data received:', userData);
        setUser(userData);

        // Update auth context with fresh data
        if (auth?.login) {
          auth.login(userData, token);
        }

        // Generate QR code data
        const qrCodeData = generateQRCodeData(userData);
        setQrData(qrCodeData);

      } catch (error) {
        console.error('Error initializing user data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load user data');
        
        // If authentication fails, you might want to redirect to login
        // or clear the auth context
        if (auth?.logout) {
          auth.logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUserData();
  }, [auth]); // Include auth in dependencies

  // Function to download the QR Code image
  const handleDownload = () => {
    if (qrRef.current) {
      // Get the canvas element and its data URL
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        // Create a temporary link element
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `payment-qr-${user?.firstName || 'user'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  // Retry function for error state
  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/psettings"/>
        <div className="flex flex-grow">
          <div className="w-64 bg-white shadow-md">
            <Psidebar />
          </div>
          <div className="flex-grow p-6 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your payment QR code...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header profilePath="/psettings"/>
        <div className="flex flex-grow">
          <div className="w-64 bg-white shadow-md">
            <Psidebar />
          </div>
          <div className="flex-grow p-6 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading QR Code</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - Full width at the top */}
      <Header profilePath="/psettings"/>
     
      {/* Main content area with sidebar and content */}
      <div className="flex flex-grow">
        {/* Sidebar - Fixed width */}
        <div className="w-64 bg-white shadow-md">
          <Psidebar />
        </div>
       
        {/* Main content - Flexible width */}
        <div className="flex-grow p-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-2">
              Pay to Agent
            </h1>
            <p className="text-center mb-4">
              Use your unique QR Code to pay for goods and services at the agent.
            </p>

            {/* User Info Display */}
            {user && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium text-black">{user.name || `${user.firstName} ${user.lastName}`}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account:</span>
                    <span className="ml-2 font-medium text-black">{user.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-black">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Balance:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {user.wallet?.currency || 'NGN'} {user.wallet?.balance || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div
              ref={qrRef}
              className="flex flex-col items-center mt-8"
            >
              {qrData && (
                <QRCodeCanvas
                  value={qrData}
                  size={256}
                  level="H"
                  includeMargin={true}
                  className="border border-gray-200 rounded-lg"
                />
              )}
              <p className="text-sm text-center mt-4 max-w-md text-gray-600">
                Show this QR Code to the agent to complete your payment. 
                The QR code contains your account details and current balance for secure transactions.
              </p>
              <div className="flex gap-4 mt-6">
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md transition-colors"
                  onClick={handleDownload}
                >
                  Download QR Code
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Refresh QR Code
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-800">Security Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Only share this QR code with trusted agents for legitimate transactions. 
                    Your PIN is included for transaction verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
     
      {/* Footer - Full width at the bottom */}
      <Footer />
    </div>
  );
};

export default PayToAgentPage;