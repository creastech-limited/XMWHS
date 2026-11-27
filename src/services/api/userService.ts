import { apiClient } from './client';
import type {
  UserResponse,
  StoreCountResponse,
  ClassesResponse,
  Transaction,
  TransactionsResponse, Store, StoreDetails, StoreProfileFormData,
  StoreAgent,
  AgentCountResponse,
  GetAgentsResponse,
  AgentRegistrationData,
  AgentRegistrationResponse,
  WithdrawalValidation,
  ApiBankData,
  ChargesResponse,
  Charge,
  SchoolUser,
  SecurityUser,
  SecurityUsersResponse,
  AttendanceRecord,
  AttendanceResponse,
  Dispute,
  CreateDisputeData,
  CreateDisputeResponse,
  DeleteAgentResponse,
  NotificationsResponse,
  UpdateUserPayload,
  UpdatePasswordPayload,
  UpdatePinPayload,
  SetPinPayload,
  NotificationPreferences,
  UserData,
  WalletResponse,
  TransferResponse,
} from '../../types/user';
import type { DidNumber, CreateDidInput, CreateDidResponse, CreateDidBatchResult, DidClientReport, InvoicesResponse, InvoiceDetailResponse, DidMeNumber, DidMeReport, DidMeInvoice, DidMeInvoiceDetail, DidMeCallsResult, DidMeCall, DidMeCallsParams, DidMeDashboard, StoreReportTableResponse, StoreReportTableParams, StartPaymentResponse, VerifyPaymentResponse } from '../../types/agent';
import type { FeeReport, FeeReportParams, } from '../../types/school';
import type { CdrImportResponse, CdrImportResult, CdrImportsResponse } from '../../types/store';
import axios from 'axios';

let cached: { data: UserResponse; at: number; token: string | null } | null = null;
let inflight: { promise: Promise<UserResponse>; token: string | null } | null = null;

const USER_CACHE_TTL = 60_000;

const currentToken = () => localStorage.getItem('token');

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
}

export interface UpdateChargePayload {
  name: string;
  chargeType: 'Flat' | 'Percentage';
  amount: number;
  amount2?: number;
  amount3?: number;
  description: string;
}

export interface CreateStorePayload {
  schoolId: string;
  schoolName: string;
  storeName: string;
  storeType: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}



// Get user details
export const getUserDetails = async (force = false): Promise<UserResponse> => {
  const token = currentToken();

  if (!force && cached && cached.token === token && Date.now() - cached.at < USER_CACHE_TTL) {
    return cached.data;
  }

  if (!force && inflight && inflight.token === token) {
    return inflight.promise;
  }

  const promise = apiClient
    .get<UserResponse>('/api/users/getuserone')
    .then((res) => {
      cached = { data: res.data, at: Date.now(), token };
      return res.data;
    })
    .finally(() => {
      inflight = null;
    });

  inflight = { promise, token };
  return promise;
};

export const clearUserCache = () => {
  cached = null;
  inflight = null;
};

// Get store count
export const getStoreCount = async (): Promise<StoreCountResponse> => {
  const response = await apiClient.get<StoreCountResponse>('/api/users/getstorebyidcount');
  return response.data;
};

// Get classes and students
export const getClasses = async (): Promise<ClassesResponse> => {
  const response = await apiClient.get<ClassesResponse>('/api/users/getclasse');
  return response.data;
};

// Get user transactions
export const getUserTransactions = async (
  params: GetTransactionsParams = {}
): Promise<TransactionsResponse> => {
  const response = await apiClient.get<TransactionsResponse>(
    '/api/transaction/getusertransaction',
    { params }
  );
  return response.data;
};

// Get store by school ID
export const getStoresBySchoolId = async (schoolId: string): Promise<Store[]> => {
  const response = await apiClient.get<Store[] | { data: Store[] } | { stores: Store[] }>(
    `/api/users/getstorebyid?id=${encodeURIComponent(schoolId)}`
  );

  const responseData = response.data;

  // Handle different API response structures
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
    return responseData.data;
  } else if (responseData && 'stores' in responseData && Array.isArray(responseData.stores)) {
    return responseData.stores;
  }

  return [];
};

// Get stores in a school for admin
export const getStoresInSchoolByAdmin = async (schoolId: string): Promise<Store[]> => {
  const response = await apiClient.get<Store[] | { data?: Store[]; stores?: Store[] }>(
    `/api/users/getstoreinschoolbyadmin/${encodeURIComponent(schoolId)}`
  );

  const responseData = response.data;
  let rawStores: unknown[] = [];

  if (Array.isArray(responseData)) {
    rawStores = responseData;
  } else if (Array.isArray(responseData?.data)) {
    rawStores = responseData.data;
  } else if (Array.isArray(responseData?.stores)) {
    rawStores = responseData.stores;
  }

  return rawStores.map((store: unknown, index: number) => {
    const s = (store || {}) as Record<string, unknown>;
    const rawStatus = String(s.status || s.storeStatus || s.userStatus || '').toLowerCase().trim();
    let status = 'Active';
    if (
      rawStatus === 'inactive' ||
      rawStatus === 'deactive' ||
      rawStatus === 'deactivated' ||
      rawStatus === 'disabled' ||
      s.isActive === false ||
      s.is_active === false
    ) {
      status = 'Inactive';
    } else if (rawStatus === 'pending') {
      status = 'Pending';
    }

    const storeId =
      (s._id as string) ||
      (s.storeId as string) ||
      (s.id as string) ||
      (s.store_id as string) ||
      (s.userId as string) ||
      `store-${schoolId}-${index}`;

    return {
      ...(s as unknown as Store),
      _id: storeId,
      storeId: (s.storeId as string) || storeId,
      id: (s.id as string) || storeId,
      status: status
    };
  });
};

