import type { Agent, Notification } from './index';

// ── Store dashboard: raw API shapes ──
export interface RawDashboardTransaction {
  _id: string;
  createdAt: string;
  amount: number | string;
  category: 'credit' | 'debit' | string;
  status?: string;
  transactionType: string;
  metadata?: {
    senderEmail?: string;
    receiverEmail?: string;
  };
}

export interface AgentRevenueStat {
  email: string;
  name: string;
  totalRevenue: number;
  totalTransactionCount: number;
}

export interface StoreDashboardResponse {
  success: boolean;
  data: {
    wallet?: { balance?: number };
    agentRevenue?: {
      todayRevenue?: number;
      todayTransactionCount?: number;
      totalRevenue?: number;
      totalTransactionCount?: number;
      agents?: AgentRevenueStat[];
    };
    agents?: { total?: number; active?: number };
    transactions?: {
      data?: RawDashboardTransaction[];
      pagination?: { total?: number };
    };
  };
}

export interface RevenueChartResponse {
  data?: {
    points?: { date: string; label?: string; revenue: number | string }[];
  };
}

// ── Store dashboard: mapped shapes ──
export interface DashboardTransaction
  extends Omit<RawDashboardTransaction, 'amount' | 'status'> {
  id: string;
  date: string;
  amount: number;
  customer: string;
  status: 'Completed' | 'Pending' | 'Failed';
  direction: 'credit' | 'debit';
  typeLabel: string;
  agentEmail: string;
  agentName: string;
  counterpartyEmail: string;
}

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
  agentStats: AgentRevenueStat[];
  notifications: Notification[];
}

// ── School dashboard ──
export interface Stats {
  balance: number;
  totalStudents: number;
  totalStores: number;
}

export interface PieDataEntry {
  name: string;
  value: number;
  color: string;
}

export interface BarDataEntry {
  month: string;
  fees: number;
}

export interface Transaction {
  id: string;
  date?: string;
  description: string;
  category: string;
  amount?: number;
  type: 'credit' | 'debit' | 'pending';
  status?: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}