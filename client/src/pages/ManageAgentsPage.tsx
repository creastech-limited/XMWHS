import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { 
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  Search as SearchIcon,
  HelpCircle as HelpIcon,
  UserPlus as PersonAddIcon
} from 'lucide-react';
import StoreHeader from '../components/StoreHeader';
import StoreSidebar from '../components/StoreSidebar';
import Footer from '../components/Footer';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  avatarColor?: string;
  avatarInitial?: string;
  storeId?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
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
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  
  // Store/User ID state
  const [storeId, setStoreId] = useState<string | null>(null);
  
  // Authentication related states
  const authContext = useAuth();
  const token = authContext?.token;
  const authToken = token || localStorage.getItem('token');
  
  // Snackbar for feedback messages
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch user profile and store ID on component mount
  useEffect(() => {
    if (!authToken) return;
    
    fetch(`${API_BASE_URL}/api/users/getuserone`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user profile');
        return res.json();
      })
      .then(data => {
        const profile = data.user;
        const id = profile.data._id;
        setStoreId(id);
        // Once we have the store ID, fetch agents and count
        fetchAgents(id);
        fetchAgentCount(id);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch user profile: ' + error.message,
          severity: 'error'
        });
      });
  }, [authToken, API_BASE_URL]);
  
  // Function to fetch agents for this store - FIXED
  const fetchAgents = async (id: string) => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getagentbyid?id=${encodeURIComponent(id)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const data = await response.json();
      console.log('Fetched agents data:', data); // Debug log
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load agents: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setIsLoadingAgents(false);
    }
  };
  
  // Function to fetch agent count for this store
  const fetchAgentCount = async (id: string) => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/getagentbyidcount/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent count');
      }
      
      const data = await response.json();
      setAgentCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching agent count:', error);
    }
  };
  
  const handleChange = (field: keyof FormErrors) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData({ ...agentData, [field]: event.target.value });
    // Clear error when user types
    if (errors[field]) {
      const newErrors = {...errors};
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!agentData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!agentData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (agentData.lastName.length < 3) {
      newErrors.lastName = "Last name must be at least 3 characters";
    }
    if (!agentData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(agentData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!agentData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
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
    if (!storeId) {
      setSnackbar({
        open: true,
        message: 'Store ID not available. Please try again later.',
        severity: 'error'
      });
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
        storeId: storeId // Associate the agent with the store
      };
      
      // Register the agent
      const registerResponse = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Include auth token if API requires it
        },
        body: JSON.stringify(registrationData)
      });
      
      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'Failed to register agent');
      }
      
      const registerResult = await registerResponse.json();
      console.log('Registration result:', registerResult); // Debug log
      
      setSnackbar({
        open: true,
        message: 'Agent account created successfully!',
        severity: 'success'
      });
      
      // Clear form fields after submission
      setAgentData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'agent'
      });
      
      // Hide form after successful submission
      setShowForm(false);
      
      // FIXED: Refresh the agents list and count after successful registration
      await fetchAgents(storeId);
      await fetchAgentCount(storeId);
      
    } catch (error) {
      console.error('Error creating agent:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to create agent. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      // Delete agent from API
      const response = await fetch(`${API_BASE_URL}/api/agents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }
      
      // Remove agent from local state
      setAgents(agents.filter(agent => agent.id !== id));
      setAgentCount(prev => Math.max(0, prev - 1));
      setSnackbar({
        open: true,
        message: 'Agent deleted successfully',
        severity: 'info'
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete agent: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };
  
  // Filter agents based on search term
  const filteredAgents = agents.filter(agent => 
    agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.phone && agent.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get avatar initials from first name
  const getInitials = (firstName: string): string => {
    return firstName.charAt(0).toUpperCase();
  };

  return (
    <div className="text-gray-600 flex flex-col bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <StoreSidebar />
      
      {/* Main content area with left margin for sidebar on larger screens */}
      <div className="flex-1 ml-0 md:ml-[280px] flex flex-col min-h-screen">
        {/* Header */}
        <StoreHeader />
        
        {/* Added a spacer div to prevent content from clashing with header */}
        <div className="h-[120px] sm:h-[140px]" />
        
        {/* Main Content - with top and bottom padding, and flex-grow to push footer down */}
        <div className="px-4 sm:px-6 py-8 flex-grow max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Manage Agents
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Total Agents: {agentCount}
              </p>
            </div>
            
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
              onClick={() => setShowForm(!showForm)}
              disabled={!storeId}
            >
              <AddIcon className="w-5 h-5" />
              {showForm ? "Cancel" : "Add New Agent"}
            </button>
          </div>
          
          {/* Store ID display */}
          {storeId && (
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Store ID: {storeId}
              </p>
            </div>
          )}
          
          {/* Agent Creation Form */}
          {showForm && (
            <div className="relative bg-white p-6 mb-8 rounded-xl shadow-lg overflow-hidden">
              {/* Decorative colored strip at the top */}
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
                      First Name
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
                        required
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className={`w-full rounded-md border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      value={agentData.lastName}
                      onChange={handleChange('lastName')}
                      required
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      value={agentData.email}
                      onChange={handleChange('email')}
                      required
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      value={agentData.phone}
                      onChange={handleChange('phone')}
                      required
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      className={`w-full rounded-md border ${errors.password ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                      value={agentData.password}
                      onChange={handleChange('password')}
                      required
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    <p className="mt-1 text-sm text-gray-500">
                      Password must be at least 6 characters long
                    </p>
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
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : null}
                    Create Agent
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Search bar - only show when we have agents */}
          {agents.length > 0 && (
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search agents by name, last name, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          
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
                  {/* Decorative colored strip at the top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${agent.avatarColor ? '' : 'bg-blue-600'}`} style={{ backgroundColor: agent.avatarColor }} />
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${agent.avatarColor ? '' : 'bg-blue-600'}`}
                          style={{ backgroundColor: agent.avatarColor }}
                        >
                          {agent.avatarInitial || getInitials(agent.firstName)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {agent.firstName} {agent.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{agent.lastName}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Delete agent"
                      >
                        <DeleteIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 my-4" />
                    
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {agent.email}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {agent.phone}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Role:</span> Agent
                      </p>
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
                Create your first agent account to start tracking their sales and performance. 
                Agents will be able to manage their listings and view their statistics.
              </p>
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={() => setShowForm(true)}
                disabled={!storeId}
              >
                <AddIcon className="w-5 h-5 mr-2" />
                Add Your First Agent
              </button>
            </div>
          ) : null}
        </div>
        
        {/* Footer - now it will always be at the bottom */}
        <Footer />
        
        {/* Snackbar for notifications */}
        {snackbar.open && (
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg text-white ${
            snackbar.severity === 'success' ? 'bg-green-600' :
            snackbar.severity === 'error' ? 'bg-red-600' :
            snackbar.severity === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
          }`}>
            <div className="flex items-center justify-between">
              <p>{snackbar.message}</p>
              <button 
                onClick={() => setSnackbar({...snackbar, open: false})}
                className="ml-4 text-white hover:text-gray-200"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAgentsPage;