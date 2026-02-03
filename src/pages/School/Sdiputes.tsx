import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { Header } from '../../components/Header';
import { Sidebar as Asidebar } from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Interfaces
interface UserProfile {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
}

interface FetchUserDetailsResponse {
    user?: {
        data?: UserProfile;
        [key: string]: unknown;
    };
    data?: UserProfile;
    [key: string]: unknown;
}

interface Dispute {
    _id?: string;
    disputeType?: string;
    description?: string;
    transactionId?: string | {
        _id?: string;
        reference?: string;
        amount?: number;
        status?: string;
        [key: string]: unknown;
    };
    paymentCategory?: string;
    amount?: number;
    supportingDocuments?: string[] | string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    raisedByName?: string;
    raisedByEmail?: string;
    resolvedBy?: {
        _id?: string;
        email?: string;
    };
    resolvedDate?: string;
    [key: string]: unknown;
}

interface FetchDisputesResponse {
    message?: string;
    disputes?: Dispute[];
    data?: Dispute[];
    [key: string]: unknown;
}

interface CreateDisputeData {
    disputeType: string;
    description: string;
    transactionId: string;
    paymentCategory: string;
    amount: number;
    supportingDocuments: string[];
}

interface CreateDisputeResponse {
    message?: string;
    savedDispute?: Dispute;
    dispute?: Dispute;
    data?: Dispute;
    error?: string;
    details?: string;
    [key: string]: unknown;
}

interface StatusColorMap {
    [key: string]: string;
}

interface StatusIconProps {
    status?: string;
}