// Get store count by school ID
export const getStoreCountBySchoolId = async (schoolId: string, status?: string): Promise<number> => {
  const url = status
    ? `/api/users/getstorebyidcount?id=${encodeURIComponent(schoolId)}&status=${status}`
    : `/api/users/getstorebyidcount?id=${encodeURIComponent(schoolId)}`;

  const response = await apiClient.get<StoreCountResponse | number>(url);

  const responseData = response.data;

  if (typeof responseData === 'number') {
    return responseData;
  } else if (responseData?.data !== undefined && responseData.data !== null) {
    return responseData.data;
  } else if (responseData?.count !== undefined) {
    return responseData.count;
  }

  return 0;
};

// Reset password for store/account
export const resetStorePassword = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/users/resetpassword', { email });
  return response.data;
};

// Activate store
export const activateStore = async (storeId: string): Promise<{ message: string; status?: string }> => {
  const response = await apiClient.put<{ message: string; status?: string }>(`/api/users/active/${storeId}`);
  return response.data;
};



// Deactivate store
export const deactivateStore = async (storeId: string): Promise<{ message: string; status?: string }> => {
  const response = await apiClient.put<{ message: string; status?: string }>(`/api/users/deactive/${storeId}`);
  return response.data;
};

// Get store by ID 
export const getStoreById = async (storeId: string): Promise<StoreDetails> => {
  const response = await apiClient.get<{
    user?: { data?: StoreDetails } | StoreDetails;
    data?: StoreDetails;
  }>(`/api/users/getuser/${storeId}`);

  const responseData = response.data;

  // Handle different API response structures
  if (responseData.user) {
    if ('data' in responseData.user && responseData.user.data) {
      return responseData.user.data;
    } else if ('_id' in responseData.user) {
      return responseData.user as StoreDetails;
    }
  }

  if (responseData.data) {
    return responseData.data;
  }

  throw new Error('Invalid response structure from server');
};

// Update store profile
export const updateStoreProfile = async (
  storeId: string,
  profileData: StoreProfileFormData
): Promise<{ message: string; data?: StoreDetails }> => {
  const response = await apiClient.put<{ message: string; data?: StoreDetails }>(
    `/api/users/update-user/${storeId}`,
    profileData
  );
  return response.data;
};

// get notifications

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await apiClient.get<NotificationsResponse>('api/notification/get');
  return response.data;
};

// Mark notification as read
export const getmarkNotification = async (notificationId: string): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>(
    `/api/notifications/markasread/${notificationId}`
  );
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {

  const response = await apiClient.put<{ message: string }>(
    '/api/notifications/mark-all-read'
  );
  return response.data;
};

// Get agent count for the current store or school
export const getAgentCount = async (): Promise<number> => {
  try {
    const agentsResponse = await getAgentsById();
    const rawAgents = Array.isArray(agentsResponse.data?.agent)
      ? agentsResponse.data.agent
      : Array.isArray((agentsResponse as unknown as { agent?: unknown }).agent)
        ? (agentsResponse as unknown as { agent?: StoreAgent[] }).agent
        : [];

    const agents: StoreAgent[] = Array.isArray(rawAgents) ? rawAgents : [];

    if (agents.length > 0) {
      return agents.length;
    }
  } catch (error) {
    console.error('Failed to fetch agents via store-compatible endpoint:', error);
  }

  const response = await apiClient.get<AgentCountResponse>('/api/users/getagentbyidcount');
  const responseData = response.data;

  if (typeof responseData === 'number') {
    return responseData;
  }

  if (responseData?.data !== undefined && responseData.data !== null) {
    return responseData.data;
  }

  if (responseData?.count !== undefined && responseData.count !== null) {
    return responseData.count;
  }

  return 0;
};

// Fetch agents by ID (supports school ID or store ID)
export const getAgentsById = async (schoolOrStoreId?: string): Promise<GetAgentsResponse> => {
  if (!schoolOrStoreId) {
    const response = await apiClient.get<GetAgentsResponse>('/api/users/getagentbyid');
    return response.data;
  }

  const encodedId = encodeURIComponent(schoolOrStoreId);
  const candidateUrls = [
    `/api/users/getagentbyid?storeId=${encodedId}&schoolId=${encodedId}`,
    `/api/users/getagentbyid?storeId=${encodedId}`,
    `/api/users/getagentbyid?schoolId=${encodedId}`,
    `/api/users/getagentbyid?store_id=${encodedId}&school_id=${encodedId}`,
    `/api/users/getagentbyid?id=${encodedId}`,
    `/api/users/getagentbyid/${encodedId}`
  ];

  for (const url of candidateUrls) {
    try {
      const response = await apiClient.get<GetAgentsResponse>(url);
      if (response.data) {
        return response.data;
      }
    } catch {
      // Continue to next candidate
    }
  }

  const fallback = await apiClient.get<GetAgentsResponse>(`/api/users/getagentbyid?storeId=${encodedId}&schoolId=${encodedId}`);
  return fallback.data;
};

