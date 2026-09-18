import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { OptimizeResponse, BatteryConfig } from '../types';

interface BatterySocChartProps {
  response: OptimizeResponse | null;
  battery: BatteryConfig;
}

export const BatterySocChart: React.FC<BatterySocChartProps> = ({ response, battery }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const data = hours.map((h) => {
    const plan = response?.hourly_plan[h];
    return {
      hour: `${h.toString().padStart(2, '0')}:00`,
      SOC: plan ? plan.battery_energy_after_kwh : battery.initial_energy_kwh,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Battery State of Charge (SOC) Trajectory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stored energy level (kWh) across 24 hours. Must respect capacity ceiling and reserve floor.
          </p>
        </div>
        <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
          Capacity: {battery.capacity_kwh} kWh · Min Floor: {battery.minimum_energy_kwh} kWh
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
              unit=" kWh"
              domain={[0, Math.ceil(battery.capacity_kwh * 1.1)]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(value: any) => [`${Number(value || 0).toFixed(1)} kWh`, 'Battery Energy']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {/* Capacity ceiling */}
            <ReferenceLine
              y={battery.capacity_kwh}
              stroke="#059669"
              strokeDasharray="3 3"
              label={{
                value: `Capacity: ${battery.capacity_kwh} kWh`,
                position: 'insideTopRight',
                fill: '#059669',
                fontSize: 10,
              }}
            />

            {/* Minimum reserve floor */}
            <ReferenceLine
              y={battery.minimum_energy_kwh}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Min Floor: ${battery.minimum_energy_kwh} kWh`,
                position: 'insideBottomRight',
                fill: '#ef4444',
                fontSize: 10,
              }}
            />

            <Line
              type="monotone"
              dataKey="SOC"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Stored Energy (kWh)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
