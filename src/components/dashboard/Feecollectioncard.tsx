import React from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

export interface FeeMonth {
  month: string;
  target: number;            // in millions
  collected: number | null;  // null = not reached yet
  projected?: number;        // shown grey for future months
  current?: boolean;
}

interface Props {
  total: string;
  percent: number;
  targetLabel: string;
  daysToDeadline: number;
  months: FeeMonth[];
}

const CHART_H = 160;

export const FeeCollectionCard: React.FC<Props> = ({ total, percent, targetLabel, daysToDeadline, months }) => {
  const max = Math.max(...months.map((m) => Math.max(m.target, m.collected ?? 0, m.projected ?? 0)));
  const h = (v: number) => Math.max(6, (v / max) * CHART_H);

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="font-semibold text-slate-900">Fee Collection</h3>
          <p className="mt-0.5 text-xs text-slate-500">Monthly totals across term 1</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-900" />Collected</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" />Target</span>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-900">{total}</div>
            <div className="mt-1 text-xs text-slate-500">{percent}% of {targetLabel} term target</div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center text-xs font-semibold text-green-600">
              <ChevronUpIcon className="mr-1 h-3 w-3" />On pace
            </div>
            <div className="mt-1 text-xs text-slate-500">{daysToDeadline} days to deadline</div>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-2 border-b border-slate-200" style={{ height: CHART_H + 24 }}>
          {months.map((m) => (
            <div key={m.month} className="relative flex flex-1 flex-col items-center justify-end">
              {m.current && (
                <div className="absolute -top-1 flex flex-col items-center" style={{ bottom: CHART_H + 4 }}>
                  <span className="text-[10px] font-bold text-amber-600">NOW</span>
                  <span className="h-8 border-l border-dotted border-amber-500" />
                </div>
              )}
              <div className="flex items-end gap-1" style={{ height: CHART_H }}>
                <div className="w-7 rounded-t-md bg-slate-200" style={{ height: h(m.target) }} />
                <div
                  className={`w-7 rounded-t-md ${m.collected === null ? 'bg-slate-300' : 'bg-slate-900'}`}
                  style={{ height: h(m.collected ?? m.projected ?? 0) }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          {months.map((m) => (
            <div key={m.month} className="flex-1 text-center text-xs font-medium text-slate-500">{m.month}</div>
          ))}
        </div>
      </div>
    </div>
  );
};