// Get agents in a store by store ID
export const getAgentsInStoreByAdmin = async (storeId: string): Promise<StoreAgent[]> => {
  const encodedId = encodeURIComponent(storeId);
  const endpoints = [
    `/api/users/getagentbyid?storeId=${encodedId}&schoolId=${encodedId}`,
    `/api/users/getagentbyid?storeId=${encodedId}`,
    `/api/users/getagentbyid?schoolId=${encodedId}`,
    `/api/users/getagentbyid?store_id=${encodedId}&school_id=${encodedId}`,
    `/api/users/getagentbyid?id=${encodedId}`,
    `/api/users/getagentbyid/${encodedId}`,
    `/api/users/getagentinstorebyadmin/${encodedId}`,
    `/api/users/getagentinschoolbyadmin/${encodedId}`
  ];

  let responseData: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      if (response.data) {
        responseData = response.data;
        break;
      }
    } catch {
      // Try next endpoint candidate
    }
  }

  const rawAgents = (() => {
    if (!responseData) return [];

    if (Array.isArray(responseData)) {
      return responseData;
    }

    const dataObj = responseData as {
      data?: StoreAgent[] | { agent?: StoreAgent[]; data?: { agent?: StoreAgent[] } };
      agent?: StoreAgent[];
      agents?: StoreAgent[];
    };

    if (Array.isArray(dataObj.data)) {
      return dataObj.data;
    }

    if (Array.isArray(dataObj.agent)) {
      return dataObj.agent;
    }

    if (Array.isArray(dataObj.agents)) {
      return dataObj.agents;
    }

    if (dataObj.data && typeof dataObj.data === 'object' && !Array.isArray(dataObj.data)) {
      if (Array.isArray(dataObj.data.agent)) {
        return dataObj.data.agent;
      }

      if (dataObj.data.data && Array.isArray(dataObj.data.data.agent)) {
        return dataObj.data.data.agent;
      }
    }

    return [];
  })();

  return rawAgents.map((agent: unknown, index: number) => {
    const raw = (agent || {}) as Record<string, unknown>;
    const nestedUser = (raw.user && typeof raw.user === 'object') ? raw.user as Record<string, unknown> : undefined;

    // Also check extra nested containers the backend may wrap agents in
    const nestedAgent = (raw.agent && typeof raw.agent === 'object') ? raw.agent as Record<string, unknown> : undefined;
    const nestedAgentData = (raw.agentData && typeof raw.agentData === 'object') ? raw.agentData as Record<string, unknown> : undefined;
    const nestedUserData = (raw.userData && typeof raw.userData === 'object') ? raw.userData as Record<string, unknown> : undefined;

    // Resolve MongoDB _id — never fall back to email
    const resolvedId =
      (raw._id as string) ||
      (raw.agentId as string) ||
      (raw.agent_id as string) ||
      (raw.userId as string) ||
      (raw.user_id as string) ||
      (raw.id as string) ||
      (nestedUser?._id as string) ||
      (nestedUser?.id as string) ||
      (nestedUser?.userId as string) ||
      (nestedUser?.agentId as string) ||
      (nestedAgent?._id as string) ||
      (nestedAgent?.id as string) ||
      (nestedAgentData?._id as string) ||
      (nestedAgentData?.id as string) ||
      (nestedUserData?._id as string) ||
      (nestedUserData?.id as string) ||
      '';

    // Normalize status: treat 'deactive', 'inactive', 'deactivated', 'disabled', 'pending'
    // and isActive=false as 'Inactive'; anything 'active' as 'Active'
    const rawStatus = String(
      raw.status ||
      nestedUser?.status ||
      ''
    ).toLowerCase().trim();

    const isActiveBool =
      raw.isActive ?? raw.is_active ?? raw.active ??
      nestedUser?.isActive ?? nestedUser?.is_active ?? null;

    let normalizedStatus: 'Active' | 'Inactive' | 'Pending' = 'Active';
    if (rawStatus === 'active' || rawStatus === 'activated' || rawStatus === 'enabled') {
      normalizedStatus = 'Active';
    } else if (
      rawStatus === 'inactive' ||
      rawStatus === 'deactive' ||
      rawStatus === 'deactivated' ||
      rawStatus === 'disabled'
    ) {
      normalizedStatus = 'Inactive';
    } else if (rawStatus === 'pending') {
      normalizedStatus = 'Pending';
    } else if (isActiveBool === false) {
      normalizedStatus = 'Inactive';
    } else if (isActiveBool === true) {
      normalizedStatus = 'Active';
    }

    const normalizedAgent = raw as unknown as StoreAgent & { _id?: string; status?: string };

    return {
      ...normalizedAgent,
      id: resolvedId || `agent-${storeId}-${index}`,
      status: normalizedStatus,
      fullName:
        (raw.fullName as string) ||
        `${(raw.firstName as string) || ''} ${(raw.lastName as string) || ''}`.trim() ||
        (nestedUser?.fullName as string) ||
        `${(nestedUser?.firstName as string) || ''} ${(nestedUser?.lastName as string) || ''}`.trim() ||
        'Unnamed Agent'
    };
  });
};

// Create a store (owner is emailed an invite to set their password)
export const createStore = async (payload: CreateStorePayload): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>('/api/users/register', {
      ...payload,
      role: 'store',
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create store.'
      );
    }
    throw new Error('Failed to create store.');
  }
};

// Register agent
export const registerAgent = async (
  agentData: AgentRegistrationData
): Promise<AgentRegistrationResponse> => {
  try {
    const response = await apiClient.post<AgentRegistrationResponse>(
      "/api/users/register",
      agentData
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (Array.isArray(error.response?.data?.errors)
          ? error.response?.data?.errors[0]
          : null) ||
        "Failed to create agent.";

      throw new Error(message);
    }

    throw new Error("Failed to create agent.");
  }
}

// Banks API
export const getBanks = async (): Promise<ApiBankData[]> => {
  const response = await apiClient.get<{ data: ApiBankData[] }>('/api/transaction/banks');
  return response.data.data || [];
};

