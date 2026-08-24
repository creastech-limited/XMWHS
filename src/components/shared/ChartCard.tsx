// src/components/shared/ChartCard.tsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

interface PieDataEntry {
  name: string;
  value: number;
  color?: string;
}

interface BarDataEntry {
  month: string;
  fees: number;
}

type ChartData = PieDataEntry[] | BarDataEntry[];

interface ChartCardProps {
  title: string;
  type: 'pie' | 'bar';
  data: ChartData;
  colors?: string[];
  emptyMessage?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  colors = ['#6366f1'],
  emptyMessage = 'No data available',
  className = ''
}) => {
  const hasData = data && data.length > 0 && data.some(item => {
    if ('value' in item) {
      return (item as PieDataEntry).value > 0;
    }
    if ('fees' in item) {
      return (item as BarDataEntry).fees > 0;
    }
    return false;
  });

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data as PieDataEntry[]}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {(data as PieDataEntry[]).map((entry, idx) => (
            <Cell key={idx} fill={entry.color || colors[idx % colors.length]} />
          ))}
        </Pie>
        <RechartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const dataPoint = payload[0].payload as PieDataEntry;
              return (
                <div className="bg-white p-3 shadow-lg rounded-lg border text-sm">
                  <p className="font-semibold text-gray-800">{dataPoint.name}</p>
                  <p className="text-indigo-600">
                    Students: <span className="font-bold">{dataPoint.value}</span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend verticalAlign="bottom" layout="horizontal" />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data as BarDataEntry[]} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} />
        <RechartTooltip />
        <Bar dataKey="fees" fill={colors[0]} radius={[6, 6, 0, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <select
          className="text-sm border border-gray-300 rounded p-1 bg-white text-gray-600"
          aria-label="Chart period"
        >
          <option>This Year</option>
          <option>Last Year</option>
        </select>
      </div>
      <div className="w-full h-64">
        {hasData ? (
          type === 'pie' ? renderPieChart() : renderBarChart()
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};