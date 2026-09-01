// src/types/store.ts
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