// Resolve Account API
export const resolveAccount = async (
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string; data?: { account_name: string } }> => {
  const response = await apiClient.get<{ account_name: string; data?: { account_name: string } }>(
    `/api/transaction/resolveaccount?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  return response.data;
};

// OTP API
export const generateOtp = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/otp/generate');
  return response.data;
};

export const verifyOtp = async (payload: {
  otp: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/otp/verify', payload);
  return response.data;
};

// Withdrawal API
export const validateWithdrawal = async (amount: number): Promise<WithdrawalValidation> => {
  const response = await apiClient.post<{ data: WithdrawalValidation }>(
    '/api/transaction/validateaccount',
    { amount }
  );
  return response.data.data;
};

// Submit Withdrawal API

export const submitWithdrawal = async (payload: {
  amount: number;
  description: string;
  pin: string;
  account_name: string;
  account_number: string;
  bank_code: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/transaction/withdraw', payload);
  return response.data;
};

// Get school fees
export const getSchoolFees = async (): Promise<{
  fees?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    fees?: Record<string, unknown>[];
    data?: Record<string, unknown>[];
    message?: string;
  }>('/api/fee/getchoolFees');
  return response.data;
};


// Raise fee bill
export const raiseFeeBill = async (payload: Record<string, unknown>): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/fee/raise', payload);
  return response.data;
};

// Update fee bill
export const updateFee = async (billId: string, feeData: Record<string, unknown>): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>(
    `/api/fee/update/${billId}`,
    feeData
  );
  return response.data;
};

// Delete fee bill
export const deleteFeeBill = async (billId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/api/fee/delete/${billId}`
  );
  return response.data;
};

export const getAllCharges = async (): Promise<Charge[]> => {
  const response = await apiClient.get<ChargesResponse | Charge[]>('/api/charge/getallcharges');

  // Handle different response structures
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    const chargesData = (response.data as ChargesResponse).data;
    return Array.isArray(chargesData) ? chargesData : [];
  }

  return [];
};

// Update a charge
export const updateCharge = async (
  chargeId: string,
  payload: UpdateChargePayload
): Promise<{ message: string; data?: Charge }> => {
  try {
    const response = await apiClient.put<{ message: string; data?: Charge }>(
      `/api/charge/updateCharge/${encodeURIComponent(chargeId)}`,
      payload
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update charge.';
      throw new Error(message);
    }
    throw new Error('Failed to update charge.');
  }
};


// Get all school users
export const getAllSchoolUsers = async (): Promise<{
  users?: SchoolUser[];
  data?: SchoolUser[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    users?: SchoolUser[];
    data?: SchoolUser[];
    message?: string;
  }>('/api/users/getallschooluser');
  return response.data;
};

export const getSchoolSecurity = async (): Promise<SecurityUser[]> => {
  try {
    const response = await apiClient.get<SecurityUsersResponse | SecurityUser[]>(
      '/api/users/getschoolsecurity'
    );

    const responseData = response.data;

    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.users)) {
      return responseData.users;
    }

    if (Array.isArray(responseData?.security)) {
      return responseData.security;
    }

    if (Array.isArray(responseData?.securities)) {
      return responseData.securities;
    }

    return [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const responseData = error.response.data as { message?: string } | undefined;
      const message = (responseData?.message || '').toLowerCase();

      if (
        !message ||
        message.includes('no users found in this school') ||
        message.includes('no user found in this school') ||
        message.includes('no users found') ||
        message.includes('not found')
      ) {
        return [];
      }
    }

    throw error;
  }
};

const getNestedString = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const normalizeAttendanceRecord = (entry: unknown, index: number): AttendanceRecord => {
  const record = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
  const student = (record.student && typeof record.student === 'object'
    ? record.student
    : {}) as Record<string, unknown>;
  const security = (record.securityPersonnel && typeof record.securityPersonnel === 'object'
    ? record.securityPersonnel
    : record.security && typeof record.security === 'object'
      ? record.security
      : record.recordedBy && typeof record.recordedBy === 'object'
        ? record.recordedBy
        : {}) as Record<string, unknown>;

  const studentName =
    getNestedString(record, ['studentName', 'name']) ||
    getNestedString(student, ['name', 'studentName']) ||
    `${getNestedString(student, ['firstName'])} ${getNestedString(student, ['lastName'])}`.trim() ||
    'Unknown Student';

  const studentEmail =
    getNestedString(record, ['studentEmail', 'email']) ||
    getNestedString(student, ['email']) ||
    'N/A';

  const rawType =
    getNestedString(record, ['attendanceType', 'type', 'action', 'status']) ||
    'In';

  const formattedType =
    rawType.toLowerCase() === 'out'
      ? 'Out'
      : rawType.toLowerCase() === 'in'
        ? 'In'
        : rawType;

  const time =
    getNestedString(record, ['time', 'createdAt', 'updatedAt', 'timestamp']) ||
    getNestedString(student, ['createdAt']) ||
    '';

  const locationValue = record.location;
  const location =
    typeof locationValue === 'string'
      ? locationValue
      : locationValue && typeof locationValue === 'object'
        ? getNestedString(locationValue as Record<string, unknown>, ['name', 'address', 'label'])
        : '';

  const deviceId =
    getNestedString(record, ['deviceId', 'deviceID', 'device_id']) ||
    (record.device && typeof record.device === 'object'
      ? getNestedString(record.device as Record<string, unknown>, ['id', 'deviceId', 'name'])
      : '') ||
    'N/A';

  const securityPersonnel =
    getNestedString(record, ['securityName', 'securityPersonnelName', 'securityPersonnel']) ||
    getNestedString(record, ['securityEmail']) ||
    getNestedString(security, ['name', 'fullName', 'email']) ||
    `${getNestedString(security, ['firstName'])} ${getNestedString(security, ['lastName'])}`.trim() ||
    'N/A';

  const securityEmail =
    getNestedString(record, ['securityEmail']) ||
    getNestedString(security, ['email']) ||
    '';

  return {
    _id:
      getNestedString(record, ['_id', 'id']) ||
      `${studentEmail || 'attendance'}-${time || 'time'}-${index}`,
    studentId:
      getNestedString(record, ['studentId']) ||
      getNestedString(student, ['_id', 'id', 'student_id']),
    studentName,
    studentEmail,
    attendanceType: formattedType,
    time,
    location: location || 'N/A',
    deviceId,
    securityPersonnel,
    securityEmail,
    createdAt: getNestedString(record, ['createdAt', 'time', 'timestamp']) || time,
  };
};

