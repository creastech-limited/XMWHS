import type { RevenueChartPeriod } from '../services/api/storeDashboard';
import type { RevenueChartResponse } from '../types/dashboard';

export interface RevenuePoint {
  label: string;
  value: number;
  previous?: number;
  /** Day hasn't happened yet: the line stops instead of dropping to ₦0. */
  future?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const labelFor = (
  p: { date: string; label?: string },
  period: RevenueChartPeriod,
  index: number
): string => {
  if ((period === 'week' || period === 'lastweek') && p.label) return p.label; // "Mon", "Tue"…
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(p.date ?? '');
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); // local date, no timezone shift
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }); // "5 Oct"
  }
  return p.label ?? String(index + 1);
};

export const mapRevenueChart = (res: RevenueChartResponse, period: RevenueChartPeriod): RevenuePoint[] => {
  const today = localToday();
  return (res.data?.points ?? []).map((p, i) => ({
    label: labelFor(p, period, i),
    value: Number(p.revenue) || 0,
    future: p.date > today, // YYYY-MM-DD compares correctly as text
  }));
};