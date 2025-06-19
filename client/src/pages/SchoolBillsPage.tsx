import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  CheckCircle, 
  AlertTriangle, 
  Receipt, 
  ArrowLeft,
  User,
  CreditCard,
  History,
  GraduationCap,
  Settings,
  Info,
  MessageSquare
} from 'lucide-react';
import KidsHeader from '../components/KidsHeader';
import Footer from '../components/Footer';

// Define interfaces
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
}

interface Wallet {
  balance: number;
}

// Updated interface to match API response
interface ApiFee {
  _id: string;
  studentId: string;
  feeId: string;
  amount: number;
  feeType: string;
  term: string;
  session: string;
  className: string;
  schoolId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionId: string;
  status: 'Paid' | 'Unpaid' | 'Partial';
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Local interface for display purposes
interface Bill {
  id: string;
  invoice: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  overdue: boolean;
  description: string;
  feeType: string;
  term: string;
  session: string;
  className: string;
  transactionId: string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  route: string;
}

const SchoolBillsPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const activeTab = 3; // School Bills tab
  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token;
  const logout = auth?.logout ?? (() => {});

  // Get API URL
  const API_URL = process.env.REACT_APP_API_URL || 'https://nodes-staging-xp.up.railway.app';

  // Navigation items
  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <User className="w-5 h-5" />, route: "/kidswallet" },
    { label: "Pay Agent", icon: <CreditCard className="w-5 h-5" />, route: "/kidpayagent" },
    { label: "History", icon: <History className="w-5 h-5" />, route: "/kidpaymenthistory" },
    { label: "School Bills", icon: <GraduationCap className="w-5 h-5" />, route: "/schoolbills" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, route: "/ksettings" },
     { label: "Dispute", icon: <MessageSquare className="w-5 h-5" />, route: "/kdispute" },
  ];

  // Transform API data to local Bill interface
  const transformApiFeeToBill = (apiFee: ApiFee): Bill => {
    const dueDate = new Date(apiFee.paymentDate);
    const isOverdue = dueDate < new Date() && apiFee.status !== 'Paid';
    
    return {
      id: apiFee._id,
      invoice: `${apiFee.feeType} - ${apiFee.className}`,
      dueDate: apiFee.paymentDate,
      amount: apiFee.amount,
      amountPaid: apiFee.amountPaid,
      status: apiFee.status,
      overdue: isOverdue,
      description: `${apiFee.term} ${apiFee.feeType.toLowerCase()} fees for ${apiFee.session} academic session`,
      feeType: apiFee.feeType,
      term: apiFee.term,
      session: apiFee.session,
      className: apiFee.className,
      transactionId: apiFee.transactionId
    };
  };

  // Fetch student fees
  const fetchStudentFees = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/fee/getStudentFee`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
       
      });

      if (response.data && response.data.data) {
        const transformedBills = response.data.data.map((fee: ApiFee) => transformApiFeeToBill(fee));
        setBills(transformedBills);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error('Failed to fetch student fees:', err);
      setError("Failed to load school bills");
      // If authentication fails, logout user
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setError("Authentication required");
        setIsLoading(false);
        logout();
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

        // Ensure we have proper name structure for KidsHeader
        if (!userData.name && !userData.fullName) {
          if (userData.firstName && userData.lastName) {
            userData.fullName = `${userData.firstName} ${userData.lastName}`;
            userData.name = userData.fullName;
          } else if (userData.firstName) {
            userData.name = userData.firstName;
            userData.fullName = userData.firstName;
          }
        } else if (userData.name && !userData.fullName) {
          userData.fullName = userData.name;
        } else if (userData.fullName && !userData.name) {
          userData.name = userData.fullName;
        }

        setProfile(userData);
        
        // Fetch wallet and fees in parallel
        await Promise.all([
          fetchUserWallet(),
          fetchStudentFees()
        ]);
        
      } catch (err) {
        setError("Failed to load profile data");
        setIsLoading(false);
        console.error('Profile fetch error:', err);
        // If authentication fails, logout user
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [API_URL, token, navigate, logout]);

  // Fetch user wallet
  const fetchUserWallet = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wallet/getuserwallet`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setWallet(response.data.data || response.data);
    } catch (err) {
      setError("Failed to load wallet data");
      console.error('Wallet fetch error:', err);
      // If authentication fails, logout user
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  // Calculate summary statistics
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = bills.reduce((sum, bill) => sum + bill.amountPaid, 0);
  const unpaidAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get status color
  const getStatusColor = (bill: Bill): string => {
    if (bill.status === "Paid") return "bg-green-100 text-green-800";
    if (bill.status === "Partial") return "bg-blue-100 text-blue-800";
    if (bill.overdue) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  // Get status icon
  const getStatusIcon = (bill: Bill): React.ReactNode => {
    if (bill.status === "Paid") return <CheckCircle className="w-4 h-4" />;
    if (bill.status === "Partial") return <Info className="w-4 h-4" />;
    if (bill.overdue) return <AlertTriangle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  // Get status text
  const getStatusText = (bill: Bill): string => {
    if (bill.status === "Paid") return "Paid";
    if (bill.status === "Partial") return "Partially Paid";
    if (bill.overdue) return "Overdue";
    return "Unpaid";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your school bills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen gap-6">
        {/* Header */}
        {profile && wallet && (
          <KidsHeader profile={profile} wallet={wallet} />
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex overflow-x-auto">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.route}
                className={`flex-1 min-w-max px-4 py-4 flex flex-col md:flex-row items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  index === activeTab
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="text-xs md:text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Bills Card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Bills</h3>
              <div className="bg-blue-100 p-3 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">₦{totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">{bills.length} bills for this term</p>
          </div>

          {/* Paid Amount Card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Paid Amount</h3>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">₦{paidAmount.toLocaleString()}</p>
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${paymentProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {paymentProgress.toFixed(0)}% of total bills paid
              </p>
            </div>
          </div>

          {/* Outstanding Card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Outstanding</h3>
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">₦{unpaidAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">
              {bills.filter(bill => bill.status === "Unpaid" || bill.status === "Partial").length} bills pending payment
            </p>
          </div>
        </div>

        {/* School Bills Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">School Bills</h2>
            <p className="text-gray-600 mt-1">
              Review and manage your school invoices for the current term
            </p>
          </div>
          
          {bills.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills Found</h3>
              <p className="text-gray-600">You don't have any school bills at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bills.map((bill) => (
                <div key={bill.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Bill Info */}
                    <div className="lg:col-span-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          bill.status === "Paid" 
                            ? 'bg-green-100' 
                            : bill.status === "Partial"
                              ? 'bg-blue-100'
                              : bill.overdue 
                                ? 'bg-red-100' 
                                : 'bg-yellow-100'
                        }`}>
                          {bill.status === "Paid" ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Receipt className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{bill.invoice}</h4>
                          <p className="text-sm text-gray-600">{bill.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{bill.term} • {bill.session}</p>
                        </div>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4" />
                        <span>Due: {formatDate(bill.dueDate)}</span>
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="lg:col-span-3">
                      <div className="text-right lg:text-left">
                        <p className="text-lg font-semibold text-gray-900">
                          ₦{bill.amount.toLocaleString()}
                        </p>
                        {bill.amountPaid > 0 && (
                          <p className="text-sm text-green-600">
                            Paid: ₦{bill.amountPaid.toLocaleString()}
                          </p>
                        )}
                        {bill.status === "Partial" && (
                          <p className="text-sm text-red-600">
                            Balance: ₦{(bill.amount - bill.amountPaid).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="lg:col-span-2">
                      <div className="flex justify-end">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill)}`}>
                          {getStatusIcon(bill)}
                          {getStatusText(bill)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-6">
          <Link 
            to="/kidswallet"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default SchoolBillsPage;