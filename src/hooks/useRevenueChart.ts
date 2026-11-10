// src/hooks/useRevenueChart.ts
import { useCallback, useEffect, useState } from 'react';
import { getRevenueChart, type RevenueChartPeriod } from '../services/api/storeDashboard';
import { mapRevenueChart, type RevenuePoint } from '../utils/Revenuechartmapper';

export const useRevenueChart = () => {
  const [period, setPeriod] = useState<RevenueChartPeriod>('week');
  const [range, setRange] = useState({ from: '', to: '' });
  const [points, setPoints] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const { from, to } = range;
  const rangeValid = period !== 'custom' || (!!from && !!to && from <= to);

  useEffect(() => {
    if (!rangeValid) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const custom = period === 'custom' ? { from, to } : undefined;
        const [current, previous] = await Promise.all([
          getRevenueChart(period, custom),
          // "This week" is drawn against last week, as in the design
          period === 'week' ? getRevenueChart('lastweek').catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;

        const pts = mapRevenueChart(current, period);
        const prev = previous ? mapRevenueChart(previous, 'lastweek') : [];
        setPoints(prev.length ? pts.map((p, i) => ({ ...p, previous: prev[i]?.value })) : pts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load revenue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [period, from, to, rangeValid, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // Same contract as before ({ data, total }) so existing chart components keep working.
  // Future days are null so the line stops at today (last week's line keeps going).
  const data = points.map((p) => ({
    day: p.label,
    thisWeek: p.future ? null : p.value,
    lastWeek: p.previous,
  }));
  const total = points.reduce((sum, p) => sum + (p.future ? 0 : p.value), 0);

  return { data, total, period, setPeriod, range, setRange, rangeValid, loading, error, reload };
};