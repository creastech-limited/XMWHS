// student.ts
export interface Student {
  _id: string;
  firstName: string;        
  lastName: string;        
  name: string;            
  email: string;            
  phone: string;            
  role?: string;            
  status: 'Active' | 'Inactive' | 'Pending'; 
  student_id: string;       
  schoolId: string;         
  Class: string;  
  classAdmittedTo: string;           
  academicDetails: {        
    classAdmittedTo: string;
  };
  guardian?: {            
    fullName: string;
    relationship: string;
    email: string;
    phone: string;
    address?: string;
  };
  registrationDate: string; 
  createdAt: string;        
  updatedAt: string;        
  isPinSet: boolean;       
  isFirstLogin: boolean;    
  profilePicture?: string;  
  qrcode?: string;          
  accountNumber?: string;   
  
  // Permission flags 
  studentCanTopup: boolean;
  studentCanTransfer: boolean;
  studentCanWithdraw: boolean;
  studentCanPayBill: boolean;
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
   remainingAmount: number;
}

export interface TransactionSummary {
  total: number;
  paid: number;
  remaining: number;
}

export interface BillsData {
  [studentId: string]: {
    student: Student;
    bills: Bill[];
  };
}

export interface Profile {
  name?: string;
  fullName?: string;
  avatar?: string;
  _id?: string;
  wallet?: {
    balance: number;
    [key: string]: number | undefined;
  };
}

export interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  route: string;
}

export interface TrendData {
  name: string;
  payment: number;
  transaction: number;
}

export interface SpendingCategory {
  name: string;
  value: number;
  color: string;
}

export interface Kid {
  id: string; 
  student_id: string; 
  name: string;
  email: string;
  isBeneficiary: boolean;
  avatar: string;
  _id?: string;  
}

export interface ApiKid {
  _id: string;
  student_id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  class?: string;
  role?: string;
}
export interface ApiTransaction {
  _id: string;
  recipientName?: string;
  amount: number;
  createdAt: string;
  note?: string;
  status: string;
}

