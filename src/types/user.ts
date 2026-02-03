// user.ts
import type { Student } from "./student";

/* ====================== USER TYPES ====================== */

/* ----------------------- USER ----------------------- */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;

  // Personal details
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Balance and wallet
  balance?: number;
  wallet?: {
    balance?: number | string;
    currency?: string;
    walletId?: string;
  };
  walletBalance?: number;

  // School information
  schoolId?: string;
  schoolName?: string;
  schoolType?: string;
  schoolAddress?: string;
  ownership?: string;
  schoolCanTransfer?: boolean;

  // Store information
  storeName?: string;
  storeType?: string;

  // Other properties
  avatar?: string;
  Link?: string;

  // Allow extra properties from API
  [key: string]: unknown;
}

export interface SchoolUser {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  phone?: string;
}

export interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}
/* ----------------------- WALLET ----------------------- */
export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  type: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

/* ----------------------- USER RESPONSE ----------------------- */
export interface UserResponse {
  success?: boolean;
  data?: User;

  user?: {
    data?: User;
    wallet?: {
      balance: number;
      currency?: string;
      walletId?: string;
    };
  };

  wallet?: {
    balance: number;
    currency?: string;
    walletId?: string;
  };

  message?: string;
  [key: string]: unknown;
}


export interface FetchUserDetailsResponse {
  user?: {
    data?: UserProfile;
    [key: string]: unknown;
  };
  data?: UserProfile;
  [key: string]: unknown;
}
/* ====================== TRANSACTION TYPES ====================== */

/* ----------------------- TRANSACTIONS ----------------------- */
export interface Transaction {
  _id: string;
  date: string;
  createdAt: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  customer: string;
  [key: string]: unknown;
}

export interface TransactionsResponse {
  success?: boolean;
  message?: string;
  data?: Transaction[];
  transactions?: Transaction[];
}

/* ====================== CLASS TYPES ====================== */

/* ----------------------- CLASSES ----------------------- */
export interface Class {
  _id: string;
  className: string;
  section: string;
  schoolId: string;
  students: string[] | Student[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}


export interface ClassItem {
  _id: string;
  className: string;
  section: string;
  schoolId: string;
  students: string[] | Student[];

  createdAt: string;
  updatedAt: string;

