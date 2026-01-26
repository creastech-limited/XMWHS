import { apiClient } from './client';
import type {
  StudentsResponse,
  ParentsResponse,
  PinRequest,
  PinResponse,
  StudentDetails, StudentProfileFormData,
  SchoolFee,
} from '../../types/student';

// Get students by school ID
export const getStudentsBySchoolId = async (schoolId: string): Promise<StudentsResponse> => {
  const response = await apiClient.get<StudentsResponse>(`/api/users/getstudentbyid?id=${encodeURIComponent(schoolId)}`);
  return response.data;
};



// Get parents
export const getParents = async (): Promise<ParentsResponse> => {
  const response = await apiClient.get<ParentsResponse>('/api/users/getparents');
  return response.data;
};

// Update guardian
export const updateGuardian = async (guardianEmail: string, kidEmail: string): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>('/api/users/updateguardian', {
    guardianEmail,
    kidEmail
  });
  return response.data;
};

// Activate student
export const activateStudent = async (studentId: string): Promise<{ message: string; status?: string }> => {
  const response = await apiClient.put<{ message: string; status?: string }>(`/api/users/active/${studentId}`);
  return response.data;
};

// Deactivate student
export const deactivateStudent = async (studentId: string): Promise<{ message: string; status?: string }> => {
  const response = await apiClient.put<{ message: string; status?: string }>(`/api/users/deactive/${studentId}`);
  return response.data;
};

// Set PIN for student
export const setStudentPin = async (data: PinRequest): Promise<PinResponse> => {
  const response = await apiClient.post<PinResponse>('/api/pin/setforstudent', data);
  return response.data;
};

// Update PIN for student
export const updateStudentPin = async (data: PinRequest): Promise<PinResponse> => {
  const response = await apiClient.put<PinResponse>('/api/pin/updateforstudent', data);
  return response.data;
};

// Bulk upload students
export const bulkUploadStudents = async (file: File): Promise<{
  message: string;
  errors?: Array<{ row: number; error: string }>;
  successes?: Record<string, unknown>[];
  total?: number;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<{
    message: string;
    errors?: Array<{ row: number; error: string }>;
    successes?: Record<string, unknown>[];
    total?: number;
  }>('/api/users/bulkregister', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get student by ID
export const getStudentById = async (studentId: string): Promise<StudentDetails> => {
  const response = await apiClient.get<{
    user?: { data?: StudentDetails } | StudentDetails;
    data?: StudentDetails;
  }>(`/api/users/getuser/${studentId}`);
  
  const responseData = response.data;
  
  // Handle different API response structures
  if (responseData.user) {
    if ('data' in responseData.user && responseData.user.data) {
      return responseData.user.data;
    } else if ('_id' in responseData.user) {
      return responseData.user as StudentDetails;
    }
  }
  
  if (responseData.data) {
    return responseData.data;
  }
  
  throw new Error('Invalid response structure from server');
};

// Update student profile
export const updateStudentProfile = async (
  studentId: string, 
  profileData: StudentProfileFormData
): Promise<{ message: string; data?: StudentDetails }> => {
  const response = await apiClient.put<{ message: string; data?: StudentDetails }>(
    `/api/users/update-user/${studentId}`,
    profileData
  );
  return response.data;
};

// Fetch fees for a student by email
export const getFeesForStudent = async (email: string): Promise<SchoolFee[]> => {
  const response = await apiClient.get<SchoolFee[] | { data: SchoolFee[] }>(
    `/api/fee/getFeeForStudent/${encodeURIComponent(email)}`
  );
  
  const responseData = response.data;
  
  // Handle different API response structures
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }
  
  return [];
};

// Fetch fees by student ID 
export const getFeesByStudentId = async (studentId: string): Promise<SchoolFee[]> => {
  const response = await apiClient.get<SchoolFee[] | { data: SchoolFee[] }>(
    `/api/fee/student/${studentId}`
  );
  
  const responseData = response.data;
  
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }
  
  return [];
};