import { apiClient } from './client';
import type {
  UserResponse,
  StoreCountResponse,
  ClassesResponse,
  TransactionsResponse,  Store, StoreDetails, StoreProfileFormData,
  AgentCountResponse,
  GetAgentsResponse,
  AgentRegistrationData,
  AgentRegistrationResponse,
  WithdrawalValidation,
  ApiBankData,
  ChargesResponse,
  Charge,
  SchoolUser,
  Dispute,
  CreateDisputeData,
  CreateDisputeResponse,
  DeleteAgentResponse,
} from '../../types/user';

// Get user details
export const getUserDetails = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/api/users/getuserone');
  return response.data;
};

// Get store count
export const getStoreCount = async (): Promise<StoreCountResponse> => {
  const response = await apiClient.get<StoreCountResponse>('/api/users/getstorebyidcount');
  return response.data;
};

// Get classes and students
export const getClasses = async (): Promise<ClassesResponse> => {
  const response = await apiClient.get<ClassesResponse>('/api/users/getclasse');
  return response.data;
};

// Get user transactions
export const getUserTransactions = async (): Promise<TransactionsResponse> => {
  const response = await apiClient.get<TransactionsResponse>('/api/transaction/getusertransaction');
  return response.data;
};

// Get store by school ID
export const getStoresBySchoolId = async (schoolId: string): Promise<Store[]> => {
  const response = await apiClient.get<Store[] | { data: Store[] } | { stores: Store[] }>(
    `/api/users/getstorebyid?id=${encodeURIComponent(schoolId)}`
  );
  
  const responseData = response.data;
  
  // Handle different API response structures
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
    return responseData.data;
  } else if (responseData && 'stores' in responseData && Array.isArray(responseData.stores)) {
    return responseData.stores;
  }
  
  return [];
};

// Get store count by school ID
export const getStoreCountBySchoolId = async (schoolId: string, status?: string): Promise<number> => {
  const url = status 
    ? `/api/users/getstorebyidcount?id=${encodeURIComponent(schoolId)}&status=${status}`
    : `/api/users/getstorebyidcount?id=${encodeURIComponent(schoolId)}`;
  
  const response = await apiClient.get<StoreCountResponse | number>(url);
  
  const responseData = response.data;
  
  if (typeof responseData === 'number') {
    return responseData;
  } else if (responseData?.data !== undefined && responseData.data !== null) {
    return responseData.data;
  } else if (responseData?.count !== undefined) {
    return responseData.count;
  }
  
  return 0;
};

// Reset password for store/account
export const resetStorePassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/users/resetpassword', { email });
  return response.data;
};

// Activate store
export const activateStore = async (storeId: string): Promise<{ message: string; status?: string }> => {
  const response = await apiClient.put<{ message: string; status?: string }>(`/api/users/active/${storeId}`);
  return response.data;
};

// Deactivate store
export const deactivateStore = async (storeId: string): Promise<{ message: string; status?: string }> => {
  const response = await apiClient.put<{ message: string; status?: string }>(`/api/users/deactive/${storeId}`);
  return response.data;
};

// Get store by ID 
export const getStoreById = async (storeId: string): Promise<StoreDetails> => {
  const response = await apiClient.get<{
    user?: { data?: StoreDetails } | StoreDetails;
    data?: StoreDetails;
  }>(`/api/users/getuser/${storeId}`);
  
  const responseData = response.data;
  
  // Handle different API response structures
  if (responseData.user) {
    if ('data' in responseData.user && responseData.user.data) {
      return responseData.user.data;
    } else if ('_id' in responseData.user) {
      return responseData.user as StoreDetails;
    }
  }
  
  if (responseData.data) {
    return responseData.data;
  }
  
  throw new Error('Invalid response structure from server');
};

// Update store profile
export const updateStoreProfile = async (
  storeId: string, 
  profileData: StoreProfileFormData
): Promise<{ message: string; data?: StoreDetails }> => {
  const response = await apiClient.put<{ message: string; data?: StoreDetails }>(
    `/api/users/update-user/${storeId}`,
    profileData
  );
  return response.data;
};

// Fecth notifications

export const getNotifications = async (): Promise<{ data: any[]; message?: string }> => {
  const response = await apiClient.get<{ data: any[]; message?: string }>('/api//api/notification/get');
  return response.data;
};

// Mark notification as read
export const getmarkNotification = async (notificationId: string): Promise<{ message: string }> => {
const response = await apiClient.put<{ message: string }>(
`/api/notifications/markasread/${notificationId}`
);
return response.data;
};

