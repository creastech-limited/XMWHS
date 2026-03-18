import { apiClient } from './client';
import type {
  Student,
  StudentsResponse,
  ParentsResponse,
  PinRequest,
  PinResponse,
  StudentDetails, StudentProfileFormData,
  SchoolFee,
  Kid,
} from '../../types/student';
import type { Charge } from '../../types';
// Get students by school ID
export const getStudentsBySchoolId = async (schoolId: string): Promise<StudentsResponse> => {
  const response = await apiClient.get<StudentsResponse>(`/api/users/getstudentbyid?id=${encodeURIComponent(schoolId)}`);
  return response.data;
};

// Get students in a school for admin
export const getStudentsInSchoolByAdmin = async (schoolId: string): Promise<Student[]> => {
  const response = await apiClient.get<
    Student[] | { data?: Student[]; students?: Student[] }
  >(`/api/users/getstudentinschoolbyadmin/${encodeURIComponent(schoolId)}`);

  const responseData = response.data;

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.students)) {
    return responseData.students;
  }

  return [];
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
export const getMyChildren = async (): Promise<{ data: Kid[] } | { data: [] }> => {
  try {
    const response = await apiClient.get<{ data: Kid[] }>('/api/users/getmychildren');
    console.log('getMyChildren response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getMyChildren:', error);
    return { data: [] };
  }
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
  try {
    console.log('Fetching all students...');
    const response = await apiClient.get('/api/users/getallsudent');
    console.log('Raw API response:', response.data);
    
    // Extract the data array - handle different response structures
    let studentsArray: Record<string, unknown>[] = [];
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      studentsArray = response.data.data;
    } else if (Array.isArray(response.data)) {
      studentsArray = response.data;
    } else if (response.data?.students && Array.isArray(response.data.students)) {
      studentsArray = response.data.students;
    } else {
      console.error('Unexpected API response structure:', response.data);
      return [];
    }
    
    console.log('Students array:', studentsArray);
    
    // Transform each student to match Kid interface
    const transformedKids: Kid[] = studentsArray.map((student: Record<string, unknown>) => {
      // Determine the ID - API uses student_id as primary
      const studentId = (student.student_id as string) || (student._id as string) || '';
      
      // Create name from available fields
      let name = 'Unknown Student';
      if (student.fullName) {
        name = student.fullName as string;
      } else if (student.name) {
        name = student.name as string;
      } else if (student.firstName || student.lastName) {
        name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      }
      
      // Create avatar initial
      let avatarChar = 'K';
      if (student.fullName && typeof student.fullName === 'string' && student.fullName.length > 0) {
        avatarChar = (student.fullName as string)[0];
      } else if (student.firstName && typeof student.firstName === 'string' && student.firstName.length > 0) {
        avatarChar = (student.firstName as string)[0];
      } else if (student.name && typeof student.name === 'string' && student.name.length > 0) {
        avatarChar = (student.name as string)[0];
      } else if (student.email && typeof student.email === 'string' && student.email.length > 0) {
        avatarChar = (student.email as string)[0];
      }
      
      return {
        id: studentId,                    // Use student_id as id
        student_id: studentId,             // Keep student_id
        _id: (student._id as string) || studentId,     // Keep _id if exists
        name: name,
        email: (student.email as string) || '',
        isBeneficiary: false,
        avatar: avatarChar.toUpperCase()
      };
    });
    
    console.log('Transformed kids:', transformedKids);
    return transformedKids;
    
  } catch (error) {
    console.error('Error in getAllStudents:', error);
    return [];
  }
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


