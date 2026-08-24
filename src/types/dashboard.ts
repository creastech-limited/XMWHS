// src/types/dashboard.ts
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
  _id?: string;
  date: string;
  createdAt?: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit' | 'pending';
  category?: string;
  direction?: string;
  status?: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}