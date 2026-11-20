export interface AgentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  companyName: string;
  companyEmail: string;
}

export interface AgentFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  companyName?: string;
  companyEmail?: string;
}

export interface AgentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  store_id: string;
  schoolId: string;
  isStandAlone: boolean;
}

export type DidRef = string | { _id: string; name?: string; fullName?: string; email?: string };

export interface DidNumber {
  _id: string;
  number: string;
  assignedTo: DidRef | null;
  assignedAt?: string | null;
  status: string;
  didCreationDate?: string | null;
  didExpiryDate?: string | null;
  source?: string | null;
  storeId?: string;
  vezetiRef?: string | null;
  notes?: string | null;
  createdBy?: string;
  assignmentHistory?: AssignmentHistoryEntry[];
  createdAt?: string;
}

export interface DidAgentRef {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface AssignmentHistoryEntry {
  _id: string;
  agentId: DidAgentRef | string | null;
  from: string;
  to: string | null;
  assignedBy?: string;
}

export interface CreateDidInput {
  number: string;
  didCreationDate: string;
  didExpiryDate: string;
  notes?: string;
  vezetiRef?: string;
}

export interface CreateDidResponse {
  created: DidNumber[];
  alreadyExists: string[];
  invalid: string[];
}

export interface SkippedDidNumber {
  number: string;
  reason: string;
}

export interface CreateDidBatchResult {
  created: DidNumber[];
  skipped: SkippedDidNumber[];
}

export interface DidClientReport {
  client: { _id: string; name: string };
  period: { from: string; to: string };
  totals: {
    calls: number;
    actualSeconds: number;
    billedSeconds: number;
    billedMinutes: number;
    sourceCharge: number;
    clientCharge: number;
    margin: number;
    clientPerMinute: number;
  };
  reportTotals: {
    calls: number;
    totalDuration: number;
    totalBilledDuration: number;
    totalCallChargedVezeti: number;
    totalCallChargeFromRate: number;
  };
  byDid: Record<string, unknown>[];
  callBands: {
    band: string;
    fromSec: number;
    toSec: number | null;
    calls: number;
    avgPerMin: number | null;
    lowestPerMin: number | null;
    highestPerMin: number | null;
  }[];
}




export type InvoiceStatus = "pending" | "paid" | string;

export interface InvoiceAgent {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  agentId: InvoiceAgent;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: InvoiceStatus;
  storeId: string;
  callCount: number;
  totalDuration: number;
  billedSeconds: number;
  sourceCharge: number;
  paidAt: string | null;
  createdBy: string;
  invoiceDate: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InvoicesResponse {
  success: boolean;
  message: string;
  pagination: Pagination;
  data: Invoice[];
}

export interface InvoiceDetailAgent extends InvoiceAgent {
  phone: string;
  store_id: string;
  status: string;
  createdAt: string;
  isDIDAgent: boolean;
}

export interface InvoiceDidBreakdown {
  didNumberId: string;
  number: string;
  calls: number;
  actualSeconds: number;
  billedSeconds: number;
  billedMinutes: number;
  sourceCharge: number;
  clientCharge: number;
  margin: number;
  clientPerMinute: number;
  lowestPerMin: number;
  highestPerMin: number;
}

export interface InvoiceDetail extends Omit<Invoice, "agentId"> {
  agentId: InvoiceDetailAgent;
  byDid: InvoiceDidBreakdown[];
}

export interface InvoiceDetailResponse {
  success: boolean;
  message: string;
  data: InvoiceDetail;
}


export interface DidMeNumber {
  _id: string;
  number: string;
  assignedAt: string | null;
  status: string;
  didCreationDate: string | null;
  didExpiryDate: string | null;
}

export interface DidMeReportByDid {
  number?: string;
  calls?: number;
  billedMinutes?: number;
  clientPerMinute?: number;
  clientCharge?: number;
  [key: string]: unknown;
}

export interface DidMeCallBand {
  band: string;
  fromSec: number;
  toSec: number | null;
  calls: number;
  avgPerMin: number | null;
  lowestPerMin: number | null;
  highestPerMin: number | null;
}

export interface DidMeReport {
  period: { from: string; to: string };
  totals: {
    calls: number;
    actualSeconds: number;
    billedSeconds: number;
    billedMinutes: number;
    clientCharge: number;
    clientPerMinute: number;
  };
  reportTotals: {
    calls: number;
    totalDuration: number;
    totalBilledDuration: number;
    totalCallChargeFromRate: number;
  };
  byDid: DidMeReportByDid[];
  callBands: DidMeCallBand[];
}

export interface DidMeInvoice {
  _id: string;
  invoiceNumber: string;
  agentId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: string;
  storeId: string;
  callCount: number;
  totalDuration: number;
  billedSeconds: number;
  paidAt: string | null;
  invoiceDate: string;
  createdAt: string;
}

export interface DidMeInvoiceByDid {
  didNumberId: string;
  number: string;
  calls: number;
  actualSeconds: number;
  billedSeconds: number;
  billedMinutes: number;
  clientCharge: number;
  clientPerMinute: number;
  lowestPerMin: number;
  highestPerMin: number;
}

export interface DidMeInvoiceDetail extends DidMeInvoice {
  byDid: DidMeInvoiceByDid[];
}

export interface DidMeCall {
  id: string;
  date: string | null;
  caller: string;
  called: string;
  did: string;
  direction: string;
  durationSeconds: number | null;
  billedSeconds: number | null;
  charge: number | null;
}

export interface DidMeCallsParams {
  from?: string;
  to?: string;
  didNumberId?: string;
  direction?: "term" | "orig" | "";
  number?: string;
  page?: number;
  limit?: number;
}

export interface DidMeCallsResult {
  rows: DidMeCall[];
  pagination: Pagination | null;
}

export interface DidMeRecentCall {
  _id: string;
  didNumber: { _id: string; number: string } | null;
  callDate: string;
  callActualDuration: number;
  callBilledDuration: number;
  createchChargePerMin: number;
  creastechCharge: number;
  direction: string;
  sourceCli: string;
  destNumber: string;
  destName?: string;
}

export interface DidMeDashboard {
  period: { from: string; to: string };
  totals: {
    calls: number;
    actualSeconds: number;
    billedSeconds: number;
    billedMinutes: number;
    clientCharge: number;
    clientPerMinute: number;
  };
  byDid: DidMeInvoiceByDid[];
  numbers: DidMeNumber[];
  recentCalls: DidMeRecentCall[];
}

export interface StoreReportRow {
  agentId: string;
  agent: string;
  dt: string;
  sourceCli: string;
  duration: number;
  durationRoundedUp: number;
  customerCharge: number;
  ccps: number;
  ccpm: number;
  cc: number;
  pricePerSecond: number;
  pricePerMin: number;
  matchesFormula: boolean;
}

export interface StoreReportTotals {
  calls: number;
  totalDuration: number;
  totalBilledDuration: number;
  totalCallChargedVezeti: number;
  totalCallChargeFromRate: number;
}

export interface StoreReportTable {
  period: { from: string; to: string };
  columns: { key: string; label: string }[];
  rows: StoreReportRow[];
  totals: StoreReportTotals;
}

export interface StoreReportTableResponse {
  success: boolean;
  message: string;
  pagination: Pagination;
  data: StoreReportTable;
}

export interface StoreReportTableParams {
  from?: string;
  to?: string;
  agentId?: string;
  didNumberId?: string;
  page?: number;
  limit?: number;
}

export interface StartPaymentResponse {
  success: boolean;
  message: string;
  data: {
    provider: string;
    reference: string;
    checkoutLink: string;
    amount: number;
  };
}

export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  transaction: { reference: string; status: string; amount: number };
}