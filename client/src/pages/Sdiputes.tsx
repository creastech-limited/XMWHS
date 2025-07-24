import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { Header } from '../components/Header';
import { Sidebar as Asidebar } from '../components/Sidebar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
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
  ChevronUp
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DisputePage = () => {
  const auth = useAuth();
  // Removed unused user state
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

  // Form state for creating new dispute
  const [formData, setFormData] = useState({
    disputeType: '',
    description: '',
    transactionId: '',
    paymentCategory: '',
    amount: '',
    supportingDocuments: ''
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
interface UserProfile {
    _id?: string;
    name?: string;
    email?: string;
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

  // Fetch disputes
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
    [key: string]: unknown;
}

const fetchDisputes = async (authToken: string): Promise<Dispute[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dispute/getschDispute`, {
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
        
        // Extract disputes from the nested response structure
        return Array.isArray(data.disputes) ? data.disputes : [];
    } catch (error) {
        console.error('Error fetching disputes:', error);
        return [];
    }
};

  // Create new dispute
interface CreateDisputeData {
    disputeType: string;
    description: string;
    transactionId?: string;
    paymentCategory?: string;
    amount?: number;
    supportingDocuments?: string | string[];
}

interface CreateDisputeResponse {
    savedDispute?: Dispute;
    [key: string]: unknown;
}

const createDispute = async (disputeData: CreateDisputeData): Promise<CreateDisputeResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dispute/createdispute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(disputeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create dispute');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating dispute:', error);
        throw error;
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

        // Ensure all required User fields are present for AuthContext compatibility
        const mergedUser = {
          _id: profile._id || '',
          name: typeof profile.name === 'string' ? profile.name : '',
          email: typeof profile.email === 'string' ? profile.email : '',
          role: typeof (profile as { role?: string }).role === 'string' ? (profile as { role?: string }).role : '',
          ...profile
        };

        // Guarantee role is always a string (never undefined)
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

  // Handle form submission
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.disputeType || !formData.description) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        setLoading(true);
        const result: CreateDisputeResponse = await createDispute({
            ...formData,
            amount: formData.amount ? parseFloat(formData.amount) : 0
        });

        if (result.savedDispute) {
            setDisputes((prev: Dispute[]) => [result.savedDispute as Dispute, ...prev]);
            setFormData({
                disputeType: '',
                description: '',
                transactionId: '',
                paymentCategory: '',
                amount: '',
                supportingDocuments: ''
            });
            setShowCreateForm(false);
            alert('Dispute created successfully!');
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
interface StatusColorMap {
    [key: string]: string;
}

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
interface StatusIconProps {
    status?: string;
}

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
                  <p className="text-gray-600">Manage disputes from users and escalate issues to development team</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
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
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 text-black" />
                    <input
                      type="text"
                      placeholder="Search disputes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors text-black text-black"
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('_id')}
                      >
                        <div className="flex items-center">
                          Dispute Info
                          {getSortIcon('_id')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('disputeType')}
                      >
                        <div className="flex items-center">
                          Type
                          {getSortIcon('disputeType')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('raisedByName')}
                      >
                        <div className="flex items-center">
                          Raised By
                          {getSortIcon('raisedByName')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {getSortIcon('amount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                              ID: {dispute._id?.slice(-8) || 'N/A'}
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
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{dispute.raisedByName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{dispute.raisedByEmail || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ₦{dispute.amount?.toLocaleString() || 'N/A'}
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
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
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
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No disputes found matching your criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setTypeFilter('');
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Create Dispute Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Dispute</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Type *
                  </label>
                  <select
                    value={formData.disputeType}
                    onChange={(e) => setFormData(prev => ({...prev, disputeType: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the issue in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Transaction reference or ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Category
                  </label>
                  <select
                    value={formData.paymentCategory}
                    onChange={(e) => setFormData(prev => ({...prev, paymentCategory: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {paymentCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Amount involved"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supporting Documents
                  </label>
                  <input
                    type="text"
                    value={formData.supportingDocuments}
                    onChange={(e) => setFormData(prev => ({...prev, supportingDocuments: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URLs or references to supporting documents"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Dispute'}
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dispute Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dispute ID</label>
                    <p className="text-sm text-gray-900">{selectedDispute._id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDispute.status)}`}>
                      {getStatusIcon(selectedDispute.status)}
                      {selectedDispute.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Dispute Type</label>
                  <p className="text-sm text-gray-900">{selectedDispute.disputeType || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900">{selectedDispute.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Category</label>
                    <p className="text-sm text-gray-900">{selectedDispute.paymentCategory || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-sm text-gray-900">₦{selectedDispute.amount?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>

                {selectedDispute.transactionId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Transaction Details</label>
                    {typeof selectedDispute.transactionId === 'object' ? (
                      <div className="bg-gray-50 p-3 rounded-lg text-sm text-black">
                        <p><strong>ID:</strong> {selectedDispute.transactionId._id || 'N/A'}</p>
                        <p><strong>Reference:</strong> {selectedDispute.transactionId.reference || 'N/A'}</p>
                        <p><strong>Amount:</strong> ₦{selectedDispute.transactionId.amount?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Status:</strong> {selectedDispute.transactionId.status || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{selectedDispute.transactionId}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-900">
                      {selectedDispute.createdAt ? new Date(selectedDispute.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-sm text-gray-900">
                      {selectedDispute.updatedAt ? new Date(selectedDispute.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedDispute.supportingDocuments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Supporting Documents</label>
                    <div className="text-sm text-gray-900">
                      {(Array.isArray(selectedDispute.supportingDocuments)
                        ? selectedDispute.supportingDocuments
                        : [selectedDispute.supportingDocuments]
                      )
                        .filter(doc => doc)
                        .map((doc, index) => (
                          <p key={index}>{doc}</p>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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