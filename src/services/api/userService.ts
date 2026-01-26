import { apiClient } from './client';
import type {
  UserResponse,
  StoreCountResponse,
  ClassesResponse,
  TransactionsResponse,  Store, StoreDetails, StoreProfileFormData
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