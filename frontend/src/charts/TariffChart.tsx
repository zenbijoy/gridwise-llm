import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { HourData } from '../types';

interface TariffChartProps {
  hours: HourData[];
}

export const TariffChart: React.FC<TariffChartProps> = ({ hours }) => {
  const maxTariff = Math.max(...hours.map((h) => h.tariff_bdt_per_kwh), 1);
  const avgTariff = hours.reduce((s, h) => s + h.tariff_bdt_per_kwh, 0) / (hours.length || 1);

  const data = hours.map((h) => ({
    hour: `${h.hour.toString().padStart(2, '0')}:00`,
    tariff: h.tariff_bdt_per_kwh,
    isPeak: h.tariff_bdt_per_kwh >= maxTariff * 0.85,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Time-of-Use Grid Tariff Schedule
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hourly electricity purchase price (৳ BDT/kWh). High-cost pricing intervals are highlighted in red.
          </p>
        </div>
        <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
          Peak: ৳{maxTariff.toFixed(1)}/kWh · Avg: ৳{avgTariff.toFixed(1)}/kWh
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={2}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit=" ৳"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(value: any) => [`৳${Number(value || 0).toFixed(2)}/kWh`, 'Grid Tariff']}
            />
            <Bar dataKey="tariff" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPeak ? '#ef4444' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
