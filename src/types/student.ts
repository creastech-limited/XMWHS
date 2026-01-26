// student.ts
export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  academicDetails: {
    classAdmittedTo: string;
  };
  status: string;
  createdAt: string;
  classAdmittedTo?: string;
  guardian?: {
    fullName: string;
    relationship: string;
    email: string;
  };
}

export interface SchoolProfile {
  schoolId: string;
  schoolName: string;
  schoolType: string;
  ownership: string;
  Link: string;
}

export interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
}

export interface StudentsResponse {
  data?: Student[];
  message?: string;
  status?: string;
}

export interface ParentsResponse {
  parent?: Parent[];
  data?: Parent[];
  message?: string;
}

export interface PinRequest {
  studentEmail: string;
  pin?: string;
  newPin?: string;
}

export interface PinResponse {
  message: string;
  success?: boolean;
}