export const getStudentAttendance = async (studentId: string): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get<AttendanceResponse | AttendanceRecord[] | { data?: { attendance?: AttendanceRecord[]; records?: AttendanceRecord[] } }>(
    `/api/attendance/student/${encodeURIComponent(studentId)}`
  );

  const payload = response.data as
    | AttendanceRecord[]
    | AttendanceResponse
    | { data?: { attendance?: AttendanceRecord[]; records?: AttendanceRecord[] } };
  const rawAttendance = (() => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if ('data' in payload && Array.isArray(payload.data)) {
      return payload.data;
    }

    if ('attendance' in payload && Array.isArray(payload.attendance)) {
      return payload.attendance;
    }

    if ('records' in payload && Array.isArray(payload.records)) {
      return payload.records;
    }

    if ('data' in payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      const nestedData = payload.data as { attendance?: AttendanceRecord[]; records?: AttendanceRecord[] };

      if (Array.isArray(nestedData.attendance)) {
        return nestedData.attendance;
      }

      if (Array.isArray(nestedData.records)) {
        return nestedData.records;
      }
    }

    return [];
  })();

  return rawAttendance.map((entry: AttendanceRecord, index: number) =>
    normalizeAttendanceRecord(entry, index)
  );
};

// Transfer funds
export const transferFunds = async (payload: {
  receiverEmail: string;
  amount: number;
  pin: string;
}): Promise<TransferResponse> => {
  try {
    const response = await apiClient.post<TransferResponse>('/api/transaction/transfer', payload);
    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Transfer failed';

    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as { message?: string; error?: string };
      errorMessage = data.message || data.error || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const lowerMsg = errorMessage.toLowerCase();
    if (lowerMsg.includes('pin')) errorMessage = 'Invalid PIN. Please try again.';
    if (lowerMsg.includes('balance') || lowerMsg.includes('insufficient')) {
      errorMessage = 'Insufficient balance. Please fund your wallet first.';
    }

    throw new Error(errorMessage);
  }
};

const normalizeDisputeList = (
  payload: Dispute[] | { disputes?: Dispute[]; data?: Dispute[]; message?: string } | unknown
): Dispute[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as { disputes?: Dispute[]; data?: Dispute[] };
    if (Array.isArray(record.disputes)) return record.disputes;
    if (Array.isArray(record.data)) return record.data;
  }

  return [];
};

// Get user disputes
export const getUserDisputes = async (): Promise<{
  disputes?: Dispute[];
  data?: Dispute[];
  message?: string;
}> => {
  const response = await apiClient.get<{
    disputes?: Dispute[];
    data?: Dispute[];
    message?: string;
  }>('/api/dispute/getuserdispute');
  return response.data;
};

// Get all disputes for admin management
export const getAllDisputes = async (): Promise<Dispute[]> => {
  const response = await apiClient.get<
    Dispute[] | { disputes?: Dispute[]; data?: Dispute[]; message?: string }
  >('/api/dispute/getalldispute');

  return normalizeDisputeList(response.data);
};

// Update dispute status
export const updateDisputeStatus = async (
  disputeId: string,
  status: string
): Promise<{ message: string; dispute?: Dispute; data?: Dispute }> => {
  const response = await apiClient.put<{ message: string; dispute?: Dispute; data?: Dispute }>(
    `/api/dispute/updatedispute/${disputeId}`,
    { status }
  );
  return response.data;
};

// Create dispute
export const createDisputeApi = async (disputeData: CreateDisputeData): Promise<CreateDisputeResponse> => {
  const response = await apiClient.post<CreateDisputeResponse>(
    '/api/dispute/createdispute',
    disputeData
  );
  return response.data;
};

// Delete agent 
export const deleteAgent = async (agentId: string): Promise<DeleteAgentResponse> => {
  const response = await apiClient.delete<DeleteAgentResponse>(
    `/api/users/delete/${agentId}`
  );
  return response.data;
};

// Get user wallet
export const getUserWallet = async (): Promise<WalletResponse> => {
  const response = await apiClient.get<WalletResponse>('/api/wallet/getuserwallet');
  return response.data;
};

export const updateUserProfile = async (userId: string, profileData: UpdateUserPayload): Promise<UserResponse> => {

  const response = await apiClient.put<UserResponse>(
    `/api/users/update-user/${userId}`,
    profileData
  );
  return response.data;
};

//update passsword
export const updateUserPassword = async (payload: UpdatePasswordPayload): Promise<void> => {
  await apiClient.post('/api/users/updatePassword', payload);
};

//set account pin
export const setAccountPin = async (payload: SetPinPayload): Promise<void> => {
  await apiClient.post('/api/pin/set', payload);
};

// Update an existing PIN
export const updateAccountPin = async (payload: UpdatePinPayload): Promise<void> => {
  await apiClient.post('/api/pin/update', payload);
};


// Service to handle the actual file upload to the server

export const uploadProfileImage = async (profile: File) => {
  const formData = new FormData();
  formData.append('profile', profile);

  const response = await apiClient.post<{ profilePicture: string }>(
    '/api/users/upload-profile',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
};

// Service to update user notification preferences



export const updateNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreferences
) => {
  const response = await apiClient.post(
    `/api/users/update-notifications/${userId}`,
    preferences
  );
  return response.data;
};

