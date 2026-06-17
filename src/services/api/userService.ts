import { apiClient } from './client';
import type {
  UserResponse,
  StoreCountResponse,
  ClassesResponse,
  TransactionsResponse,  Store, StoreDetails, StoreProfileFormData,
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
import axios from 'axios';

// Get user details
export const getUserDetails = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/api/users/getuserone');
  return response.data;
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
export const getUserTransactions = async (): Promise<TransactionsResponse> => {
  const response = await apiClient.get<TransactionsResponse>('/api/transaction/getusertransaction');
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

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.stores)) {
    return responseData.stores;
  }

  return [];
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

// Get agent count
export const getAgentCount = async (): Promise<number> => {
  const response = await apiClient.get<AgentCountResponse>('/api/users/getagentbyidcount');
  
  const responseData = response.data;
  
  if (typeof responseData === 'number') {
    return responseData;
  } else if (responseData?.data !== undefined && responseData.data !== null) {
    return responseData.data;
  } else if (responseData) {
    return responseData.data;
  }
  
  return 0;
};

// Fetch agents by ID
export const getAgentsById = async (schoolId?: string): Promise<GetAgentsResponse> => {
  const url = schoolId 
    ? `/api/users/getagentbyid?id=${encodeURIComponent(schoolId)}`
    : '/api/users/getagentbyid';
  
  const response = await apiClient.get<GetAgentsResponse>(url);
  return response.data;
};

// Get agents in a store for admin
export const getAgentsInStoreByAdmin = async (storeId: string): Promise<StoreAgent[]> => {
  const response = await apiClient.get<
    | StoreAgent[]
    | {
        data?:
          | StoreAgent[]
          | {
              agent?: StoreAgent[];
              data?: {
                agent?: StoreAgent[];
              };
            };
        agent?: StoreAgent[];
        agents?: StoreAgent[];
      }
  >(`/api/users/getagentinstorebyadmin/${encodeURIComponent(storeId)}`);

  const responseData = response.data;

  const rawAgents = (() => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.agent)) {
      return responseData.agent;
    }

    if (Array.isArray(responseData?.agents)) {
      return responseData.agents;
    }

    if (responseData?.data && !Array.isArray(responseData.data)) {
      if (Array.isArray(responseData.data.agent)) {
        return responseData.data.agent;
      }

      if (responseData.data.data && Array.isArray(responseData.data.data.agent)) {
        return responseData.data.data.agent;
      }
    }

    return [];
  })();

  return rawAgents.map((agent, index) => {
    const normalizedAgent = agent as StoreAgent & {
      _id?: string;
      status?: string;
    };

    return {
      ...normalizedAgent,
      id: normalizedAgent.id || normalizedAgent._id || normalizedAgent.email || `agent-${storeId}-${index}`,
      fullName:
        normalizedAgent.fullName ||
        `${normalizedAgent.firstName || ''} ${normalizedAgent.lastName || ''}`.trim() ||
        'Unnamed Agent'
    };
  });
};

// Register agent
export const registerAgent = async (
  agentData: AgentRegistrationData
): Promise<AgentRegistrationResponse> => {
  const response = await apiClient.post<AgentRegistrationResponse>(
    '/api/users/register',
    agentData
  );
  return response.data;
};


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
