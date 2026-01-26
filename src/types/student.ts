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
export interface StudentDetails {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePic: string;
  createdAt?: string;
  class: string;
  address: string;
  firstName?: string;
  lastName?: string;
  academicDetails?: {
    classAdmittedTo: string;
  };
  status?: string;
  role?: string;
}

export interface StudentProfileFormData {
  name: string;
  email: string;
  phone: string;
  class: string;
  address: string;
}
export interface SchoolFee {
  _id: string;
  studentId: string;
  feeId: string;
  amount: number;
  feeType: string;
  term: string;
  session: string;
  className: string;
  schoolId: string;
  amountPaid: number;
  paymentMethod: string;
  transactionId: string;
  status: 'Paid' | 'Unpaid' | 'partial';
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface Bill {
  id: string;
  _id: string;
  feeId: string;
  description: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
  term: string;
  session: string;
  transactionId: string;
}

export interface TransactionSummary {
  total: number;
  paid: number;
  remaining: number;
}