//Service to fetch all users (Admin/Management)

export const getAllUsers = async (): Promise<UserData[]> => {
  const response = await apiClient.get('/api/users/getallUsers');

  // We extract the array from response.data.data
  // and tell TypeScript it matches our UserData array.
  return (response.data.data || []) as UserData[];
};

const extractUserList = (payload: unknown): UserData[] => {
  if (Array.isArray(payload)) {
    return payload as UserData[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as {
      data?: UserData[];
      parents?: UserData[];
      parent?: UserData[];
      schools?: UserData[];
      school?: UserData[];
    };

    return (
      record.data ||
      record.parents ||
      record.parent ||
      record.schools ||
      record.school ||
      []
    ) as UserData[];
  }

  return [];
};

const tryUserListEndpoints = async (endpoints: string[]): Promise<UserData[]> => {
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      return extractUserList(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error(`No working endpoint found: ${endpoints.join(', ')}`);
};

const normalizeParentRows = (rows: unknown[]): UserData[] => {
  return rows.map((row, index) => {
    const parent = row as {
      _id?: string;
      parent_id?: string;
      parentName?: string;
      parentEmail?: string;
      parentPhone?: string;
      parentStatus?: string;
      parentAddress?: string;
      createdAt?: string;
      updatedAt?: string;
    };

    const id = parent._id || parent.parent_id || `parent-${index}`;
    const name = parent.parentName || 'Unknown Parent';
    const [firstName = '', ...rest] = name.split(' ');
    const lastName = rest.join(' ');

    return {
      user: {
        _id: id,
        name,
        firstName,
        lastName,
        email: parent.parentEmail || '',
        phone: parent.parentPhone || '',
        role: 'parent',
        status: parent.parentStatus || 'Inactive',
        createdAt: parent.createdAt || '',
        updatedAt: parent.updatedAt || '',
        schoolAddress: parent.parentAddress || ''
      }
    };
  });
};

export const getAllParents = async (): Promise<UserData[]> => {
  const data = await tryUserListEndpoints([
    '/api/users/getallparents',
    '/api/users/getallParents'
  ]);

  const looksLikeFlatParentPayload = data.every((item) => {
    const record = item as unknown as { user?: unknown; parentName?: unknown; parentEmail?: unknown };
    return !record.user && ('parentName' in record || 'parentEmail' in record);
  });

  return looksLikeFlatParentPayload ? normalizeParentRows(data as unknown[]) : data;
};


// Service for school dashboard 


export const getFeeReport = async (params: FeeReportParams = {}): Promise<FeeReport> => {
  // drop empty params so we don't send ?term=&feeType=
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data } = await apiClient.get('/api/fee/report', { params: clean });
  return data.data;
};


// Service to fetch dashboard data for admin overview

export const getAdminDashboardData = async () => {
  const [walletRes, chargesRes, usersRes] = await Promise.all([
    apiClient.get('/api/wallet/getChargesWallets'),
    apiClient.get('/api/charge/getAllCharges'),
    apiClient.get('/api/users/getallUsers')
  ]);

  return {
    wallets: walletRes.data,
    charges: chargesRes.data,
    users: usersRes.data
  };
};

// Get beneficiary emails for fund transfers

export const getBeneficiaryEmails = async (): Promise<string[]> => {
  const response = await apiClient.get<{ beneficiaries: { email: string }[] }>('/api/users/getBeneficiaries');
  const beneficiaries = response.data.beneficiaries || [];
  return beneficiaries.map(b => b.email);
};


// Add beneficiary (for parents to add their children as beneficiaries for fund transfers)
export const addBeneficiary = async (studentId: string) => {
  const response = await apiClient.post(`/api/users/addbeneficiary/${studentId}`);
  return response.data;
};


// Remove beneficiary (for parents to remove their children as beneficiaries for fund transfers)
export const removeBeneficiary = async (studentId: string) => {
  const response = await apiClient.delete(`/api/users/removebeneficiary/${studentId}`);
  return response.data;
};

export const verifyPinOtp = async (otp: string, newPin: string) => {
  const response = await apiClient.post('/api/pin/verifyotp', { otp, newPin });
  return response.data;
};





// Admin Fetch all platform transactions across all user roles (Student, School, Parent, Agent, Store)

export interface TransactionsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: TransactionsPagination;
}

export const getAdminTransactionsPage = async ({
  page = 1,
  limit = 10,
}: { page?: number; limit?: number } = {}): Promise<PaginatedTransactions> => {
  const endpoints = [
    '/api/transaction/getalltransactions',
    '/api/transaction/getalltransaction',
    '/api/transaction/all',
    '/api/transaction/getusertransaction',
    '/api/charge/getAllCharges',
  ];

  // For endpoints that ignore page/limit and return the whole list,
  // slice it here so the UI still paginates correctly.
  const sliceLocally = (list: Transaction[]): PaginatedTransactions => {
    const total = list.length;
    const start = (page - 1) * limit;
    return {
      transactions: list.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  };

  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint, { params: { page, limit } });
      const data = response.data;

      if (Array.isArray(data)) {
        return sliceLocally(data as Transaction[]);
      }

      if (data && typeof data === 'object') {
        const record = data as {
          data?: Transaction[];
          transactions?: Transaction[];
          history?: Transaction[];
          charges?: Transaction[];
          pagination?: Partial<TransactionsPagination>;
        };
        const list = record.data || record.transactions || record.history || record.charges;

        if (Array.isArray(list)) {
          // Server-side pagination: trust the server's meta (an empty page is valid here)
          if (record.pagination && typeof record.pagination.total === 'number') {
            const p = record.pagination;
            const lim = p.limit ?? limit;
            return {
              transactions: list,
              pagination: {
                page: p.page ?? page,
                limit: lim,
                total: p.total as number,
                totalPages: p.totalPages ?? Math.max(1, Math.ceil((p.total as number) / lim)),
              },
            };
          }
          // No pagination meta: endpoint returned everything, slice locally
          if (list.length > 0) {
            return sliceLocally(list);
          }
        }
      }
    } catch {
      console.warn(`Admin transactions endpoint ${endpoint} failed, trying next...`);
    }
  }

  // Fallback to getUserTransactions
  try {
    const res = await getUserTransactions();
    return sliceLocally(res.data || res.transactions || []);
  } catch {
    return sliceLocally([]);
  }
};