// Get agent count
export const getAgentCount = async (): Promise<number> => {
  const response = await apiClient.get<AgentCountResponse>('/api/users/getagentbyidcount');
  
  const responseData = response.data;
  
  if (typeof responseData === 'number') {
    return responseData;
  } else if (responseData?.data !== undefined && responseData.data !== null) {
    return responseData.data;
  } else if (responseData) {
    return responseData.data;
  }
  
  return 0;
};

// Fetch agents by ID
export const getAgentsById = async (schoolId?: string): Promise<GetAgentsResponse> => {
  const url = schoolId 
    ? `/api/users/getagentbyid?id=${encodeURIComponent(schoolId)}`
    : '/api/users/getagentbyid';
  
  const response = await apiClient.get<GetAgentsResponse>(url);
  return response.data;
};

// Register agent
export const registerAgent = async (
  agentData: AgentRegistrationData
): Promise<AgentRegistrationResponse> => {
  const response = await apiClient.post<AgentRegistrationResponse>(
    '/api/users/register',
    agentData
  );
  return response.data;
};


// Banks API
export const getBanks = async (): Promise<ApiBankData[]> => {
  const response = await apiClient.get<{ data: ApiBankData[] }>('/api/transaction/banks');
  return response.data.data || [];
};

// Resolve Account API
export const resolveAccount = async (
  accountNumber: string, 
  bankCode: string
): Promise<{ account_name: string; data?: { account_name: string } }> => {
  const response = await apiClient.get<{ account_name: string; data?: { account_name: string } }>(
    `/api/transaction/resolveaccount?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  return response.data;
};

// OTP API
export const generateOtp = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/otp/generate');
  return response.data;
};

export const verifyOtp = async (payload: {
  otp: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/otp/verify', payload);
  return response.data;
};

// Withdrawal API
export const validateWithdrawal = async (amount: number): Promise<WithdrawalValidation> => {
  const response = await apiClient.post<{ data: WithdrawalValidation }>(
    '/api/transaction/validateaccount',
    { amount }
  );
  return response.data.data;
};

// Submit Withdrawal API

export const submitWithdrawal = async (payload: {
  amount: number;
  description: string;
  pin: string;
  account_name: string;
  account_number: string;
  bank_code: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/transaction/withdraw', payload);
  return response.data;
};

// Get school fees
export const getSchoolFees = async (): Promise<{
  fees?: any[];
  data?: any[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    fees?: any[];
    data?: any[];
    message?: string;
  }>('/api/fee/getchoolFees');
  return response.data;
};


// Raise fee bill
export const raiseFeeBill = async (payload: any): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/fee/raise', payload);
  return response.data;
};

// Update fee bill
export const updateFee = async (billId: string, feeData: any): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>(
    `/api/fee/update/${billId}`,
    feeData
  );
  return response.data;
};

// Delete fee bill
export const deleteFeeBill = async (billId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/api/fee/delete/${billId}`
  );
  return response.data;
};

export const getAllCharges = async (): Promise<Charge[]> => {
  const response = await apiClient.get<ChargesResponse>('/api/charge/getallcharges');
  return response.data.data || [];
};

// Get all school users
export const getAllSchoolUsers = async (): Promise<{
  users?: SchoolUser[];
  data?: SchoolUser[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    users?: SchoolUser[];
    data?: SchoolUser[];
    message?: string;
  }>('/api/users/getallschooluser');
  return response.data;
};

// Transfer funds
export const transferFunds = async (payload: {
  receiverEmail: string;
  amount: number;
  pin: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/api/transaction/transfer',
    payload
  );
  return response.data;
};

// Get user disputes
export const getUserDisputes = async (): Promise<{
  disputes?: Dispute[];
  data?: Dispute[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    disputes?: Dispute[];
    data?: Dispute[];
    message?: string;
  }>('/api/dispute/getuserdispute');
  return response.data;
};

// Create dispute
export const createDisputeApi = async (disputeData: CreateDisputeData): Promise<CreateDisputeResponse> => {
  const response = await apiClient.post<CreateDisputeResponse>(
    '/api/dispute/createdispute',
    disputeData
  );
  return response.data;
};

// Delete agent (already in your API service from earlier)
export const deleteAgent = async (agentId: string): Promise<DeleteAgentResponse> => {
  const response = await apiClient.delete<DeleteAgentResponse>(
    `/api/users/delete/${agentId}`
  );
  return response.data;
};

// Get user wallet
export const getUserWallet = async (): Promise<{
  data?: {
    balance: number;
    currency?: string;
    walletId?: string;
  };
  message?: string;
}> => {
  const response = await apiClient.get<{
    data?: {
      balance: number;
      currency?: string;
      walletId?: string;
    };
    message?: string;
  }>('/api/wallet/getuserwallet');
  return response.data;
};