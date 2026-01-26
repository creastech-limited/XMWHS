import { apiClient } from './client';
import type {
  UserResponse,
  StoreCountResponse,
  ClassesResponse,
  TransactionsResponse
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