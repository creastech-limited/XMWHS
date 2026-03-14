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
  NotificationsResponse,
  UpdateUserPayload,
  UpdatePasswordPayload,
  UpdatePinPayload,
  SetPinPayload,
  NotificationPreferences,
  User,
  UserData,
  WalletResponse,
  TransferResponse,
} from '../../types/user';
import axios from 'axios';

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

// get notifications

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await apiClient.get<NotificationsResponse>('api/notification/get');
  return response.data;
};

// Mark notification as read
export const getmarkNotification = async (notificationId: string): Promise<{ message: string }> => {
const response = await apiClient.put<{ message: string }>(
`/api/notifications/markasread/${notificationId}`
);
return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  
  const response = await apiClient.put<{ message: string }>(
    '/api/notifications/mark-all-read' 
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
  fees?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    fees?: Record<string, unknown>[];
    data?: Record<string, unknown>[];
    message?: string;
  }>('/api/fee/getchoolFees');
  return response.data;
};


// Raise fee bill
export const raiseFeeBill = async (payload: Record<string, unknown>): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/fee/raise', payload);
  return response.data;
};

// Update fee bill
export const updateFee = async (billId: string, feeData: Record<string, unknown>): Promise<{ message: string }> => {
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
}): Promise<TransferResponse> => {
  try {
    const response = await apiClient.post<TransferResponse>('/api/transaction/transfer', payload);
    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Transfer failed';

    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as { message?: string; error?: string };
      errorMessage = data.message || data.error || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const lowerMsg = errorMessage.toLowerCase();
    if (lowerMsg.includes('pin')) errorMessage = 'Invalid PIN. Please try again.';
    if (lowerMsg.includes('balance') || lowerMsg.includes('insufficient')) {
      errorMessage = 'Insufficient balance. Please fund your wallet first.';
    }

    throw new Error(errorMessage);
  }
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

// Delete agent 
export const deleteAgent = async (agentId: string): Promise<DeleteAgentResponse> => {
  const response = await apiClient.delete<DeleteAgentResponse>(
    `/api/users/delete/${agentId}`
  );
  return response.data;
};

// Get user wallet
export const getUserWallet = async (): Promise<WalletResponse> => {
  const response = await apiClient.get<WalletResponse>('/api/wallet/getuserwallet');
  return response.data;
};

export const updateUserProfile = async (userId: string, profileData: UpdateUserPayload): Promise<UserResponse> => {
  
  const response = await apiClient.put<UserResponse>(
    `/api/users/update-user/${userId}`, 
    profileData
  );
  return response.data;
};

//update passsword
export const updateUserPassword = async (payload: UpdatePasswordPayload): Promise<void> => {
  await apiClient.post('/api/users/updatePassword', payload);
};

//set account pin
export const setAccountPin = async (payload: SetPinPayload): Promise<void> => {
  await apiClient.post('/api/pin/set', payload);
};

// Update an existing PIN
export const updateAccountPin = async (payload: UpdatePinPayload): Promise<void> => {
  await apiClient.post('/api/pin/update', payload);
};


// Service to handle the actual file upload to the server

export const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('profile', file);

  const response = await apiClient.post<{ profilePicture: string }>(
    '/api/users/upload-profile', 
    formData, 
    {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    }
  );
  return response.data;
};

// Service to update user notification preferences
 


export const updateNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreferences
) => {
  const response = await apiClient.post(
    `/api/users/update-notifications/${userId}`, 
    preferences
  );
  return response.data;
};

//Service to fetch all users (Admin/Management)

export const getAllUsers = async (): Promise<UserData[]> => {
  const response = await apiClient.get('/api/users/getallUsers');
  
 const rawUsers = (response.data.data || []) as User[];

  return rawUsers.map((u: User) => ({
    user: u
  }));
};


// Service to fetch dashboard data for admin overview

export const getAdminDashboardData = async () => {
  const [walletRes, chargesRes, usersRes] = await Promise.all([
    apiClient.get('/api/wallet/getChargesWallets'),
    apiClient.get('/api/charge/getAllCharges'),
    apiClient.get('/api/users/getallUsers')
  ]);

  return {
    wallets: walletRes.data,
    charges: chargesRes.data,
    users: usersRes.data
  };
};

// Get beneficiary emails for fund transfers

export const getBeneficiaryEmails = async (): Promise<string[]> => {
  const response = await apiClient.get<{ beneficiaries: { email: string }[] }>('/api/users/getBeneficiaries');
  const beneficiaries = response.data.beneficiaries || [];
  return beneficiaries.map(b => b.email);
};


// Add beneficiary (for parents to add their children as beneficiaries for fund transfers)
export const addBeneficiary = async (studentId: string) => {
  const response = await apiClient.post(`/api/users/addbeneficiary/${studentId}`);
  return response.data;
};


// Remove beneficiary (for parents to remove their children as beneficiaries for fund transfers)
export const removeBeneficiary = async (studentId: string) => {
  const response = await apiClient.delete(`/api/users/removebeneficiary/${studentId}`);
  return response.data;
};

export const verifyPinOtp = async (otp: string, newPin: string) => {
  const response = await apiClient.post('/api/pin/verifyotp', { otp, newPin });
  return response.data;
};