// Admin DID 
export const toggleStoreDID = async (storeId: string, enabled: boolean) => {
  const { data } = await apiClient.put(`/api/admin/v1/stores/${storeId}/did`, { enabled });
  return data;
};

export const toggleAgentDID = async (agentId: string, enabled: boolean) => {
  const { data } = await apiClient.put(`/api/did/store/clients/${agentId}/status`, { enabled });
  return data;
};


// Pulls a readable message out of an axios error
export const getApiErrorMessage = (error: unknown): string => {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || 'Something went wrong';
};

const toNumberString = (x: unknown): string => {
  if (typeof x === 'string') return x;
  if (x && typeof x === 'object' && 'number' in x) return String((x as { number: unknown }).number);
  return '';
};

// Accepts [..], { data: [..] } or { data: { numbers: [..] } }
const extractList = <T>(body: unknown): T[] => {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object') {
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object') {
      const firstArray = Object.values(data).find((v): v is unknown[] => Array.isArray(v));
      if (firstArray) return firstArray as T[];
    }
  }
  return [];
};

export const getDidNumbers = async (): Promise<DidNumber[]> => {
  const { data } = await apiClient.get('/api/did/store/numbers');
  return extractList<DidNumber>(data);
};

export const getDidNumberById = async (id: string): Promise<DidNumber> => {
  const { data } = await apiClient.get(`/api/did/store/numbers/${encodeURIComponent(id)}`);
  return data.data;
};

export const createDidNumber = async (input: CreateDidInput): Promise<CreateDidResponse> => {
  const { data } = await apiClient.post('/api/did/store/numbers', input);
  const d = data?.data ?? {};
  return {
    created: d.created ?? [],
    alreadyExists: (d.alreadyExists ?? []).map(toNumberString),
    invalid: (d.invalid ?? []).map(toNumberString),
  };
};

// Bulk: one request per number, using the documented single-number body.
export const createDidNumbers = async (inputs: CreateDidInput[]): Promise<CreateDidBatchResult> => {
  const created: DidNumber[] = [];
  const skipped: { number: string; reason: string }[] = [];

  for (const input of inputs) {
    try {
      const res = await createDidNumber(input);
      created.push(...res.created);
      if (res.created.length === 0) {
        const reason = res.alreadyExists.length
          ? 'Already exists'
          : res.invalid.length
            ? 'Not a valid number'
            : 'Not added';
        skipped.push({ number: input.number, reason });
      }
    } catch (err) {
      skipped.push({ number: input.number, reason: getApiErrorMessage(err) });
    }
  }
  return { created, skipped };
};

export interface AssignDidInput {
  agentId: string;
  from: string;
}

export const assignDidNumber = async (numberId: string, payload: AssignDidInput) => {
  const { data } = await apiClient.post(`/api/did/store/numbers/${encodeURIComponent(numberId)}/assign`, payload);
  return data;
};

export const unassignDidNumber = async (numberId: string) => {
  const { data } = await apiClient.post(`/api/did/store/numbers/${encodeURIComponent(numberId)}/unassign`);
  return data;
};

export const setDidClientRate = async (agentId: string, ratePerMinute: number) => {
  const { data } = await apiClient.post(`/api/did/store/clients/${encodeURIComponent(agentId)}/rates`, {
    ratePerMinute,
    roundingMode: 'nearest',
    roundingIncrement: 0.01,
    appliesTo: 'term',
  });
  return data;
};

export const getDidClientReport = async (
  agentId: string,
  range?: { from?: string; to?: string }
): Promise<DidClientReport> => {
  const { data } = await apiClient.get(`/api/did/store/clients/${encodeURIComponent(agentId)}/report`, {
    params: { format: 'json', ...range },
  });
  return data.data;
};

export const getDidClients = async (): Promise<StoreAgent[]> => {
  const { data } = await apiClient.get("/api/did/store/clients");
  return (data.data as any[]).map((c) => ({
    ...c,
    id: c._id,
    fullName: c.name,
  })) as StoreAgent[];
};

export const getDidClientRate = async (agentId: string): Promise<number | null> => {
  try {
    const { data } = await apiClient.get(`/api/did/store/clients/${agentId}/rates`);
    const d = data?.data ?? data;
    const rate = d?.rate ?? null;
    return rate === null ? null : Number(rate);
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
};

export interface UpdateDidPayload {
  status: string;
  didCreationDate: string;
  didExpiryDate: string;
  notes: string;
  vezetiRef: string;
}

export const updateDidNumber = async (id: string, body: UpdateDidPayload) =>
  (await apiClient.put(`/api/did/store/numbers/${id}`, body)).data;

export const deleteDidNumber = async (id: string) =>
  (await apiClient.delete(`/api/did/store/numbers/${id}`)).data;


export interface DidRate {
  _id: string;
  rate: number;
  ratePerMinute: number;
  status: string;
  deactivatedAt: string | null;
  createdAt?: string;
  agentId: { _id: string } | string;
}

export const getDidRates = async (): Promise<DidRate[]> => {
  const { data } = await apiClient.get('/api/did/store/rates');
  return data?.data ?? [];
};


export const getStoreInvoices = async (
  params: { page?: number; limit?: number } = {}
): Promise<InvoicesResponse> => {
  const { data } = await apiClient.get<InvoicesResponse>("/api/did/store/invoices", {
    params,
  });
  return data;
};

export const getStoreInvoiceById = async (id: string): Promise<InvoiceDetailResponse> => {
  const { data } = await apiClient.get<InvoiceDetailResponse>(
    `/api/did/store/invoices/${encodeURIComponent(id)}`
  );
  return data;
};

// DID agent (self-service)
const pick = (r: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== '') return r[k];
  return undefined;
};
const toNum = (v: unknown): number | null =>
  v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);

