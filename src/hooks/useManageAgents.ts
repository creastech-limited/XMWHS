// src/hooks/useManageAgents.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "../context/AuthContext";
import { toast } from 'react-toastify';
import {
  activateStore as activateAgentAPI,
  deactivateStore as deactivateAgentAPI,
  getAgentsById,
  getUserDetails,
  registerAgent
} from '../services';
import type { 
  GetAgentsResponse, 
  StoreAgent, 
  StoreDetails, 
  UserResponse,
} from '../types';
import type { AgentFormData, AgentFormErrors, AgentRegistrationData } from '../types/agent';

export const useManageAgents = () => {
  const authContext = useAuth();
  const token = authContext?.token || localStorage.getItem('token');

  // ===== STATE =====
  const [agents, setAgents] = useState<StoreAgent[]>([]);
  const [agentCount, setAgentCount] = useState<number>(0);
  const [storeInfo, setStoreInfo] = useState<StoreDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingStoreInfo, setIsLoadingStoreInfo] = useState(true);
  
  const [agentData, setAgentData] = useState<AgentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'agent'
  });
  
  const [errors, setErrors] = useState<AgentFormErrors>({});

  // ===== FETCH FUNCTIONS =====
  const fetchStoreInfoFromProfile = useCallback(async () => {
    try {
      const UserData: UserResponse = await getUserDetails();

      if (UserData.user?.data) {
        const storeData = UserData.user.data;
        const userStoreInfo: StoreDetails = {
          _id: String(storeData.id ?? ''),
          name: String(storeData.storeName ?? 'Store'),
          type: String(storeData.storeType ?? 'Store'),
          store_id: String(storeData.store_id ?? ''),
          schoolId: String(storeData.schoolId ?? '')
        };

        if (userStoreInfo.store_id) {
          setStoreInfo(userStoreInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching store info from profile:', error);
    } finally {
      setIsLoadingStoreInfo(false);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const apiResponse: GetAgentsResponse = await getAgentsById();
      const agentsData = apiResponse.data?.agent || [];
      const storeData = apiResponse.data?.store || null;

      if (storeData?.store_id) {
        const fallbackStoreInfo = {
          ...storeData,
          schoolId: storeData.schoolId || storeData.store_id.split('/')[0] || '',
        };
        setStoreInfo(prevStoreInfo => prevStoreInfo ?? fallbackStoreInfo);
      }

      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setAgentCount(agentsData.length);

    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
      setAgentCount(0);

      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      if (errorMessage === "No agent found in this school") {
        toast.info('No agent registered');
      } else {
        toast.error('Failed to fetch store information');
      }
    } finally {
      setIsLoadingAgents(false);
    }
  }, []);

  const initializePage = useCallback(async () => {
    if (!token) return;
    setIsLoadingAgents(true);
    setIsLoadingStoreInfo(true);

    try {
      await fetchStoreInfoFromProfile();
      await fetchAgents();
    } catch (error) {
      console.error('Error initializing page:', error);
    } finally {
      setIsLoadingAgents(false);
      setIsLoadingStoreInfo(false);
    }
  }, [token, fetchAgents, fetchStoreInfoFromProfile]);

  // ===== FORM HANDLERS =====
  const handleChange = (field: keyof AgentFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgentData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field as keyof AgentFormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof AgentFormErrors];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: AgentFormErrors = {};
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

  const resetForm = () => {
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
      const isStandAlone = storeInfo.schoolId === 'FFZ960384' || storeInfo.store_id.split('/')[0] === 'FFZ960384';
      const registrationData: AgentRegistrationData = {
        firstName: agentData.firstName,
        lastName: agentData.lastName,
        email: agentData.email,
        phone: agentData.phone,
        password: agentData.password,
        role: "agent",
        store_id: storeInfo.store_id,
        schoolId: storeInfo.schoolId || storeInfo.store_id.split('/')[0] || '',
        isStandAlone: isStandAlone,
      };

      await registerAgent(registrationData);
      
      toast.success('🎉 Agent created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      resetForm();

      setTimeout(async () => {
        await fetchAgents();
      }, 1000);

    } catch (error) {
      console.error('Error creating agent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent. Please try again.';
      toast.error(` ${errorMessage}`, {
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

  // ===== AGENT ACTIONS =====
  const handleToggleStatus = async (agent: StoreAgent) => {
    const isCurrentlyActive = agent.status !== 'inactive';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionText = isCurrentlyActive ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${actionText} this agent?`)) return;

    try {
      let response;
      if (isCurrentlyActive) {
        response = await deactivateAgentAPI(agent.id);
      } else {
        response = await activateAgentAPI(agent.id);
      }

      setAgents(prevAgents =>
        prevAgents.map(a =>
          a.id === agent.id
            ? { ...a, status: newStatus }
            : a
        )
      );

      toast.success(response?.message || `Agent ${actionText}d successfully`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error: unknown) {
      console.error(`Error ${actionText}ing agent:`, error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        `Failed to ${actionText} agent`;
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    initializePage();
  }, [initializePage]);

  // ===== COMPUTED VALUES =====
  const filteredAgents = agents.filter(agent =>
    agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.fullName && agent.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.phone && agent.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStoreName = (): string => {
    return storeInfo?.name || 'Store';
  };

  const isPageLoading = isLoadingAgents || isLoadingStoreInfo;

  return {
    // State
    agents,
    agentCount,
    storeInfo,
    searchTerm,
    showForm,
    showPassword,
    isLoading,
    isPageLoading,
    agentData,
    errors,
    filteredAgents,
    
    // Setters
    setSearchTerm,
    setShowForm,
    setShowPassword,
    
    // Functions
    handleChange,
    handleSubmit,
    handleToggleStatus,
    resetForm,
    getInitials,
    getStoreName,
    fetchAgents,
  };
};