import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRevenueChart } from '../../hooks/useRevenueChart';
import type { RevenueChartPeriod } from '../../services/api/storeDashboard';

const DARK = '#0F172A';
const LIGHT = '#E2E8F0';

const PERIODS: { id: RevenueChartPeriod; label: string; legend: string; sub: string }[] = [
  { id: 'week', label: 'This week', legend: 'This week', sub: 'this week' },
  { id: 'lastweek', label: 'Last week', legend: 'Last week', sub: 'last week' },
  { id: 'month', label: 'This month', legend: 'This month', sub: 'this month' },
  { id: 'custom', label: 'Custom', legend: 'Selected range', sub: 'in the selected range' },
];

const dateInput =
  'rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900';

const RevenueChart: React.FC = () => {
  const { data = [], total = 0, period, setPeriod, range, setRange, rangeValid, loading, error, reload } =
    useRevenueChart();

  const current = PERIODS.find((p) => p.id === period) ?? PERIODS[0];
  const lastIndex = data.length - 1;
  const manyPoints = data.length > 10;
  const hasLast = data.some((d) => d.lastWeek !== undefined);
  const hasData = data.some((d) => d.thisWeek > 0 || (d.lastWeek ?? 0) > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Revenue</h3>
          <p className="text-xs text-gray-400 mt-0.5">Collected across all agents</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: DARK }} />
            {current.legend}
          </span>
          {hasLast && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: LIGHT }} />
              Last week
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pt-3 flex flex-wrap gap-1.5" role="group" aria-label="Revenue period">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            aria-pressed={period === p.id}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
              period === p.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="px-5 pt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              className={dateInput}
              value={range.from}
              max={range.to || undefined}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              className={dateInput}
              value={range.to}
              min={range.from || undefined}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </label>
        </div>
      )}

      <div className="px-5 pt-4 pb-2">
        <p className="text-3xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">Collected {current.sub}</p>
      </div>

      <div className={`h-56 px-2 pb-4 transition-opacity ${loading && data.length > 0 ? 'opacity-50' : ''}`}>
        {loading && data.length === 0 ? (
          <div className="mx-3 h-full animate-pulse rounded-lg bg-gray-100" role="status" aria-label="Loading revenue" />
        ) : error ? (
          <div className="mx-3 flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 text-center">
            <p className="text-sm text-gray-600">We couldn't load your revenue chart.</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button
              onClick={reload}
              className="mt-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        ) : !rangeValid ? (
          <div className="mx-3 flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200">
            <p className="text-sm text-gray-500">Pick a start and end date to see revenue.</p>
          </div>
        ) : !hasData ? (
          <div className="mx-3 flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 text-center">
            <p className="max-w-xs text-sm text-gray-500">
              No revenue {current.sub}. It will appear here as your agents collect payments.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `₦${value.toLocaleString()}`,
                  name === 'thisWeek' ? current.legend : 'Last week',
                ]}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E7EB' }}
              />
              {hasLast && (
                <Line
                  type="monotone"
                  dataKey="lastWeek"
                  stroke={LIGHT}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="thisWeek"
                stroke={DARK}
                strokeWidth={2}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dot={(props: any) => {
                  const { cx, cy, index } = props;
                  const isLast = index === lastIndex;
                  if (manyPoints && !isLast) return <g key={`dot-${index}`} />;
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={isLast ? 5 : 3}
                      fill={DARK}
                      stroke={isLast ? '#CBD5E1' : 'none'}
                      strokeWidth={isLast ? 4 : 0}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;