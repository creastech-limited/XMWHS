import { apiClient } from './client';
import type {
  Student,
  StudentsResponse,
  ParentsResponse,
  PinRequest,
  PinResponse,
  StudentDetails, StudentProfileFormData,
  SchoolFee,
  Kid, StudentsInSchoolResponse, ZipUploadResponse,SchoolsResponse,
} from '../../types/student';
import type { Charge } from '../../types';
// Get students by school ID
export const extractStudentEmail = (student: Record<string, unknown>): string => {
  if (!student || typeof student !== 'object') return '';
  const user = (student.user && typeof student.user === 'object') ? student.user as Record<string, unknown> : null;
  const userId = (student.userId && typeof student.userId === 'object') ? student.userId as Record<string, unknown> : null;
  const studentNested = (student.student && typeof student.student === 'object') ? student.student as Record<string, unknown> : null;
  const guardian = (student.guardian && typeof student.guardian === 'object') ? student.guardian as Record<string, unknown> : null;
  return (
    (student.email as string) ||
    (student.studentEmail as string) ||
    (student.userEmail as string) ||
    (user?.email as string) ||
    (userId?.email as string) ||
    (studentNested?.email as string) ||
    (student.guardianEmail as string) ||
    (guardian?.email as string) ||
    ''
  );
};

export const extractStudentName = (student: Record<string, unknown>): string => {
  if (!student || typeof student !== 'object') return 'Unknown Student';
  const user = (student.user && typeof student.user === 'object') ? student.user as Record<string, unknown> : null;
  const studentNested = (student.student && typeof student.student === 'object') ? student.student as Record<string, unknown> : null;
  const firstName = (student.firstName as string) || (student.first_name as string) || (user?.firstName as string) || (studentNested?.firstName as string) || '';
  const lastName = (student.lastName as string) || (student.last_name as string) || (user?.lastName as string) || (studentNested?.lastName as string) || '';
  const combined = `${firstName} ${lastName}`.trim();

  const fullName = (student.fullName as string) || (user?.fullName as string) || (studentNested?.fullName as string) || '';
  if (fullName && fullName.trim()) return fullName.trim();

  const studentName = (student.studentName as string) || '';
  if (studentName && studentName.trim()) return studentName.trim();

  const name = (student.name as string) || '';
  if (name && name.trim() && name !== 'Unknown' && name !== 'Unknown Student') return name.trim();

  const nestedName = (studentNested?.name as string) || (user?.name as string) || '';
  if (nestedName && nestedName.trim()) return nestedName.trim();

  if (combined) return combined;

  const email = (student.email as string) || '';
  if (email && email.trim()) return email.split('@')[0];

  return 'Unknown Student';
};

export const normalizeStudentData = (student: Record<string, unknown>, index: number = 0): Student => {
  const s = student; // Record<string, unknown> — access fields with explicit casts
  const userNested = (s.user && typeof s.user === 'object') ? s.user as Record<string, unknown> : null;
  const academicDetailsRaw = (s.academicDetails && typeof s.academicDetails === 'object') ? s.academicDetails as Record<string, unknown> : null;

  const email = extractStudentEmail(s);
  const name = extractStudentName(s);
  const fullName = (s.fullName as string) || name;
  const firstName = (s.firstName as string) || (s.first_name as string) || (name !== 'Unknown Student' ? name.split(' ')[0] : '') || '';
  const lastName = (s.lastName as string) || (s.last_name as string) || (name !== 'Unknown Student' ? name.split(' ').slice(1).join(' ') : '') || '';

  const fallbackId = String(
    (s.studentId as string) ||
    (s._id as string) ||
    (s.id as string) ||
    (s.student_id as string) ||
    (s.admissionNumber as string) ||
    (s.admission_number as string) ||
    (email ? email : `${(s.schoolId as string) || 'student'}-${index}`)
  );

  const studentId = String(
    (s.studentId as string) ||
    (s.student_id as string) ||
    (s.admissionNumber as string) ||
    (s.admission_number as string) ||
    fallbackId
  );

  const classVal = String(
    (s.classAdmittedTo as string) ||
    (s.Class as string) ||
    (s.class as string) ||
    (academicDetailsRaw?.classAdmittedTo as string) ||
    'Not Assigned'
  );

  const normalizedStatus = ((): 'Active' | 'Inactive' | 'Pending' => {
    const rawSt = String(s.status || '').toLowerCase().trim();
    if (rawSt === 'inactive' || rawSt === 'deactive' || rawSt === 'deactivated' || rawSt === 'disabled') return 'Inactive';
    if (rawSt === 'pending') return 'Pending';
    if (rawSt === 'active' || rawSt === 'activated') return 'Active';
    if (s.isActive === false || s.is_active === false) return 'Inactive';
    return 'Active';
  })();

  return {
    _id: fallbackId,
    student_id: studentId,
    name,
    fullName,
    firstName,
    lastName,
    email,
    phone: String((s.phone as string) || (userNested?.phone as string) || ''),
    role: String((s.role as string) || 'student'),
    status: normalizedStatus,
    admissionNumber: String((s.admissionNumber as string) || (s.admission_number as string) || (s.student_id as string) || ''),
    Class: classVal,
    classAdmittedTo: classVal,
    schoolId: String((s.schoolId as string) || ''),
    academicDetails: { classAdmittedTo: classVal },
    guardian: (s.guardian && typeof s.guardian === 'object')
      ? s.guardian as Student['guardian']
      : undefined,
    guardianName: (s.guardianName as string) || undefined,
    guardianEmail: (s.guardianEmail as string) || undefined,
    registrationDate: String((s.registrationDate as string) || (s.createdAt as string) || ''),
    createdAt: String((s.createdAt as string) || ''),
    updatedAt: String((s.updatedAt as string) || ''),
    isPinSet: Boolean(s.isPinSet ?? false),
    isFirstLogin: Boolean(s.isFirstLogin ?? false),
    profilePicture: (s.profilePicture as string) || (s.profilePics as string) || (s.profilePic as string) || undefined,
    profilePics: (s.profilePics as string) || (s.profilePicture as string) || (s.profilePic as string) || undefined,
    qrcode: (s.qrcode as string) || (s.QRcode as string) || undefined,
    QRcode: (s.QRcode as string) || (s.qrcode as string) || undefined,
    studentCanTopup: Boolean(s.studentCanTopup ?? false),
    studentCanTransfer: Boolean(s.studentCanTransfer ?? false),
    studentCanWithdraw: Boolean(s.studentCanWithdraw ?? false),
    studentCanPayBill: Boolean(s.studentCanPayBill ?? false),
    accountNumber: String((s.accountNumber as string) || ''),
  };
};