const DisputePage = () => {
  const auth = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });

  // Form state for creating new dispute
  const [formData, setFormData] = useState({
    disputeType: '',
    description: '',
    transactionId: '',
    paymentCategory: '',
    amount: '',
    supportingDocuments: [] as string[]
  });

  const disputeTypes = [
    'Billing Issue',
    'Account Discrepancy', 
    'Transaction Error',
    'Service Concern',
    'Other'
  ];

  const disputeTypeDescriptions = {
    'Billing Issue': 'Overbilled amount, unrecognized charges',
    'Account Discrepancy': 'School wallet not updated after funding',
    'Transaction Error': 'Payment made but not recorded or showing failed',
    'Service Concern': 'Paid for report card access or portal login but not granted',
    'Other': 'Catch-all for unusual or unclassified cases'
  };

  const paymentCategories = ['Deposit', 'Withdrawal', 'Transfer', 'Store Purchase', 'Other'];
  const statuses = ['Pending', 'Under Investigation', 'Resolved', 'Closed'];

  // Fetch user details
  const fetchUserDetails = async (authToken: string): Promise<UserProfile> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FetchUserDetailsResponse = await response.json();
        
        let profile: UserProfile;
        if (data.user?.data) {
            profile = data.user.data;
        } else if (data.data) {
            profile = data.data;
        } else if (data.user) {
            profile = data.user as UserProfile;
        } else {
            profile = data as UserProfile;
        }

        return profile;
    } catch (error) {
        console.error('Error fetching user details:', error);
        throw error;
    }
  };

  // Fetch disputes - Updated to use getuserdispute endpoint
  const fetchDisputes = async (authToken: string): Promise<Dispute[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dispute/getuserdispute`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FetchDisputesResponse = await response.json();
        
        // Handle different response structures (matching Flutter logic)
        let disputesList: Dispute[] = [];
        if (Array.isArray(data.disputes)) {
            disputesList = data.disputes;
        } else if (data.data && Array.isArray(data.data)) {
            disputesList = data.data as Dispute[];
        } else if (Array.isArray(data)) {
            disputesList = data as Dispute[];
        }
        
        console.log('📡 Fetched disputes:', disputesList.length);
        return disputesList;
    } catch (error) {
        console.error('❌ Error fetching disputes:', error);
        return [];
    }
  };

  // Create new dispute - Updated with enhanced error handling
  const createDispute = async (disputeData: CreateDisputeData): Promise<CreateDisputeResponse> => {
    try {
        console.log('📤 Creating dispute with payload:', JSON.stringify(disputeData));

        const response = await fetch(`${API_BASE_URL}/api/dispute/createdispute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(disputeData)
        });

        console.log('📡 Dispute Response Status:', response.status);

        // Try to parse response even on error
        let responseData: CreateDisputeResponse;
        try {
            responseData = await response.json();
            console.log('📡 Dispute Response Body:', JSON.stringify(responseData));
        } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            throw new Error('Server returned invalid response');
        }

        if (response.ok || response.status === 200 || response.status === 201) {
            return responseData;
        } else {
            // Extract detailed error message from backend (matching Flutter logic)
            let errorMessage = 'Failed to create dispute';

            if (responseData.message) {
                errorMessage = responseData.message;
            } else if (responseData.error) {
                errorMessage = responseData.error;
            } else if (responseData.details) {
                errorMessage = String(responseData.details);
            }

            console.error('❌ Backend Error:', errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('❌ API Error in createDispute:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to create dispute');
    }
  };

  // Initialize auth and fetch data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        if (auth?.user?._id && auth?.token) {
          setToken(auth.token);
          const disputesData = await fetchDisputes(auth.token);
          setDisputes(disputesData);
          setFilteredDisputes(disputesData);
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('No authentication token found');
        }

        const profile = await fetchUserDetails(storedToken);
        setToken(storedToken);

        const mergedUser = {
          _id: profile._id || '',
          name: typeof profile.name === 'string' ? profile.name : '',
          email: typeof profile.email === 'string' ? profile.email : '',
          role: typeof profile.role === 'string' ? profile.role : '',
          ...profile
        };

        const userWithRole: typeof mergedUser & { role: string } = {
          ...mergedUser,
          role: mergedUser.role ?? '',
        };

        if (auth?.login) {
          auth.login(userWithRole, storedToken);
        }

        const disputesData = await fetchDisputes(storedToken);
        setDisputes(disputesData);
        setFilteredDisputes(disputesData);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [auth]);

  // Sort disputes
  const sortedDisputes = React.useMemo(() => {
    const sortableDisputes = [...filteredDisputes];
    if (sortConfig.key) {
      sortableDisputes.sort((a, b) => {
        const aValue = a[sortConfig.key] as string | number | undefined;
        const bValue = b[sortConfig.key] as string | number | undefined;

        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDisputes;
  }, [filteredDisputes, sortConfig]);

  // Request sort
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter disputes
  useEffect(() => {
    let filtered = disputes;

    if (searchTerm) {
      filtered = filtered.filter(dispute => 
        dispute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.disputeType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.raisedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.raisedByEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(dispute => dispute.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(dispute => dispute.disputeType === typeFilter);
    }

    setFilteredDisputes(filtered);
  }, [disputes, searchTerm, statusFilter, typeFilter]);

  // Handle form submission - Updated with all required fields
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.disputeType || !formData.description || !formData.transactionId || 
        !formData.paymentCategory || !formData.amount) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    try {
        setLoading(true);
        
        // Filter out empty document URLs
        const validDocs = formData.supportingDocuments.filter(doc => doc.trim() !== '');
        
        const result: CreateDisputeResponse = await createDispute({
            disputeType: formData.disputeType,
            description: formData.description,
            transactionId: formData.transactionId,
            paymentCategory: formData.paymentCategory,
            amount: parseFloat(formData.amount),
            supportingDocuments: validDocs
        });

        // Handle different response structures
        const newDispute = result.savedDispute || result.dispute || result.data;

        if (newDispute) {
            setDisputes((prev: Dispute[]) => [newDispute, ...prev]);
            setFormData({
                disputeType: '',
                description: '',
                transactionId: '',
                paymentCategory: '',
                amount: '',
                supportingDocuments: []
            });
            setShowCreateForm(false);
            alert('Dispute created successfully!');
        } else {
            throw new Error('Failed to create dispute - no dispute data returned');
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            alert(error.message || 'Error creating dispute. Please try again.');
        } else {
            alert('Error creating dispute. Please try again.');
        }
    } finally {
        setLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string | undefined): string => {
    const statusColorMap: StatusColorMap = {
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Under Investigation': 'bg-blue-100 text-blue-800',
        'Resolved': 'bg-green-100 text-green-800',
        'Closed': 'bg-gray-100 text-gray-800',
    };
    return status ? statusColorMap[status] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status: StatusIconProps['status']): JSX.Element => {
    switch (status) {
        case 'Pending': return <Clock className="w-4 h-4" />;
        case 'Under Investigation': return <AlertCircle className="w-4 h-4" />;
        case 'Resolved': return <CheckCircle className="w-4 h-4" />;
        case 'Closed': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Get sort icon
  const getSortIcon = (key: string): JSX.Element | null => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="w-4 h-4 ml-1" />
        : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  if (loading && disputes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header profilePath="/settings" />
      <div className="flex flex-grow">
        <aside className="z-[100] md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-0 bg-none">
          <Asidebar />
        </aside>
        
        <main className="flex-grow p-4 md:p-8 md:ml-64 overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dispute Management</h1>
                  <p className="text-gray-600">Track and manage your payment disputes</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                  title="Create a new dispute"
                  aria-label="Create a new dispute"
                >
                  <Plus className="w-5 h-5" />
                  Create Dispute
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Disputes</p>
                      <p className="text-2xl font-bold text-gray-900">{disputes.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {disputes.filter(d => d.status === 'Pending').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Under Investigation</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {disputes.filter(d => d.status === 'Under Investigation').length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {disputes.filter(d => d.status === 'Resolved').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search disputes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter disputes by status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    aria-label="Filter disputes by type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">All Types</option>
                    {disputeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setTypeFilter('');
                    }}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
                    title="Clear all filters"
                    aria-label="Clear all filters"
                  >
                    <Filter className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Disputes Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('_id')}
                      >
                        <div className="flex items-center">
                          Dispute Info
                          {getSortIcon('_id')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('disputeType')}
                      >
                        <div className="flex items-center">
                          Type
                          {getSortIcon('disputeType')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {getSortIcon('amount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => requestSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedDisputes.map((dispute) => (
                      <tr key={dispute._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{dispute._id?.slice(-8) || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {dispute.description || 'No description'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{dispute.disputeType || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{dispute.paymentCategory || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ₦{dispute.amount?.toLocaleString() || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                            {getStatusIcon(dispute.status)}
                            {dispute.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                            title="View dispute details"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDisputes.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No disputes found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || statusFilter || typeFilter 
                      ? 'Try adjusting your filters' 
                      : 'Create your first dispute to get started'}
                  </p>
                  {(searchTerm || statusFilter || typeFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                        setTypeFilter('');
                      }}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      title="Clear all filters"
                      aria-label="Clear all filters"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Dispute Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Dispute</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close create dispute form"
                  aria-label="Close create dispute form"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.disputeType}
                    onChange={(e) => setFormData(prev => ({...prev, disputeType: e.target.value}))}
                    aria-label="Select dispute type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Select dispute type</option>
                    {disputeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formData.disputeType && (
                    <p className="text-xs text-gray-500 mt-1">
                      {disputeTypeDescriptions[formData.disputeType as keyof typeof disputeTypeDescriptions]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={4}
                    placeholder="Describe the issue in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter transaction reference or ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.paymentCategory}
                    onChange={(e) => setFormData(prev => ({...prev, paymentCategory: e.target.value}))}
                    aria-label="Select payment category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Select payment category</option>
                    {paymentCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter amount involved"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents (Optional)
                  </label>
                  <div className="space-y-3">
                    {formData.supportingDocuments.map((doc, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={doc}
                          onChange={(e) => {
                            const newDocs = [...formData.supportingDocuments];
                            newDocs[index] = e.target.value;
                            setFormData(prev => ({...prev, supportingDocuments: newDocs}));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="https://example.com/document.pdf"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newDocs = formData.supportingDocuments.filter((_, i) => i !== index);
                            setFormData(prev => ({...prev, supportingDocuments: newDocs}));
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove document"
                          aria-label="Remove document"
                        >
                          <Trash2 className="w-5 h-5" aria-hidden="true" />
                          <span className="sr-only">Remove document</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          supportingDocuments: [...prev.supportingDocuments, '']
                        }));
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                      title="Add a new document URL"
                      aria-label="Add a new document URL"
                    >
                      <Plus className="w-4 h-4" />
                      Add Document URL
                    </button>
                    <p className="text-xs text-gray-500">
                      Add URLs to supporting documents (screenshots, receipts, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({
                        disputeType: '',
                        description: '',
                        transactionId: '',
                        paymentCategory: '',
                        amount: '',
                        supportingDocuments: []
                      });
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    title="Cancel creating a new dispute"
                    aria-label="Cancel creating a new dispute"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Dispute
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Dispute Details Modal */}
      {showDetails && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Dispute Details</h3>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close dispute details"
                  aria-label="Close dispute details"
                >
                  <XCircle className="w-6 h-6" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dispute ID</label>
                    <p className="text-sm text-gray-900 font-mono">#{selectedDispute._id || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDispute.status)}`}>
                      {getStatusIcon(selectedDispute.status)}
                      {selectedDispute.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dispute Type</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedDispute.disputeType || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Description</label>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedDispute.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Payment Category</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedDispute.paymentCategory || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Amount</label>
                    <p className="text-lg text-gray-900 font-bold">₦{selectedDispute.amount?.toLocaleString() || '0.00'}</p>
                  </div>
                </div>

                {selectedDispute.transactionId && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-xs font-medium text-blue-700 uppercase mb-2">Transaction Details</label>
                    {typeof selectedDispute.transactionId === 'object' ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ID:</span>
                          <span className="text-gray-900 font-mono">{selectedDispute.transactionId._id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reference:</span>
                          <span className="text-gray-900 font-mono">{selectedDispute.transactionId.reference || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="text-gray-900 font-semibold">₦{selectedDispute.transactionId.amount?.toLocaleString() || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="text-gray-900 font-medium">{selectedDispute.transactionId.status || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 font-mono">{selectedDispute.transactionId}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Created Date</label>
                    <p className="text-sm text-gray-900">
                      {selectedDispute.createdAt ? new Date(selectedDispute.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Last Updated</label>
                    <p className="text-sm text-gray-900">
                      {selectedDispute.updatedAt ? new Date(selectedDispute.updatedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedDispute.supportingDocuments && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Supporting Documents</label>
                    <div className="space-y-2">
                      {(Array.isArray(selectedDispute.supportingDocuments)
                        ? selectedDispute.supportingDocuments
                        : [selectedDispute.supportingDocuments]
                      )
                        .filter(doc => doc)
                        .map((doc, index) => (
                          <a 
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            Document {index + 1}
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {(selectedDispute.raisedByName || selectedDispute.raisedByEmail) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Raised By</label>
                    <div className="space-y-1">
                      {selectedDispute.raisedByName && (
                        <p className="text-sm text-gray-900 font-medium">{selectedDispute.raisedByName}</p>
                      )}
                      {selectedDispute.raisedByEmail && (
                        <p className="text-sm text-gray-600">{selectedDispute.raisedByEmail}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  title="Close dispute details"
                  aria-label="Close dispute details"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DisputePage;