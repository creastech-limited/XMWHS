// src/services/storeDashboard.ts
// If your other services use an axios instance (with interceptors / base URL), replace the body of
// `request` with: api.get(path, { params }).then((r) => r.data). Nothing else in this file changes.
import type { RevenueChartResponse, StoreDashboardResponse } from '../../types/dashboard';

const API_ORIGIN = 'https://nodes-mxxd.onrender.com';

type Params = Record<string, string | number | undefined>;

const request = async <T>(path: string, params?: Params): Promise<T> => {
  const url = new URL(`${API_ORIGIN}${path}`);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });
  const token = localStorage.getItem('token');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { message?: string }).message;
    throw new Error(msg || `Request failed (${res.status}) · ${path}`);
  }
  return body as T;
};

export const getStoreDashboard = () => request<StoreDashboardResponse>('/api/store/dashboard');

export type RevenueChartPeriod = 'week' | 'lastweek' | 'month' | 'custom';

export const getRevenueChart = (period: RevenueChartPeriod, range?: { from: string; to: string }) =>
  request<RevenueChartResponse>('/api/store/dashboard/revenue-chart', {
    period,
    from: range?.from,
    to: range?.to,
  });