import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { 
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  Search as SearchIcon,
  HelpCircle as HelpIcon,
  UserPlus as PersonAddIcon,
  Copy as CopyIcon
  UserPlus as PersonAddIcon,
  Copy as CopyIcon
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import Footer from '../components/Footer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: string;
  avatarColor?: string;
  avatarInitial?: string;
  schoolId?: string; // Changed from storeId to match API response
}

interface StoreInfo {
  id: string;
  name: string;
  type: string;
  store_id: string;
}

interface ApiResponse {
  message: string;
  data: {
    schoolId: string;
    agent: Agent[];
    store: StoreInfo;
  };
  schoolId?: string; // Changed from storeId to match API response
}

interface StoreInfo {
  id: string;
  name: string;
  type: string;
  store_id: string;
}

interface ApiResponse {
  message: string;
  data: {
    schoolId: string;
    agent: Agent[];
    store: StoreInfo;
  };
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const ManageAgentsPage: React.FC = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://nodes-staging-xp.up.railway.app';
  
  // Form state for new agent account
  const [agentData, setAgentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'agent' 
  });
  
  // Form validation state
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Show/hide form state
  const [showForm, setShowForm] = useState(false);
  
  // List of agents
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Agent count
  const [agentCount, setAgentCount] = useState<number>(0);
  
  // Store info
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  
  // Store info
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  
  // Store registration link state
  const [storeRegistrationLink, setStoreRegistrationLink] = useState<string>('');
  
  // Store details from registration link
  interface StoreDetails {
    store_id?: string;
    storeName?: string;
    storeType?: string;
  }
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
  // Store registration link state
  const [storeRegistrationLink, setStoreRegistrationLink] = useState<string>('');
  
  // Store details from registration link
  interface StoreDetails {
    store_id?: string;
    storeName?: string;
    storeType?: string;
  }
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
  
  // Authentication related states
  const authContext = useAuth();
  const token = authContext?.token;
  const authToken = token || localStorage.getItem('token');
  
  // Fetch user profile and store ID on component mount
  useEffect(() => {
    if (!authToken) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');

        const data = await response.json();

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');

        const data = await response.json();
        const profile = data.user;

        // Get the registration link from the correct field
        const registrationLink = profile.Link || '';

        setStoreRegistrationLink(registrationLink);

        // Parse store details from the registration link
        const parsedDetails = parseStoreRegistrationLink(registrationLink);
        setStoreDetails(parsedDetails);

        // Fetch agents and count
        await fetchAgents();
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to fetch store information');
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchUserProfile();
        toast.error('Failed to fetch store information');
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchUserProfile();
  }, [authToken, API_BASE_URL]);
  
  // Function to fetch agents - Updated to match API response structure
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getagentbyid`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });


      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const apiResponse: ApiResponse = await response.json();
      console.log('API Response:', apiResponse); // Debug log
      
      // Extract agents from the correct path in response
      const agentsData = apiResponse.data?.agent || [];
      const storeData = apiResponse.data?.store || null;
      
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setAgentCount(agentsData.length);
      setStoreInfo(storeData);
      
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
      setAgentCount(0);
      toast.error('Failed to fetch agents');
    }
  };
  
  // Function to parse store registration link and extract parameters
  const parseStoreRegistrationLink = (link: string): StoreDetails | null => {
    if (!link) return null;
    try {
      // Remove any leading '?' if present
      const queryString = link.startsWith('?') ? link.substring(1) : link;
      // Split into key-value pairs
      const params = new URLSearchParams(queryString);

      return {
        store_id: params.get('store_id') || '',
        storeName: params.get('storeName') || '',
        storeType: params.get('storeType') || ''
      };
    } catch (error) {
      console.error('Error parsing store registration link:', error);
      toast.error('Invalid store registration link');
      return null;
    }
  };
  
  const handleChange = (field: keyof FormErrors) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData({ ...agentData, [field]: event.target.value });
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!agentData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!agentData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!agentData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!agentData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(agentData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!agentData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!agentData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!agentData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (agentData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Use store info from API response or fallback to parsed details
    const storeId = storeInfo?.store_id || storeDetails?.store_id;
    
    if (!storeId) {
      toast.error('Store information not available');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for registration
      const registrationData = {
        firstName: agentData.firstName,
        lastName: agentData.lastName,
        email: agentData.email,
        phone: agentData.phone,
        password: agentData.password,
        role: "agent",
        store_id: storeId,
      };
      
      // Register the agent
      const registerResponse = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(registrationData)
      });
      
      const responseData = await registerResponse.json();
      
      const responseData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        // Show specific error message from API
        const errorMessage = responseData.message || responseData.error || 'Failed to register agent';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Show success message
      toast.success('🎉 Agent created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Clear form and hide it
      // Clear form and hide it
      setAgentData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'agent'
      });
      setErrors({});
      setShowForm(false);
      
      // Wait a moment before refreshing to ensure the backend has processed the request
      setTimeout(async () => {
        await fetchAgents();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating agent:', error);
      // Show error toast with more specific message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent. Please try again.';
      toast.error(`❌ ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }
      
      // Update local state
      // Update local state
      setAgents(agents.filter(agent => agent.id !== id));
      setAgentCount(prev => Math.max(0, prev - 1));
      
      toast.success('Agent deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };


  // Filter agents based on search term
  const filteredAgents = agents.filter(agent => 
    agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.fullName && agent.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.fullName && agent.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.phone && agent.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get avatar initials from first name
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Copy registration link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(storeRegistrationLink);
    toast.info('📋 Link copied to clipboard!', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Get display name for store
  const getStoreName = (): string => {
    return storeInfo?.name || storeDetails?.storeName || 'Store';
  };

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Header and Sidebar */}
      <StoreHeader />
      <StoreSidebar />
  
      {/* Spacer */}
      <div className="h-[120px] sm:h-[140px]" />
      
      {/* Main Content */}
      <div className="px-4 sm:px-6 py-8 flex-grow max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Manage Agents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {getStoreName()} • Total Agents: {agentCount}
            </p>
            {storeInfo && (
              <p className="text-xs text-gray-400 mt-1">
                Store Type: {storeInfo.type} • Store ID: {storeInfo.store_id}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md ${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
              onClick={() => setShowForm(!showForm)}
              disabled={!storeRegistrationLink}
            >
              <AddIcon className="w-5 h-5" />
              {showForm ? "Cancel" : "Add New Agent"}
            </button>
            
            {storeRegistrationLink && (
              <button 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                onClick={copyToClipboard}
              >
                <CopyIcon className="w-5 h-5" />
                Copy Registration Link
              </button>
            )}
          </div>
        </div>
        
        {/* Store registration link display */}
        {storeRegistrationLink && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  Agent Registration Link:
                </p>
                <div className="text-xs bg-white p-2 rounded border border-gray-300 break-all">
                  {storeRegistrationLink}
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Share this link with agents to allow them to register for your store
            </p>
          </div>
        )}
        
        {/* Agent Creation Form */}
        {showForm && (
          <div className="relative bg-white p-6 mb-8 rounded-xl shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <PersonAddIcon className="text-blue-600 w-6 h-6" />
              Create New Agent Account
            </h2>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Agent Information
                  </h3>
                  <div className="border-b border-gray-200 mb-4" />
                </div>
                
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${agentData.firstName ? 'bg-blue-600' : 'bg-gray-400'}`}>
                        {agentData.firstName ? agentData.firstName.charAt(0).toUpperCase() : 'A'}
                      </div>
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      className={`pl-12 w-full rounded-md border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      value={agentData.firstName}
                      onChange={handleChange('firstName')}
                      placeholder="John"
                      required
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`w-full rounded-md border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    value={agentData.lastName}
                    onChange={handleChange('lastName')}
                    placeholder="Doe"
                    required
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    value={agentData.email}
                    onChange={handleChange('email')}
                    placeholder="john.doe@example.com"
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    value={agentData.phone}
                    onChange={handleChange('phone')}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`w-full rounded-md border ${errors.password ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    value={agentData.password}
                    onChange={handleChange('password')}
                    placeholder="At least 6 characters"
                    required
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  onClick={() => {
                    setShowForm(false);
                    setAgentData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      password: '',
                      role: 'agent'
                    });
                    setErrors({});
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Agent...
                    </>
                  ) : (
                    'Create Agent Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search agents by name, email, or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Loading state */}
        {isLoadingAgents && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* List of Existing Agents */}
        {!isLoadingAgents && agents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold"
                      >
                        {getInitials(agent.firstName, agent.lastName)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {agent.fullName || `${agent.firstName} ${agent.lastName}`}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {agent.role}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      aria-label="Delete agent"
                    >
                      <DeleteIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <span className="font-medium w-20">Email:</span>
                      <span className="text-gray-600 truncate">{agent.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium w-20">Phone:</span>
                      <span className="text-gray-600">{agent.phone || 'N/A'}</span>
                    </div>
                    {agent.schoolId && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium w-20">School ID:</span>
                        <span className="text-gray-600 text-xs">{agent.schoolId}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <span className="font-medium w-20">Status:</span>
                      <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoadingAgents ? (
          <div className="bg-white p-8 text-center rounded-xl shadow-sm max-w-2xl mx-auto">
            <div className="mx-auto h-40 w-40 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <HelpIcon className="h-20 w-20 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Agents Added Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Agents you add will appear here. Get started by creating your first agent account.
            </p>
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={() => setShowForm(true)}
              disabled={!storeRegistrationLink}
            >
              <AddIcon className="w-5 h-5 mr-2" />
              Add Your First Agent
            </button>
          </div>
        ) : null}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ManageAgentsPage;