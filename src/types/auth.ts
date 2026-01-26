import type { User } from './user';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, jwt: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    [key: string]: unknown;
  };
  accessToken: string;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface SchoolRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  schoolName: string;
  schoolAddress: string;
  phone: string;
  schoolType: SchoolType;
}

export type SchoolType = 'primary' | 'secondary' | 'polytechnic' | 'university';

export interface RegistrationResponse {
  message: string;
  success: boolean;
  user?: {
    _id: string;
    email: string;
    role: string;
    // other user fields
  };
}

export interface ParentRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; // Should be 'parent'
  termsAccepted?: boolean;
}

export interface StoreRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; // Should be 'store'
  storeName: string;
  storeType: string;
  phone: string;
  location: string;
  description: string;
  schoolId?: string;
  schoolName?: string;
  school?: string;
}

export interface StudentRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string; // Should be 'student'
  password: string;
  academicDetails: {
    classAdmittedTo: string;
  };
  schoolId: string;
  schoolName: string;
  schoolType: string;
  schoolAddress: string;
}

export interface SchoolInfoResponse {
  success: boolean;
  data?: {
    _id: string;
    schoolName: string;
    schoolType: string;
    schoolAddress: string;
    classes: Array<{
      className: string;
      section: string;
    }>;
  };
  message?: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
  success?: boolean;
}