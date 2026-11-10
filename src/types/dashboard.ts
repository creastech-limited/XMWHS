// src/types/dashboard.ts
// Replaces DashboardData in types/store. Shapes mirror GET /api/store/dashboard.
import type { Agent, Notification, Transaction } from './index';

/* ---------- raw API response ---------- */
export interface RawDashboardTransaction {
  _id: string;
  transactionType: string; // wallet_transfer_received | wallet_transfer_sent | transfer_charge | wallet_topup ...
  category: 'credit' | 'debit';
  amount: number;
  status: string; // "success" | "pending" | ...
  reference?: string;
  description?: string;
  createdAt: string;
  owner?: string;
  metadata?: { senderEmail?: string; receiverEmail?: string;[key: string]: unknown };
}

export interface DashboardAgentStat {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  status: string; // "Active" | "Inactive"
  todayRevenue: number;
  todayTransactionCount: number;
  totalRevenue: number;
  totalTransactionCount: number;
}

export interface StoreDashboardResponse {
  success: boolean;
  data: {
    wallet: { balance: number; currency: string };
    agentRevenue: {
      todayRevenue: number;
      todayTransactionCount: number;
      totalRevenue: number;
      totalTransactionCount: number;
      agents: DashboardAgentStat[];
    };
    agents: { total: number; active: number };
    transactions: {
      pagination: { page: number; limit: number; total: number; totalPages: number };
      data: RawDashboardTransaction[];
    };
  };
}

/* ---------- what the UI uses ---------- */
export type DashboardTransaction = Transaction & {
  direction: 'credit' | 'debit';
  typeLabel: string;
  agentEmail: string;
  agentName: string;
  counterpartyEmail: string;
};

export interface DashboardData {
  balance: number;
  dailyRevenue: number;
  todayTransactionCount: number;
  totalRevenue: number;
  totalTransactionCount: number;
  numberOfAgents: number;
  activeAgents: number;
  recentTransactions: DashboardTransaction[];
  transactionsTotal: number;
  topAgents: Agent[];
  agentStats: DashboardAgentStat[];
  notifications: Notification[];
}

/* ---------- GET /api/store/dashboard/revenue-chart ---------- */
export interface RevenueChartResponse {
  success: boolean;
  data: {
    period: string;
    from: string; // YYYY-MM-DD
    to: string;
    totalRevenue: number;
    totalTransactionCount: number;
    points: { date: string; label?: string; revenue: number; transactionCount?: number }[];
  };
}