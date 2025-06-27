import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, FileText, DollarSign, User, ChevronDown, CheckCircle, XCircle, Eye, Calendar, School } from 'lucide-react';

// Types
interface User {
  [key: string]: unknown;
  _id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  data?: {
    schoolId?: string;
    academicDetails?: {
      schoolId?: string;
    };
  };
  // Add other user properties as needed
}

interface School {
  school_id: string;
  schoolName: string;
  schoolAddress: string;
  schoolType: string;
}

interface DisputeFormData {
  disputeType: string;
  description: string;
  transactionId: string;
  paymentCategory: string;
  amount: number | '';
  supportingDocuments: string;
  schoolId?: string;
}

interface Transaction {
  _id: string;
  senderWalletId: string;
  receiverWalletId: string;
  transactionType: string;
  category: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: string;
  metadata: {
    initiatedBy: string;
    email: string;
    platform: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Dispute {
  _id: string;
  userId: string;
  disputeType: string;
  description: string;
  disputeDate: string;
  status: string;
  transactionId: Transaction;
  paymentCategory: string;
  amount: number;
  supportingDocuments: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nodes-staging.up.railway.app';

const RaiseDispute: React.FC = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  // Disputes list state
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState('');

  // Schools list for parents
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState('');

  const [formData, setFormData] = useState<DisputeFormData>({
    disputeType: '',
    description: '',
    transactionId: '',
    paymentCategory: '',
    amount: '',
    supportingDocuments: '',
    schoolId: ''
  });

  // Dropdown options
  const disputeTypes = [
    { value: 'Billing Issue', label: 'Billing Issue', description: 'Overbilled amount, unrecognized charges' },
    { value: 'Account Discrepancy', label: 'Account Discrepancy', description: 'School wallet not updated after funding' },
    { value: 'Transaction Error', label: 'Transaction Error', description: 'Payment made but not recorded or showing failed' },
    { value: 'Service Concern', label: 'Service Concern', description: 'Paid for report card access or portal login but not granted' },
    { value: 'Other', label: 'Other', description: 'Catch-all for unusual or unclassified cases' }
  ];

  const paymentCategories = [
    { value: 'Deposit', label: 'Deposit' },
    { value: 'Withdrawal', label: 'Withdrawal' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Store Purchase', label: 'Store Purchase' },
    { value: 'Other', label: 'Other' }
  ];

  // Fetch user details function
  const fetchUserDetails = async (authToken: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      let profile: User | undefined;
      if (data.user?.data) {
        profile = data.user.data;
      } else if (data.data) {
        profile = data.data;
      } else if (data.user) {
        profile = data.user as User;
      } else {
        profile = data as User;
      }

      if (!profile) {
        throw new Error('User profile not found in response');
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  // Fetch user disputes function
  const fetchUserDisputes = async (authToken: string): Promise<Dispute[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dispute/getuserdispute`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      let disputesList: Dispute[] = [];
      if (data.disputes) {
        disputesList = data.disputes;
      } else if (data.data) {
        disputesList = data.data;
      } else if (Array.isArray(data)) {
        disputesList = data;
      }

      return disputesList;
    } catch (error) {
      console.error('Error fetching user disputes:', error);
      throw error;
    }
  };

  // Fetch schools list for parents
  const fetchSchools = async (authToken: string): Promise<School[]> => {
    try {
      setSchoolsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/getallSchools`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.schools || data.data || [];
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw error;
    } finally {
      setSchoolsLoading(false);
    }
  };

  // Load user disputes
  const loadUserDisputes = async () => {
    if (!token) return;
    
    setDisputesLoading(true);
    setDisputesError('');
    
    try {
      const userDisputes = await fetchUserDisputes(token);
      setDisputes(userDisputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
      setDisputesError('Failed to load your disputes. Please try again.');
    } finally {
      setDisputesLoading(false);
    }
  };

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('Starting auth initialization...');
        
        // Check if user already in context
        if (auth?.user?._id && auth?.token) {
          console.log('Found user in auth context:', auth.user);
          setUser(auth.user);
          setToken(auth.token);
          setLoading(false);
          return;
        }

        // Try localStorage
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          console.log('No token in localStorage');
          throw new Error('No authentication token found');
        }

        console.log('Found token in localStorage:', storedToken);
        
        // Fetch user from API
        console.log('Fetching user from API...');
        const profile = await fetchUserDetails(storedToken);
        console.log('Successfully fetched user profile:', profile);
        
        setUser(profile);
        setToken(storedToken);
        
        // Ensure all required User fields are present as strings for AuthContext compatibility
        const mergedUser: User = {
          _id: profile._id,
          name: typeof profile.name === 'string' ? profile.name : '',
          email: typeof profile.email === 'string' ? profile.email : '',
          role: typeof profile.role === 'string' ? profile.role : '',
          schoolId: profile.schoolId || profile.data?.schoolId || profile.data?.academicDetails?.schoolId || '',
        };
        auth?.login?.(mergedUser, storedToken);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        setErrorMessage('Authentication error. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth]);

  // Load disputes when token is available and list tab is active
  useEffect(() => {
    if (token && activeTab === 'list') {
      loadUserDisputes();
    }
  }, [token, activeTab]);

  // Load schools if user is a parent
  useEffect(() => {
    if (token && user?.role === 'parent') {
      const loadSchools = async () => {
        try {
          const schoolsList = await fetchSchools(token);
          setSchools(schoolsList);
        } catch (error) {
          console.error('Error loading schools:', error);
          setSchoolsError('Failed to load schools. Please try again.');
        }
      };
      loadSchools();
    }
  }, [token, user?.role]);

  // Set schoolId in form data based on user role
  useEffect(() => {
    if (user) {
      // For store or kid roles, automatically set the schoolId
      if (['store', 'kid', 'student'].includes(user.role)) {
        const schoolId = user.schoolId || 
                         (user.data && (user.data.schoolId || 
                                       (user.data.academicDetails && user.data.academicDetails.schoolId)));
        if (schoolId) {
          setFormData(prev => ({
            ...prev,
            schoolId: schoolId as string
          }));
        }
      }
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  // Submit dispute
  const handleSubmit = async () => {
    if (!token || !user) {
      setErrorMessage('Authentication required. Please login again.');
      return;
    }

    // Validation
    if (!formData.disputeType || !formData.description || !formData.transactionId || 
        !formData.paymentCategory || formData.amount === '') {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    // Additional validation for parents to select a school
    if (user.role === 'parent' && !formData.schoolId) {
      setErrorMessage('Please select a school for your dispute.');
      return;
    }

    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const payload = {
        disputeType: formData.disputeType,
        description: formData.description,
        transactionId: formData.transactionId,
        paymentCategory: formData.paymentCategory,
        amount: Number(formData.amount),
        supportingDocuments: formData.supportingDocuments || "",
        schoolId: formData.schoolId || undefined
      };

      const response = await fetch(`${API_BASE_URL}/api/dispute/createdispute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Dispute created successfully:', result);
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        disputeType: '',
        description: '',
        transactionId: '',
        paymentCategory: '',
        amount: '',
        supportingDocuments: '',
        schoolId: user.role === 'parent' ? '' : formData.schoolId // Keep school if not parent
      });

      // Refresh disputes list if on list tab
      if (activeTab === 'list') {
        loadUserDisputes();
      }

    } catch (error) {
      console.error('Error creating dispute:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit dispute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border border-gray-200">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {errorMessage || 'Please login to access the dispute system.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-7 w-7 text-orange-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dispute Management</h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">Submit and manage your disputes for transaction or service issues</p>
          
          {/* User Info */}
          <div className="mt-6 flex items-center space-x-2 text-sm sm:text-base text-gray-600 bg-gray-50 p-3 rounded-lg">
            <User className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Logged in as:</span>
            <span className="text-gray-800 font-semibold">{user.name || user.email || user._id}</span>
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {user.role || 'user'}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create Dispute
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Disputes
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-semibold text-base sm:text-lg">Dispute submitted successfully!</p>
                <p className="text-green-700 text-sm sm:text-base mt-1">Your dispute has been received and is being processed.</p>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'error' && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-semibold text-base sm:text-lg">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'create' ? (
          // Create Dispute Form
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200">
            <div className="space-y-8">
              {/* School Selection for Parents */}
              {user.role === 'parent' && (
                <div>
                  <label htmlFor="schoolId" className="block text-base font-semibold text-gray-800 mb-3">
                    Select School *
                  </label>
                  {schoolsLoading ? (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600 mr-3"></div>
                      <span className="text-gray-600">Loading schools...</span>
                    </div>
                  ) : schoolsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                      {schoolsError}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="schoolId"
                        name="schoolId"
                        value={formData.schoolId || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 transition-all duration-200"
                      >
                        <option value="" className="text-gray-500">Select your school</option>
                        {schools.map((school) => (
                          <option key={school.school_id} value={school.school_id} className="text-gray-900">
                            {school.schoolName} - {school.schoolAddress}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}

              {/* Display School for Store/Kid roles */}
              {['store', 'kid', 'student'].includes(user.role) && formData.schoolId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <School className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-blue-800 font-medium">School:</p>
                      <p className="text-blue-900">{formData.schoolId}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dispute Type */}
              <div>
                <label htmlFor="disputeType" className="block text-base font-semibold text-gray-800 mb-3">
                  Dispute Type *
                </label>
                <div className="relative">
                  <select
                    id="disputeType"
                    name="disputeType"
                    value={formData.disputeType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 transition-all duration-200"
                  >
                    <option value="" className="text-gray-500">Select dispute type</option>
                    {disputeTypes.map((type) => (
                      <option key={type.value} value={type.value} className="text-gray-900">
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {formData.disputeType && (
                  <p className="mt-2 text-sm sm:text-base text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {disputeTypes.find(type => type.value === formData.disputeType)?.description}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-base font-semibold text-gray-800 mb-3">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 resize-vertical"
                  placeholder="Please provide detailed information about your dispute..."
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label htmlFor="transactionId" className="block text-base font-semibold text-gray-800 mb-3">
                  Transaction Ref *
                </label>
                <input
                  type="text"
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                  placeholder="e.g., FEE_SCHOOL_1749036472673_27275"
                />
              </div>

              {/* Payment Category */}
              <div>
                <label htmlFor="paymentCategory" className="block text-base font-semibold text-gray-800 mb-3">
                  Payment Category *
                </label>
                <div className="relative">
                  <select
                    id="paymentCategory"
                    name="paymentCategory"
                    value={formData.paymentCategory}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 transition-all duration-200"
                  >
                    <option value="" className="text-gray-500">Select payment category</option>
                    {paymentCategories.map((category) => (
                      <option key={category.value} value={category.value} className="text-gray-900">
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-base font-semibold text-gray-800 mb-3">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Supporting Documents */}
              <div>
                <label htmlFor="supportingDocuments" className="block text-base font-semibold text-gray-800 mb-3">
                  Supporting Documents
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    id="supportingDocuments"
                    name="supportingDocuments"
                    value={formData.supportingDocuments}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    placeholder="Document reference or URL (optional)"
                  />
                </div>
                <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Provide any supporting document references or URLs that might help with your dispute.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white px-6 py-4 text-base sm:text-lg rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:hover:shadow-md"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Dispute'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Disputes List
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Disputes</h2>
                <button
                  onClick={loadUserDisputes}
                  disabled={disputesLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" />
                  <span>{disputesLoading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>

              {disputesError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-medium">{disputesError}</p>
                  </div>
                </div>
              )}

              {disputesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your disputes...</p>
                </div>
              ) : disputes.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
                  <p className="text-gray-600 mb-6">You haven't raised any disputes yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
                  >
                    Create Your First Dispute
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute._id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{dispute.disputeType}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(dispute.status)}`}>
                              {dispute.status || 'Pending'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{dispute.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>₦{dispute.amount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>{dispute.paymentCategory}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(dispute.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-600">
                          <span><strong>Transaction ID:</strong> {dispute.transactionId._id}</span>
                          <span><strong>Reference:</strong> {dispute.transactionId.reference}</span>
                          {dispute.supportingDocuments && dispute.supportingDocuments[0] && (
                            <span><strong>Documents:</strong> {dispute.supportingDocuments[0]}</span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>Transaction Details:</strong> {dispute.transactionId.description}</p>
                          <p><strong>Amount:</strong> ₦{dispute.transactionId.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section - only show on create tab */}
        {activeTab === 'create' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-3 text-base sm:text-lg">What happens next?</h3>
                <ul className="text-blue-800 text-sm sm:text-base space-y-2 leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Your dispute will be reviewed by our support team</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>You'll receive updates on the status of your dispute</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Most disputes are resolved within 3-5 business days</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>You may be contacted for additional information if needed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaiseDispute;