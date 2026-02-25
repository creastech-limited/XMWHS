import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import Footer from "../../components/Footer";
import KidsHeader from "../../components/KidsHeader";
import RaiseDispute from "../../components/RaiseDispute";
import { useAuth } from "../../context/AuthContext";

import {
  User,
  CreditCard,
  History,
  GraduationCap,
  Settings,
  MessageSquare,
} from "lucide-react";

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
  qrcode?: string;
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
}

interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
  type?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

const Kdispute: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(5);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const showNotification = (message: string, type: "success" | "error") => {
    console.log(`${type}: ${message}`);
  };

  // Fetch Wallet
  const fetchUserWallet = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/wallet/getuserwallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const walletData: Wallet =
        res.data?.data || res.data || ({} as Wallet);

      setWallet(walletData);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message || "Failed to load wallet data";

      setError(message);
      showNotification(message, "error");
    }
  }, [API_URL, token]);

  // Fetch Profile
  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      setError("Authentication required");
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);

      const res = await axios.get(`${API_URL}/api/users/getuserone`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = res.data;

      const userData: Profile =
        data?.user?.data ||
        data?.user ||
        data?.data ||
        data ||
        ({} as Profile);

      if (!userData) throw new Error("Invalid user data");

      // Fix names for header compatibility
      if (userData.firstName && userData.lastName) {
        userData.fullName = `${userData.firstName} ${userData.lastName}`;
      }
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      setProfile(userData);

      // If wallet included, use it
      if (data?.user?.wallet) {
        setWallet(data.user.wallet);
      } else {
        await fetchUserWallet();
      }

      setIsLoading(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message || "Failed to load profile";

      setError(message);
      setIsLoading(false);
      showNotification(message, "error");
    }
  }, [API_URL, token, navigate, fetchUserWallet]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Loading Screen
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

  // Error Screen
  if (error || !profile || !wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to Load Data
          </h2>

          <p className="text-gray-600 mb-4">
            {error || "Failed to load profile or wallet information"}
          </p>

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

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 md:py-8">
      <div className="container mx-auto max-w-5xl px-4 flex flex-col min-h-screen">
        <KidsHeader profile={profile} wallet={wallet} />

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-md">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { label: "Dashboard", icon: <User />, route: "/kidswallet" },
              { label: "Pay Agent", icon: <CreditCard />, route: "/kidpayagent" },
              { label: "History", icon: <History />, route: "/kidpaymenthistory" },
              { label: "School Bills", icon: <GraduationCap />, route: "/schoolbills" },
              { label: "Settings", icon: <Settings />, route: "/ksettings" },
              { label: "Dispute", icon: <MessageSquare />, route: "/kdispute" },
            ].map((item, index) => (
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
                {item.icon}
                <span className="text-xs md:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">
          <main className="flex-1">
            <RaiseDispute />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Kdispute;