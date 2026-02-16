import { apiClient } from './client';
import type {
  StudentsResponse,
  ParentsResponse,
  PinRequest,
  PinResponse,
  StudentDetails, StudentProfileFormData,
  SchoolFee,
  Kid,
  ApiKid,
} from '../../types/student';
import type { Charge } from '../../types';
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

// Get my children (for parents)
export const getMyChildren = async () => {
  const response = await apiClient.get('/api/users/getmychildren');
  return response.data;
};

// Pay school fee
export const paySchoolFee = async (payload: {
  studentEmail: string;
  amount: number;
  feeId: string;
  pin: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    '/api/fee/pay',
    payload
  );
  return response.data;
};

// Get all students (for admin dashboard)

export const getAllStudents = async (): Promise<Kid[]> => {
  const response = await apiClient.get<{ data: ApiKid[] }>('/api/users/getallsudent');
  
  // Transform the data right here in the service
  return response.data.data.map((kid) => ({
    id: kid.student_id,
    student_id: kid.student_id,
    name: kid.fullName || kid.name || `${kid.firstName ?? ''} ${kid.lastName ?? ''}`.trim() || "Unknown",
    email: kid.email,
    isBeneficiary: false,
    avatar: (kid.fullName ?? kid.firstName ?? kid.name ?? 'K').charAt(0).toUpperCase()
  }));

};

// Get transfer charge

export const getTransferCharge = async (): Promise<number> => {
  const response = await apiClient.get<Charge[]>('/api/charge/getallcharges');
  
  if (Array.isArray(response.data)) {
    const transferCharge = response.data.find(
      (charge) => charge.name.toLowerCase().includes('transfer') && charge.status === 'Active'
    );
    return transferCharge ? transferCharge.amount : 0;
  }
  
  return 0;
};