const normalizeCall = (raw: unknown, i: number): DidMeCall => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const didObj = r.didNumber && typeof r.didNumber === 'object'
    ? (r.didNumber as Record<string, unknown>)
    : null;

  return {
    id: String(pick(r, ['_id', 'id']) ?? `call-${i}`),
    date: (pick(r, ['callDate', 'dt', 'date']) as string) ?? null,
    caller: String(pick(r, ['sourceCli', 'source_cli', 'caller']) ?? '—'),
    called: String(pick(r, ['destNumber', 'destination', 'called']) ?? '—'),
    did: String(didObj?.number ?? pick(r, ['did', 'number']) ?? '—'),
    direction: String(pick(r, ['direction', 'type']) ?? ''),
    durationSeconds: toNum(pick(r, ['callActualDuration', 'duration', 'actualSeconds'])),
    billedSeconds: toNum(pick(r, ['callBilledDuration', 'billedSeconds'])),
    charge: toNum(pick(r, ['creastechCharge', 'clientCharge', 'charge'])),
  };
};

export const getMyDidCalls = async (params: DidMeCallsParams = {}): Promise<DidMeCallsResult> => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data } = await apiClient.get('/api/did/me/calls', { params: clean });
  return {
    rows: extractList<unknown>(data).map(normalizeCall),
    pagination: data?.pagination ?? null,
  };
};

export const getMyDidReport = async (
  range?: { from?: string; to?: string }
): Promise<DidMeReport> => {
  const { data } = await apiClient.get('/api/did/me/report', {
    params: { format: 'json', ...range },
  });
  return data.data;
};

// Get DID numbers and invoices for the current user (agent)
export const getMyDidNumbers = async (): Promise<DidMeNumber[]> => {
  const { data } = await apiClient.get('/api/did/me/numbers');
  return extractList<DidMeNumber>(data);
};

// Get DID invoices for the current user (agent)
export const getMyDidInvoices = async (): Promise<DidMeInvoice[]> => {
  const { data } = await apiClient.get('/api/did/me/invoices');
  return extractList<DidMeInvoice>(data);
};

// Get a specific DID invoice by ID for the current user (agent)
export const getMyDidInvoiceById = async (id: string): Promise<DidMeInvoiceDetail> => {
  const { data } = await apiClient.get(`/api/did/me/invoices/${encodeURIComponent(id)}`);
  return data.data;
};

// Get DID dashboard data for the current user (agent)
export const getMyDidDashboard = async (
  range?: { from?: string; to?: string }
): Promise<DidMeDashboard> => {
  const { data } = await apiClient.get('/api/did/me/dashboard', { params: range });
  return data.data;
};

// Thrown when the backend says this file was already imported
export class CdrAlreadyImportedError extends Error {
  importId: string;
  importedAt: string;
  constructor(message: string, importId: string, importedAt: string) {
    super(message);
    this.name = 'CdrAlreadyImportedError';
    this.importId = importId;
    this.importedAt = importedAt;
  }
}


// Import a CDR file for the DID store
export const importDidCdr = async (file: File, force = false): Promise<CdrImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data } = await apiClient.post<CdrImportResponse>(
      '/api/did/store/cdr/imports',
      formData,
      { params: force ? { force: true } : undefined, headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as
        | { message?: string; code?: string; data?: { importId?: string; importedAt?: string } }
        | undefined;

      const isDuplicate =
        error.response?.status === 409 ||
        body?.code === 'ALREADY_IMPORTED' ||
        /already imported/i.test(body?.message ?? '');

      if (isDuplicate && body?.data?.importedAt) {
        throw new CdrAlreadyImportedError(
          body.message ?? 'This file was already imported.',
          body.data.importId ?? '',
          body.data.importedAt
        );
      }
    }
    throw error; // everything else falls through to getApiErrorMessage in the page
  }
};


// Get store report table (for DID store)
export const getStoreReportTable = async (
  params: StoreReportTableParams = {}
): Promise<StoreReportTableResponse> => {
  const { data } = await apiClient.get<StoreReportTableResponse>(
    '/api/did/store/reports/table',
    { params }
  );
  return data;
};


// Get All CDR Imports for the store
export const getDidCdrImports = async (
  params: { page?: number; limit?: number } = {}
): Promise<CdrImportsResponse> => {
  const { data } = await apiClient.get<CdrImportsResponse>('/api/did/store/cdr/imports', { params });
  return data;
};


// Make payment for an invoice (for both agent and store scopes)
export const startDidInvoicePayment = async (
  id: string,
  body: { provider: "nomba" | "paystack"; callBackUrl: string }
): Promise<StartPaymentResponse> => {
  const res = await apiClient.post(`/api/did/me/invoices/${id}/pay/gateway`, body);
  return res.data;
};

export const verifyDidInvoicePayment = async (
  id: string,
  reference: string
): Promise<VerifyPaymentResponse> => {
  const res = await apiClient.post(`/api/did/me/invoices/${id}/pay/verify`, { reference });
  return res.data;
};