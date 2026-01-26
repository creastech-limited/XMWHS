import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  ForgotPasswordResponse,
  SchoolRegistrationRequest,
  RegistrationResponse,
   ParentRegistrationRequest,
   StoreRegistrationRequest,
    StudentRegistrationRequest,
     SchoolInfoResponse,
        ResetPasswordResponse
} from '../../types/auth';

// Validate token by checking if user exists
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/users/getuserone', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

// Login user
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/users/login', credentials);
  return response.data;
};

// Forgot password
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>('/api/users/forgotpassword', { email });
  return response.data;
};

// School registration
export const registerSchool = async (
  data: SchoolRegistrationRequest
): Promise<RegistrationResponse> => {
  const response = await apiClient.post<RegistrationResponse>('/api/users/register', data);
  return response.data;
};

// Parent registration
export const registerParent = async (
  data: ParentRegistrationRequest
): Promise<RegistrationResponse> => {
  const response = await apiClient.post<RegistrationResponse>('/api/users/register', data);
  return response.data;
};

// Store registration
export const registerStore = async (
  data: StoreRegistrationRequest
): Promise<RegistrationResponse> => {
  const response = await apiClient.post<RegistrationResponse>('/api/users/register', data);
  return response.data;
};

// Student registration
export const registerStudent = async (
  data: StudentRegistrationRequest
): Promise<RegistrationResponse> => {
  const response = await apiClient.post<RegistrationResponse>('/api/users/register', data);
  return response.data;
};

// Get school info by ID
export const getSchoolById = async (schoolId: string): Promise<SchoolInfoResponse> => {
  const response = await apiClient.get<SchoolInfoResponse>(`/api/users/getschoolbyid/${schoolId}`);
  return response.data;
};

// Reset password
export const resetPassword = async (
  token: string,
  password: string
): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post<ResetPasswordResponse>(`/api/users/reset-password/${token}`, {
    password
  });
  return response.data;
};
