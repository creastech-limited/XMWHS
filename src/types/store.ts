import type { Transaction, Agent, Notification } from './index';

export interface StoreStats {
  balance: number;
  dailyRevenue: number;
  numberOfAgents: number;
  growth: {
    revenue: number;
    agents: number;
  };
}

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

export interface StoreApiResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

export interface CdrUnmatchedNumber {
  number: string;
  calls: number;
  _id: string;
}

export interface CdrImportResult {
  fileName: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalRows: number;
  inserted: number;
  duplicates: number;
  skippedNoAnswer: number;
  unmatched: number;
  unassigned: number;
  unpriced: number;
  failed: number;
  unmatchedNumbers: CdrUnmatchedNumber[];
  rowErrors: unknown[];
}

export interface CdrImportResponse {
  success: boolean;
  message: string;
  data: CdrImportResult;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CdrImportInvoice {
  _id: string;
  invoiceId: string;
  invoiceNumber: string;
  agentId: string;
  totalAmount: number;
  callCount: number;
}

export interface CdrImportRecord {
  _id: string;
  fileName: string;
  importedBy: { _id: string; name: string; email: string };
  periodStart: string;
  periodEnd: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalRows: number;
  inserted: number;
  duplicates: number;
  skippedNoAnswer: number;
  unmatched: number;
  unassigned: number;
  unpriced: number;
  failed: number;
  errorMessage: string | null;
  importedAt: string;
  invoices?: CdrImportInvoice[];
}

export interface CdrImportsResponse {
  success: boolean;
  message: string;
  pagination: Pagination;
  data: CdrImportRecord[];
}