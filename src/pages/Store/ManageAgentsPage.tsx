import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import { 
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  Search as SearchIcon,
  HelpCircle as HelpIcon,
  UserPlus as PersonAddIcon
} from 'lucide-react';
import StoreHeader from '../../components/StoreHeader';
import StoreSidebar from '../../components/StoreSidebar';
import Footer from '../../components/Footer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: string;
  avatarColor?: string;
  avatarInitial?: string;
  schoolId: string; 
}

interface StoreInfo {
  id: string;
  name: string;
  type: string;
  store_id: string;
  schoolId?: string;
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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
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
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingStoreInfo, setIsLoadingStoreInfo] = useState(true);
  
  // Authentication related states
  const authContext = useAuth();
  const token = authContext?.token;
  const authToken = token || localStorage.getItem('token');
  
  // Function to fetch store information from user profile
  const fetchStoreInfoFromProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getuserone`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user profile');

      const userData = await response.json();
      console.log('User Profile Response:', userData);
      
      // Extract store information from user profile based on actual API structure
      if (userData.user?.data) {
        const storeData = userData.user.data;
        const userStoreInfo = {
          id: storeData.id || '',
          name: storeData.storeName || 'Store',
          type: storeData.storeType || 'Store',
          store_id: storeData.store_id || '',
          schoolId: storeData.schoolId || ''
        };
        
        console.log('✅ Store info extracted from user profile:', userStoreInfo);
        
        // Only set store info if we have a valid store_id
        if (userStoreInfo.store_id) {
          setStoreInfo(userStoreInfo);
          console.log('✅ Store info successfully set:', userStoreInfo);
        } else {
          console.warn('❌ No valid store_id found in user profile');
        }
      } else {
        console.warn('❌ No user.data found in profile response');
      }
    } catch (error) {
      console.error('❌ Error fetching store info from profile:', error);
      // Don't show error toast here as we'll try fetching from agents endpoint
    } finally {
      setIsLoadingStoreInfo(false);
    }
  };

  // Function to fetch agents
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getagentbyid`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If it's a 404 or similar, it might just mean no agents exist yet
        if (response.status === 404 || response.status === 400) {
          console.log('No agents found for this store');
          setAgents([]);
          setAgentCount(0);
          return; // Don't throw error for no agents
        }
        throw new Error('Failed to fetch agents');
      }

      const apiResponse: ApiResponse = await response.json();
      console.log('Agents API Response:', apiResponse);
      
      const agentsData = apiResponse.data?.agent || [];
      const storeData = apiResponse.data?.store || null;
      
      // Only update store info if we don't already have it from user profile
      if (storeData && !storeInfo) {
        if (storeData.store_id) {
          storeData.schoolId = storeData.schoolId || (storeData.store_id ? storeData.store_id.split('/')[0] : '');
          setStoreInfo(storeData);
          console.log('Store info from agents endpoint:', storeData);
        }
      }
      
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setAgentCount(agentsData.length);
      
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
      setAgentCount(0);
      // Only show error toast if we also don't have store info
      if (!storeInfo) {
        toast.error('Failed to fetch store information');
      }
    }
  };

  // Main initialization function
  const initializePage = async () => {
    if (!authToken) return;
    
    setIsLoadingAgents(true);
    setIsLoadingStoreInfo(true);
    
    try {
      // First try to get store info from user profile
      await fetchStoreInfoFromProfile();
      
      // Then fetch agents (this might also provide store info as fallback)
      await fetchAgents();
      
    } catch (error) {
      console.error('Error initializing page:', error);
    } finally {
      setIsLoadingAgents(false);
      setIsLoadingStoreInfo(false);
    }
  };

  // Fetch user profile and store ID on component mount
  useEffect(() => {
    initializePage();
  }, [authToken, API_BASE_URL]);
  
  const handleChange = (field: keyof FormErrors) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData({ ...agentData, [field]: event.target.value });
    // Clear error when user types
    if (errors[field]) {
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
    if (!agentData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(agentData.email)) {
      newErrors.email = "Email is invalid";
    }
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
    
    if (!storeInfo?.store_id) {
      toast.error('Store information not available. Please refresh the page and try again.');
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
        store_id: storeInfo.store_id,
        schoolId: storeInfo.schoolId || storeInfo.store_id.split('/')[0] || '',
      };
        
      console.log('Registration data:', registrationData);
        
      // Register the agent
      const registerResponse = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(registrationData)
      });
      
      const responseData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        const errorMessage = responseData.message || responseData.error || 'Failed to register agent';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      toast.success('🎉 Agent created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
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
      
      // Refresh agents list
      setTimeout(async () => {
        await fetchAgents();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating agent:', error);
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
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }
      
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
    (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.phone && agent.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get avatar initials from first name
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get display name for store
  const getStoreName = (): string => {
    return storeInfo?.name || 'Store';
  };

  // Check if page is still loading
  const isPageLoading = isLoadingAgents || isLoadingStoreInfo;

  return (
    <div className="text-gray-600 flex min-h-screen flex-col bg-gray-50">
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
      
      <StoreHeader />
      <div className="z-100">
        <StoreSidebar />  
      </div>
  
      {/* Main Content Area - adjusted for sidebar */}
      <div className="flex-1 pl-0 md:pl-[250px] transition-all duration-300">
        {/* Responsive Spacer - accounts for sidebar */}
        <div className="h-[80px] xs:h-[90px] sm:h-[100px] md:h-[110px] lg:h-[120px] xl:h-[140px]" />
        
        {/* Content Container - now properly offset */}
        <div className="px-4 xs:px-5 sm:px-6 md:px-7 lg:px-8 py-5 sm:py-6 md:py-7 lg:py-8 max-w-6xl mx-auto w-full mb-20">
          {/* Title Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 sm:mb-6 md:mb-7 gap-3 sm:gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-xl xs:text-2xl sm:text-[26px] md:text-[28px] lg:text-3xl font-bold text-gray-800">
                Manage Agents
              </h1>
              <p className="text-xs xs:text-sm sm:text-[13px] md:text-[14px] text-gray-500 mt-1">
                {getStoreName()} • Total Agents: {agentCount}
              </p>
              {storeInfo && (
                <p className="text-[11px] xs:text-xs sm:text-[13px] text-gray-400 mt-1 truncate">
                  Store Type: {storeInfo.type} • Store ID: {storeInfo.store_id}
                </p>
              )}
            </div>
            
            <div className="w-full md:w-[200px]">
              <button 
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md w-full ${
                  showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors text-sm sm:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => setShowForm(!showForm)}
                disabled={!storeInfo?.store_id}
              >
                <AddIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {showForm ? "Cancel" : "Add New Agent"}
              </button>
            </div>
          </div>
        
          {/* Agent Creation Form */}
          {showForm && (
            <div className="relative bg-white p-5 sm:p-6 md:p-6 lg:p-7 mb-5 sm:mb-6 md:mb-7 rounded-xl shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
              
              <h2 className="text-lg sm:text-xl md:text-[20px] font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
                <PersonAddIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                <span>Create New Agent Account</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="mt-2 sm:mt-3 md:mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  <div className="col-span-2">
                    <h3 className="text-xs sm:text-sm md:text-[14px] font-medium text-gray-500 mb-1 sm:mb-2">
                      Agent Information
                    </h3>
                    <div className="border-b border-gray-200 mb-2 sm:mb-3 md:mb-4" />
                  </div>
                  
                  {/* Form fields */}
                  {['firstName', 'lastName', 'email', 'phone'].map((field) => (
                    <div key={field}>
                      <label 
                        htmlFor={field} 
                        className="block text-xs sm:text-sm md:text-[14px] font-medium text-gray-700 mb-1"
                      >
                        {field === 'firstName' && 'First Name *'}
                        {field === 'lastName' && 'Last Name *'}
                        {field === 'email' && 'Email *'}
                        {field === 'phone' && 'Phone Number *'}
                      </label>
                      {field === 'firstName' ? (
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-xs ${
                              agentData.firstName ? 'bg-blue-600' : 'bg-gray-400'
                            }`}>
                              {agentData.firstName ? agentData.firstName.charAt(0).toUpperCase() : 'A'}
                            </div>
                          </div>
                          <input
                            id={field}
                            type={(field as string) === 'email' ? 'email' : (field as string) === 'phone' ? 'tel' : 'text'}
                            className={`pl-10 sm:pl-12 w-full rounded-md border ${
                              errors[field as keyof FormErrors] ? 'border-red-500' : 'border-gray-300'
                            } shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-[14px] py-2`}
                            value={agentData[field as keyof typeof agentData]}
                            onChange={handleChange(field as keyof FormErrors)}
                            placeholder={
                              field === 'firstName' ? 'John' :
                              field === 'lastName' ? 'Doe' :
                              field === 'email' ? 'john.doe@example.com' :
                              '+1 (555) 123-4567'
                            }
                            required
                          />
                        </div>
                      ) : (
                        <input
                          id={field}
                          type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                          className={`w-full rounded-md border ${
                            errors[field as keyof FormErrors] ? 'border-red-500' : 'border-gray-300'
                          } shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-[14px] py-2`}
                          value={agentData[field as keyof typeof agentData]}
                          onChange={handleChange(field as keyof FormErrors)}
                          placeholder={
                            field === 'firstName' ? 'John' :
                            field === 'lastName' ? 'Doe' :
                            field === 'email' ? 'john.doe@example.com' :
                            '+1 (555) 123-4567'
                          }
                          required
                        />
                      )}
                      {errors[field as keyof FormErrors] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[field as keyof FormErrors]}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <div className="col-span-2">
                    <label htmlFor="password" className="block text-xs sm:text-sm md:text-[14px] font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      className={`w-full rounded-md border ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-[14px] py-2`}
                      value={agentData.password}
                      onChange={handleChange('password')}
                      placeholder="At least 6 characters"
                      required
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                  </div>
                </div>
                
                {/* Form buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="button"
                    className="px-3 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm md:text-[14px] text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center text-xs sm:text-sm md:text-[14px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          
          {/* Search Bar */}
          <div className="relative mb-5 sm:mb-6 md:mb-7">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-[18px] w-[18px] text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-[15px] md:text-[15px]"
              placeholder="Search agents by name, email, or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Loading State */}
          {isPageLoading && (
            <div className="flex justify-center my-6 sm:my-7 md:my-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {/* Agents List or Empty State */}
          {!isPageLoading && agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-start mb-4 sm:mb-5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                          {getInitials(agent.firstName, agent.lastName)}
                        </div>
                        <div className="max-w-[140px] sm:max-w-[160px]">
                          <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">
                            {agent.fullName || `${agent.firstName} ${agent.lastName}`}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize truncate">
                            {agent.role}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        aria-label="Delete agent"
                      >
                        <DeleteIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 my-2 sm:my-3 md:my-4" />
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
                        <span className="font-medium w-16 sm:w-20">Email:</span>
                        <span className="text-gray-600 truncate">{agent.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
                        <span className="font-medium w-16 sm:w-20">Phone:</span>
                        <span className="text-gray-600 truncate">{agent.phone || 'N/A'}</span>
                      </div>
                      {agent.schoolId && (
                        <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
                          <span className="font-medium w-16 sm:w-20">School ID:</span>
                          <span className="text-gray-600 text-xs truncate">{agent.schoolId}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs sm:text-sm md:text-[14px]">
                        <span className="font-medium w-16 sm:w-20">Status:</span>
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isPageLoading ? (
            <div className="bg-white p-6 sm:p-7 md:p-7 lg:p-8 text-center rounded-xl shadow-sm max-w-2xl mx-auto">
              <div className="mx-auto h-32 w-32 sm:h-36 sm:w-36 bg-gray-100 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                <HelpIcon className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-[22px] font-medium text-gray-900 mb-2 sm:mb-3">
                No Agents Found
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-5">
                {searchTerm ? 
                  `No agents match your search "${searchTerm}". Try adjusting your search terms.` :
                  'Get started by adding your first agent to help manage your store.'
                }
              </p>
              {!searchTerm && storeInfo?.store_id && (
                <button
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  onClick={() => setShowForm(true)}
                >
                  <AddIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Add Your First Agent
                </button>
              )}
              {!storeInfo?.store_id && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Store information is still loading. Please wait or refresh the page if this persists.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 w-full">
        <Footer />
      </div>
    </div>
  );
};

export default ManageAgentsPage;