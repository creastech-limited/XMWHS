// src/utils/revenueStats.ts
import type { Transaction } from '../types';

// Handles ISO strings, timestamps, Date objects, and "M/D/YYYY" strings
// (your screenshot shows 2/17/2026, which can only be month/day).
const parseTxDate = (raw: unknown): Date | null => {
  if (raw instanceof Date) return raw;
  if (typeof raw === 'number') return new Date(raw);
  if (typeof raw !== 'string') return null;

  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) return new Date(+us[3], +us[1] - 1, +us[2]);

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Returns undefined when there is no previous period to compare against,
// so the badge is hidden instead of showing a misleading number.
const pctChange = (current: number, previous: number): number | undefined =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined;

export const computeRevenueStats = (
  transactions: Transaction[] = [],
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
    if (tx.status !== 'Completed') continue; // only collected money

    // Prefer a raw timestamp if your API provides one
    const date = parseTxDate((tx as any).createdAt ?? tx.date);
    if (!date) continue;

    const t = date.getTime();
    const amount = Number(tx.amount) || 0;

    if (t >= startToday && t < startTomorrow) today += amount;
    else if (t >= startYesterday && t < startToday) yesterday += amount;

    if (t >= startMonth && t < startNextMonth) month += amount;
    else if (t >= startLastMonth && t < startMonth) lastMonth += amount;
  }

  return {
    dailyRevenue: today,
    monthRevenue: month,
    todayChange: pctChange(today, yesterday),
    monthChange: pctChange(month, lastMonth),
  };
};