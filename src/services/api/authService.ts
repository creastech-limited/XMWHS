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
  SecurityRegistrationRequest,
  SchoolInfoResponse,
  ResetPasswordResponse
} from '../../types/auth';
import { getUserDetails } from './userService';

// Validate token by checking if user exists
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    // Same token the app is already using: share the cached/in-flight request
    if (token === localStorage.getItem('token')) {
      await getUserDetails();
      return true;
    }

    // A token that isn't stored yet (e.g. mid-login): check it on its own
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

export const logout = async (): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('api/users/logout');
  return response.data;
}

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
  const response = await apiClient.post<RegistrationResponse>('/api/users/register', {
    ...data,
    role: 'store',
  });
  return response.data;
};

// Student registration
export const registerStudent = async (
  data: StudentRegistrationRequest
): Promise<RegistrationResponse> => {
  const response = await apiClient.post<RegistrationResponse>('/api/users/register', data);
  return response.data;
};

// Security registration
export const registerSecurity = async (
  data: SecurityRegistrationRequest
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

// Update this in your userService.ts
export const requestPinReset = async (newPin: string) => {
  const response = await apiClient.post('/api/pin/request-reset', { newPin });
  return response.data;
};
