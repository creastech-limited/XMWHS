import type { RevenueChartResponse, StoreDashboardResponse } from '../../types/dashboard';

const API_ORIGIN = 'https://stagingapi.yungmindsinnovative.com.ng';

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