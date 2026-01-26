// user.ts
import type { Student } from "./student";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  balance?: number;
  schoolId?: string;
  schoolName?: string;
  schoolType?: string;
  schoolAddress?: string;
  ownership?: string;
  Link?: string;
  [key: string]: unknown;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  type: string;
}

export interface Transaction {
  _id: string;
  createdAt: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  [key: string]: unknown;
}

export interface UserResponse {
  success?: boolean;
  user?: {
    data?: User;
    wallet?: {
      balance: number;
    };
  };
  data?: User;
  wallet?: {
    balance: number;
  };
  message?: string;
}

export interface StoreCountResponse {
  data?: number;
  count?: number;
  totalStores?: number;
  message?: string;
}

export interface ClassItem {
  _id: string;
  className: string;
  section: string;
  schoolId: string;
  students: string[] | Student[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface ClassesResponse {
  data?: ClassItem[];
  message?: string;
  status?: string;
}

export interface TransactionsResponse {
  data?: Transaction[];
  message?: string;
}

export interface Store {
  _id: string;
  storeName: string;
  storeType: string;
  location: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  schoolId?: string;
}

export interface StoreCountResponse {
  data?: number;
  count?: number;
  message?: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}
export interface StoreDetails {
  _id: string;
  name: string;
  email: string;
  location: string;
  profilePic: string;
  createdAt?: string;
  type: string;
  phone?: string;
  storeType?: string; 
  storeName?: string;
  status?: string;
  schoolId?: string;
}

export interface StoreProfileFormData {
  name: string;
  email: string;
  location: string;
  type: string;
  phone: string;
}