  [key: string]: unknown;
}

export interface ClassesResponse {
  data?: ClassItem[];
  classes?: ClassItem[];
  status?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Normalized class structure used in your frontend
 */
export interface SchoolClass {
  _id: string;
  className: string;
  schoolId: string;
  students: string[] | Student[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

/* ====================== STORE TYPES ====================== */

/* ----------------------- STORE ----------------------- */
export interface Store {
  _id: string;
  storeName: string;
  storeType: string;
  location: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  schoolId?: string;
}

export interface StoreDetails {
  _id: string;
  name: string;
  type: string;

  email?: string;
  location?: string;
  profilePic?: string;

  createdAt?: string;
  phone?: string;
  storeType?: string;
  storeName?: string;
  status?: string;

  schoolId?: string;
  store_id: string;
}

export interface StoreProfileFormData {
  name: string;
  email: string;
  location: string;
  type: string;
  phone: string;
}

export interface StoreCountResponse {
  data?: number;
  count?: number;
  totalStores?: number;
  message?: string;
}

/* ====================== AGENT TYPES ====================== */

/* ----------------------- AGENTS ----------------------- */
export interface StoreAgent {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: string;
  avatarColor?: string;
  avatarInitial?: string;
  schoolId: string;
}

export interface Agent {
  name: string;
  sales: number;
  performance: number;
  revenue: number;
}

export interface GetAgentsResponse {
  message: string;
  data?: {
    schoolId?: string;
    agent?: StoreAgent[];
    store?: StoreDetails;
  };
}

export interface AgentCountResponse {
  data: number;
  message?: string;
}

export interface AgentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export interface AgentRegistrationResponse {
  message: string;
  data?: any;
}

export interface DeleteAgentResponse {
  message: string;
  success?: boolean;
}

/* ====================== NOTIFICATION TYPES ====================== */

/* ----------------------- NOTIFICATIONS ----------------------- */
export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  __v: number;
}

export interface NotificationsResponse {
  success?: boolean;
  message?: string;
  data?: Notification[];
  notifications?: Notification[];
}

/* ====================== BANK & WITHDRAWAL TYPES ====================== */

/* ----------------------- BANK ----------------------- */
export interface Bank {
  id: string;
  name: string;
  code: string;
}

export interface ApiBankData {
  id: number;
  name: string;
  code: string;
  slug: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  supports_transfer: boolean;
  available_for_direct_debit: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ----------------------- WITHDRAWAL ----------------------- */
export interface WithdrawalValidation {
  amount: number;
  charge: number;
  total: number;
  account_name: string;
  account_number: string;
  bank_name: string;
}

export interface WithdrawalRequest {
  amount: number;
  description?: string;
  pin: string;
  account_name: string;
  account_number: string;
  bank_code: string;
}

export interface WithdrawalResponse {
  message: string;
  success?: boolean;
  data?: {
    reference?: string;
    amount?: number;
    status?: string;
    createdAt?: string;
  };
}

/* ====================== FEE & BILLING TYPES ====================== */

/* ----------------------- SCHOOL FEES ----------------------- */
export interface FormData {
  className: string;
  session: string;
  term: string;
  amount: string;
  description: string;
  dueDate: string;
  feeType: string;
}

export interface FeeBill {
  _id: string;
  className: string;
  session: string;
  term: string;
  amount: string;
  description: string;
  dueDate: string;
  feeType: string;
}

export interface FeesResponse {
  success?: boolean;
  message?: string;
  fees?: FeeBill[];
  data?: FeeBill[];
}

export interface RaiseFeeRequest extends FormData {
  schoolId: string;
}

export interface RaiseFeeResponse {
  message: string;
  success?: boolean;
  data?: {
    _id: string;
    // ... other fee properties
  };
}

export interface UpdateFeeRequest {
  studentId?: string;
  studentName?: string;
  className?: string;
  academicYear?: string;
  term?: string;
  amount?: number;
  paidAmount?: number;
  status?: string;
  dueDate?: string;
  description?: string;
}

export interface UpdateFeeResponse {
  message: string;
  success?: boolean;
  data?: {
    _id: string;
    // ... updated fee properties
  };
}

export interface DeleteFeeResponse {
  message: string;
  success?: boolean;
}

export interface Charge {
  _id: string;
  name: string;
  amount: number;
  status: 'Active' | 'Inactive';
  description?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ChargesResponse {
  success?: boolean;
  message?: string;
  data?: Charge[];
}

/* ====================== OTP & ACCOUNT TYPES ====================== */

/* ----------------------- OTP ----------------------- */
export interface GenerateOtpResponse {
  message: string;
  success?: boolean;
  data?: {
    otp?: string;
    expiresAt?: string;
  };
}

export interface VerifyOtpRequest {
  otp: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
}

export interface VerifyOtpResponse {
  message: string;
  success?: boolean;
  data?: {
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      bankCode?: string;
    };
  };
}

export interface ResolveAccountResponse {
  account_name?: string;
  data?: { account_name?: string };
  message?: string;
  status?: boolean;
}

/* ====================== DASHBOARD TYPES ====================== */

/* ----------------------- DASHBOARD ----------------------- */
export interface DashboardData {
  balance: number;
  dailyRevenue: number;
  numberOfAgents: number;

  growth: {
    revenue: number;
    agents: number;
  };

  recentTransactions: Transaction[];
  topAgents: Agent[];
  notifications: Notification[];
}

/* ====================== UI & STATE TYPES ====================== */

/* ----------------------- SNACKBAR ----------------------- */
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

/* ====================== DISPUTE TYPES ====================== */
/* ----------------------- DISPUTES ----------------------- */
export interface Dispute {
  _id?: string;
  disputeType?: string;
  description?: string;
  transactionId?: string | {
    _id?: string;
    reference?: string;
    amount?: number;
    status?: string;
    [key: string]: unknown;
  };
  paymentCategory?: string;
  amount?: number;
  supportingDocuments?: string[] | string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  raisedByName?: string;
  raisedByEmail?: string;
  resolvedBy?: {
    _id?: string;
    email?: string;
  };
  resolvedDate?: string;
  [key: string]: unknown;
}

export interface FetchDisputesResponse {
  message?: string;
  disputes?: Dispute[];
  data?: Dispute[];
  [key: string]: unknown;
}

export interface CreateDisputeData {
  disputeType: string;
  description: string;
  transactionId: string;
  paymentCategory: string;
  amount: number;
  supportingDocuments: string[];
}

export interface CreateDisputeResponse {
  message?: string;
  savedDispute?: Dispute;
  dispute?: Dispute;
  data?: Dispute;
  error?: string;
  details?: string;
  [key: string]: unknown;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}