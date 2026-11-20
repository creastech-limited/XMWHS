import type { DashboardTransaction } from '../types/dashboard';

const pctChange = (current: number, previous: number): number | undefined =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined;

export const computeRevenueStats = (
  transactions: DashboardTransaction[] = [],
  now: Date = new Date()
) => {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const startToday = new Date(y, m, d).getTime();
  const startTomorrow = new Date(y, m, d + 1).getTime();
  const startYesterday = new Date(y, m, d - 1).getTime();
  const startMonth = new Date(y, m, 1).getTime();
  const startNextMonth = new Date(y, m + 1, 1).getTime();
  const startLastMonth = new Date(y, m - 1, 1).getTime();

  let today = 0;
  let yesterday = 0;
  let month = 0;
  let lastMonth = 0;

  for (const tx of transactions) {
    if (tx.status !== 'Completed') continue;
    if (tx.direction !== 'credit') continue;

    const t = new Date(tx.createdAt).getTime();
    if (Number.isNaN(t)) continue;

    if (t >= startToday && t < startTomorrow) today += tx.amount;
    else if (t >= startYesterday && t < startToday) yesterday += tx.amount;

    if (t >= startMonth && t < startNextMonth) month += tx.amount;
    else if (t >= startLastMonth && t < startMonth) lastMonth += tx.amount;
  }

  return {
    todayRevenue: today,
    monthRevenue: month,
    todayChange: pctChange(today, yesterday),
    monthChange: pctChange(month, lastMonth),
  };
};