export const getStudentsBySchoolId = async (schoolId: string): Promise<StudentsResponse> => {
  const response = await apiClient.get<StudentsResponse | Record<string, unknown>>(
    `/api/users/getstudentbyid?id=${encodeURIComponent(schoolId)}`
  );
  
  const payload = response.data;
  let rawList: Record<string, unknown>[] = [];
  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.data)) {
      rawList = p.data as Record<string, unknown>[];
    } else if (Array.isArray(p.students)) {
      rawList = p.students as Record<string, unknown>[];
    } else if (Array.isArray(p.student)) {
      rawList = p.student as Record<string, unknown>[];
    }
  }

  const normalizedStudents = rawList.map((st, idx) => normalizeStudentData(st, idx));

  return {
    ...(typeof payload === 'object' && payload !== null ? (payload as StudentsResponse) : {}),
    data: normalizedStudents,
  } as StudentsResponse;
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

export const activateUser = async (
  userId: string
): Promise<{ message: string; status?: string }> => {
  if (!userId || userId === 'undefined' || userId === 'null') {
    throw new Error('Valid User ID is required for activation');
  }
  const response = await apiClient.put<{ message: string; status?: string }>(
    `/api/users/active/${encodeURIComponent(userId)}`
  );

  return response.data;
};

export const activateSchool = async (
  schoolId: string
): Promise<{ message: string; status?: string }> => {
  if (!schoolId || schoolId === 'undefined' || schoolId === 'null') {
    throw new Error('Valid School ID is required for activation');
  }

  const response = await apiClient.put<{ message: string; status?: string }>(
    `/api/users/active/${encodeURIComponent(schoolId)}`
  );

  return response.data;
};

export const deactivateUser = async (
  userId: string
): Promise<{ message: string; status?: string }> => {
  if (!userId || userId === 'undefined' || userId === 'null') {
    throw new Error('Valid User ID is required for deactivation');
  }
  const response = await apiClient.put<{ message: string; status?: string }>(
    `/api/users/deactive/${encodeURIComponent(userId)}`
  );

  return response.data;
};

export const deactivateSchool = async (
  schoolId: string
): Promise<{ message: string; status?: string }> => {
  if (!schoolId || schoolId === 'undefined' || schoolId === 'null') {
    throw new Error('Valid School ID is required for deactivation');
  }

  const response = await apiClient.put<{ message: string; status?: string }>(
    `/api/users/deactive/${encodeURIComponent(schoolId)}`
  );

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
    const transformedKids: Kid[] = studentsArray.map((student: Record<string, unknown>, index: number) => {
      const email = extractStudentEmail(student);
      const name = extractStudentName(student);
      const studentId =
        (student.studentId as string) ||
        (student._id as string) ||
        (student.id as string) ||
        (student.student_id as string) ||
        (student.admissionNumber as string) ||
        (email ? email : `student-${index}`);
      
      // Create avatar initial
      let avatarChar = 'K';
      if (name && name !== 'Unknown Student' && name.length > 0) {
        avatarChar = name[0];
      } else if (email && email.length > 0) {
        avatarChar = email[0];
      }
      
      return {
        id: studentId,
        student_id: (student.student_id as string) || studentId,
        studentId: (student.studentId as string) || studentId,
        _id: (student._id as string) || (student.studentId as string) || studentId,
        name: name,
        email: email,
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

export const normalizeAdminStudent = (student: Record<string, unknown>, index: number): Student => {
  return normalizeStudentData(student, index);
};

// Get students in a school by admin
export const getStudentsInSchoolByAdmin = async (
  schoolId: string
): Promise<StudentsInSchoolResponse> => {
  const response = await apiClient.get<StudentsInSchoolResponse>(
    `/api/users/getstudentinschoolbyadmin/${encodeURIComponent(schoolId)}`
  );

  const payload = response.data;
  const rawStudents = payload.data ?? payload.students ?? [];
  const normalizedStudents = (Array.isArray(rawStudents) ? rawStudents : []).map((student, index) =>
    normalizeAdminStudent(student as unknown as Record<string, unknown>, index)
  );

  return {
    ...payload,
    data: normalizedStudents,
    students: normalizedStudents
  };
};
 
// Bulk upload student profile pictures via zip
export const uploadStudentPhotosZip = async (zipfile: File): Promise<ZipUploadResponse> => {
  const formData = new FormData();
  formData.append('zipfile', zipfile);
 
  const response = await apiClient.post<ZipUploadResponse>(
    '/api/users/upload-zip',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

// Get all schools (Admin)
export const getAllSchools = async (): Promise<SchoolsResponse> => {
  const response = await apiClient.get<SchoolsResponse>('/api/users/getallSchools');
  return response.data;
};
