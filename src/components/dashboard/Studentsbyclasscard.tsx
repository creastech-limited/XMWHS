// src/components/dashboard/StudentsByClassCard.tsx
import React from 'react';

export interface ClassCount { name: string; value: number }

interface Props {
  data: ClassCount[];
  termLabel: string;
}

const PALETTE = [
  { chip: 'bg-indigo-600', bar: 'bg-indigo-600' },
  { chip: 'bg-teal-600', bar: 'bg-teal-600' },
  { chip: 'bg-amber-600', bar: 'bg-amber-600' },
  { chip: 'bg-pink-600', bar: 'bg-pink-600' },
  { chip: 'bg-purple-600', bar: 'bg-purple-600' },
  { chip: 'bg-blue-800', bar: 'bg-blue-800' },
];

export const StudentsByClassCard: React.FC<Props> = ({ data, termLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="font-semibold text-slate-900">Students by Class</h3>
        <p className="mt-0.5 text-xs text-slate-500">{total.toLocaleString()} total · {termLabel}</p>
      </div>

      {data.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">No student data available</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.map((c, i) => {
            const pct = total ? Math.round((c.value / total) * 100) : 0;
            const color = PALETTE[i % PALETTE.length];
            return (
              <li key={c.name} className="flex items-center gap-3 px-6 py-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${color.chip}`}>
                  {c.name.replace(/\s+/g, '').toUpperCase().slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{c.name}</div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100">
                    <div className={`h-1 rounded-full ${color.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="w-10 text-right">
                  <div className="text-sm font-semibold text-slate-900">{c.value}</div>
                  <div className="text-[11px] text-slate-400">{pct}%</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};